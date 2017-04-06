# -*- coding: utf-8 -*-
import cv2
import os
import json
import numpy as np
from sqlite3 import dbapi2 as sqlite3
from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash

app = Flask(__name__)
# configuration
app.config.update(dict(
    DATABASE = os.path.join(app.root_path,'label.db'),
    DEBUG = True,
    SECRET_KEY = 'development key',
    USERNAME = 'admin',
    PASSWORD = 'default'
))
#app.config.from_envvar('FLASKR_SETTINGS',silent = True)
app.config.from_object(__name__)

def connect_db():
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv

def get_db():
    if not hasattr(g,'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db

#>>> Produce other's json,the struct is like {'boundingBox':u',,,' , 'text':u''}
def get_other_json(imgfile):
    OtherWords = []
    fn=imgfile
    # print path_ + fn + ".json"
    otherf = file(path_ + fn + ".json")
    others = json.load(otherf)
    index = 0
    for region in others['regions']:
        for line in region['lines']:
            for word in line['words']:
                OtherWords.append(word)#print word
                # print word['boundingBox'],word['text']
                db.execute('insert OR IGNORE into otherResult (id,img,box_,word) values (?,?, ?, ?)',
                             [imgfile + '_' + str(index),imgfile , word['boundingBox'], word['text']])
                index = index + 1
    db.commit()
    otherf.close
    return OtherWords

#>>> Produce our json,the struct is like {'box':[,,,] , 'word':u''}
def get_our_json(imgfile):
    OurWords = []
    # print '\nOurs words:'
    fn = imgfile
    oursf = file(path_ + fn + ".jpg.my.json")
    # print path_ + fn + ".jpg.my.json"
    ours = json.load(oursf)
    # result = json.loads(ours['Result'])
    # print ours
    index = 0

    for region in ours['regions']:
        for line in region['lines']:
            for word in line['words']:
                OurWords.append(word)#print word
                # print word
                # print word['boundingBox'],word['text']
                db.execute('insert OR IGNORE into ourResult (id,img,box_,word) values (?,?, ?, ?)',
                             [imgfile + '_' + str(index),imgfile , word['boundingBox'], word['text']])
                index = index + 1
    # Old Version
    # for line in result:
    #     for word in line:
    #          temp = ''
    #          for i in range(0,3):
    #              temp = temp +  str(word['box'][i]) +','
    #          temp = temp + str(word['box'][3])
    #          word['box'] = temp
    #          OurWords.append(word)#print word
    #          db.execute('insert OR IGNORE into ourResult (id,img,box_,word) values (?,?, ?, ?)',
    #                       [imgfile + '_' + str(index), imgfile ,temp,word['word']])
    #          index = index + 1
    db.commit()
    oursf.close
    return OurWords

def caculteCorrespondid(img):
    indexi = 0
    for ourword in OurWords:
        indexj = 0
        our_box_list = [int(x) for x in ourword['boundingBox'].split(',')]
        x1, y1, x2, y2 = our_box_list[0],our_box_list[1],our_box_list[0] + our_box_list[2],our_box_list[1] + our_box_list[3]
        for otherword in OtherWords:
            other_box_list = [int(x) for x in otherword['boundingBox'].split(',')]
            x11, y11, x22, y22 = other_box_list[0], other_box_list[1], other_box_list[0] + other_box_list[2], other_box_list[1] + other_box_list[3]

            if x11 > x2 or x1 > x22 or y1 > y22 or y11 > y2: indexj += 1; continue
            area = (min(y2, y22) - max(y1, y11)) *(min(x2, x22) - max(x1, x11))
            if area >= (y2-y1) * (x2-x1) * 0.75 or area >= (y22-y11) * (x22-x11) * 0.75:
                our_id = img + '_' + str(indexi)
                other_id = img + '_' + str(indexj)
                db.execute('UPDATE ourResult set correspondid = ? where id = ?', [other_id, our_id])
                if ourword['text'] == otherword['text']:
                    db.execute("UPDATE ourResult set box_flag = 'true',word_flag = 'true' where id = ?",[our_id])
                    db.execute("UPDATE otherResult set box_flag = 'true',word_flag = 'true' where id = ?",[other_id])
                break
            else:
                indexj += 1
        indexi += 1
    db.commit()

def draw_box(words,modle,box,imgfile):
    color = (0,255,0)
    img = cv2.imread(path_ + imgfile +'.jpg')
    max_w = 0
    max_h = 0
    i = 0
    for word in words:
        box_list = [int(x) for x in word[box].split(',')]
        temp = img.copy()
        if box == 'boundingBox':
            cv2.rectangle(temp,(box_list[0],box_list[1]),(box_list[0] + box_list[2],box_list[1] + box_list[3]),color)
            lx = box_list[0]
            ly = box_list[1]
            rx = box_list[0] + box_list[2]
            ry = box_list[1] + box_list[3]
            max_w = box_list[2]
            max_h = box_list[3]
            # if max_w < box_list[2]:
            #     max_w = box_list[2]
            # if max_h < box_list[3]:
            #     max_h = box_list[3]
        else:
            cv2.rectangle(temp,(box_list[0],box_list[1]),(box_list[2],box_list[3]),color)
            lx = box_list[0]
            ly = box_list[1]
            rx = box_list[2]
            ry = box_list[3]
            max_h = ry - ly
            max_w = rx - lx
        y0 = ly - max_h / 2 if (ly - max_h / 2 > 0) else 0
        y1 = ry + max_h / 2 if (ry + max_h / 2 < img.shape[0]) else img.shape[0]
        x0 = lx - max_w  if (lx - max_w  > 0 ) else 0
        x1 = rx + max_w  if (rx + max_w  < img.shape[1]) else img.shape[1]
        roi = temp[y0:y1,x0:x1]
        cv2.imwrite(path_after + modle + '_' + imgfile + '_' + str(i) + '.jpg',roi)
        i += 1
            # if max_w < box_list[2] - box_list[0]:
            #     max_w = box_list[2] - box_list[0]
            # if max_h < box_list[3] - box_list[1]:
            #     max_h = box_list[3]- box_list[1]
        # roi = img[box_list[1] : box_list[1] + box_list[3],box_list[0] : box_list[0] + box_list[2]]
    # i = 0
    # for word in words:
    #     box_list = [int(x) for x in word[box].split(',')]
    #     # roi = img[box_list[1] : box_list[1] + box_list[3] ,box_list[0] : box_list[0] + box_list[2]]
    #     if box == 'boundingBox':
    #         lx = box_list[0]
    #         ly = box_list[1]
    #         rx = box_list[0] + box_list[2]
    #         ry = box_list[1] + box_list[3]
    #     else:
    #         lx = box_list[0]
    #         ly = box_list[1]
    #         rx = box_list[2]
    #         ry = box_list[3]
    #     y0 = ly - max_h / 2 if (ly - max_h / 2 > 0) else 0
    #     y1 = ry + max_h / 2 if (ry + max_h / 2 < img.shape[0]) else img.shape[0]
    #     x0 = lx - max_w / 2 if (lx - max_w / 2 > 0 ) else 0
    #     x1 = rx + max_w / 2 if (rx + max_w / 2 < img.shape[1]) else img.shape[1]
    #     roi = img[y0:y1,x0:x1]
    #     cv2.imwrite(path_after + modle + '_' + imgfile + '_' + str(i) + '.jpg',roi)#,[int(cv2.IMWRITE_JPEG_QUALITY),100])
    #     # if i == 9 and box == 'boundingBox':
    #     #     print y0
    #     #     print y1
    #     #     print lx, max_w ,x0
    #     #     print rx, max_w ,img.shape[0], x1
    #     #     cv2.namedWindow('img')
    #     #     cv2.imshow('img',roi)
    #     #     cv2.waitKey(0)
    #     # print path_after + imgfile + '_' + str(i) + '.jpg'
    #     i = i + 1

path_ = os.path.join(os.getcwd(),'OriImgs/')
path_after = os.path.join(os.getcwd(),'static/')
path_after = path_after + 'BoxImags/'
# print os.getcwd()
# print path_after
#>>> Test path_
#print path_ + '1870698649.jpg'
db = connect_db()
files = os.listdir('OriImgs')
pics = [file_ for file_ in files if file_.endswith('jpg')]
for pic in pics:
    # print pic,"!!"
    OtherWords = get_other_json(pic.split('.')[0])
    OurWords = get_our_json(pic.split('.')[0])
    # print "Ourwords"
    # print OurWords
    draw_box(OtherWords,'other','boundingBox',pic.split('.')[0])
    draw_box(OurWords,'our','boundingBox',pic.split('.')[0])
    caculteCorrespondid(pic.split('.')[0])
#>>> Test JSON
# print OtherWords
# print OurWords
