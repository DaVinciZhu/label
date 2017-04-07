# all the imports
import os
# import createPicture
#import sqlite3
from sqlite3 import dbapi2 as sqlite3
import json
from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

# create our little application :)
app = Flask(__name__)

# configuration
app.config.update(dict(
    DATABASE = os.path.join(app.root_path,'label.db'),
    DEBUG = True,
    SECRET_KEY = 'development key',
    USERNAME = 'zyp',
    PASSWORD = '123'
))
#app.config.from_envvar('FLASKR_SETTINGS',silent = True)

app.config.from_object(__name__)


'''def connect_db():
    return sqlite3.connect(app.config['DATABASE'])'''

def connect_db():
    rv = sqlite3.connect(app.config['DATABASE'])
    rv.row_factory = sqlite3.Row
    return rv

def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql',mode = 'r') as f:
            db.cursor().executescript(f.read())
            db.commit()

def get_db():
    if not hasattr(g,'sqlite_db'):
        g.sqlite_db = connect_db()
    return g.sqlite_db

def change_processing_status(id_list, status):
    db = get_db()
    for own in id_list:
        for id in id_list[own]:
            if id is not None:
                table_name = 'ourResult' if own == 'our' else 'otherResult'
                db.execute("UPDATE "+ table_name + " SET processing = ? WHERE id = ?", [status, id])
    db.commit()
def get_10_data():
    data = { 'images': [] }
    other_images = []
    id_list = {'our': [], 'other':[]}
    #data['images'] = jpgs
    # get all images msg from db
    db = get_db()
    cur = db.execute("SELECT  id, word, correspondid FROM ourResult WHERE has_labeled = 'false' and processing = 'false' LIMIT 10;")
    entries = cur.fetchall()
    for entry in entries:
        our_id = entry['id']
        our_image = 'our_'+entry['id']+'.jpg'
        our_word = entry['word']
        other_image , other_word, other_id = None, None, None
        if entry['correspondid']:
            other_image = 'other_' + entry['correspondid'] + '.jpg'

            cur2 = db.execute('SELECT word FROM otherResult WHERE id = ?', [entry['correspondid']])
            other_entry = cur2.fetchall()[0]
            other_word = other_entry['word']
            other_id = entry['correspondid']

            other_images.append(entry['correspondid'])
        # only send to front-end if word is different
        if str(our_word).strip().lower() != str(other_word).strip().lower():
            data['images'].append(
                {
                    'our': {
                        'image': our_image,
                        'word': our_word,
                        'id': entry['id']
                    },
                    'other': {
                        'image': other_image,
                        'word': other_word,
                        'id': other_id
                    }
                }
            )
            id_list['our'].append(our_id)
            id_list['other'].append(other_id)
    cur = db.execute("SELECT  id, word FROM otherResult WHERE has_labeled = 'false' and processing = 'false' LIMIT 10;")
    entries = cur.fetchall()
    for entry in entries:
        if entry['id'] not in other_images:
            data['images'].append(
                {
                    'our':{
                        'image': None,
                        'word': None,
                        'id': None,
                    },
                    'other':{
                        'image': 'other_'+entry['id']+'.jpg',
                        'word': entry['word'],
                        'id': entry['id']
                    }
                }
            )
            id_list['other'].append(entry['id'])
    change_processing_status(id_list, 'true')
    return data

@app.teardown_appcontext
def close_db(error):
    if hasattr(g,'sqlite_db'):
        g.sqlite_db.close()

@app.route('/')
def load_json():
    # db = get_db()
    # cur = db.execute('select title, text from entries order by id desc')
    #entries = cur.fetchall()#[dict(title=row[0], text=row[1]) for row in cur.fetchall()]
    if 'username' not in session:
        return redirect('/login')
    else:
        if not hasattr(g, 'username'): g.username = []
        if session['username'] not in g.username:
            g.username.append(session['username'])
            db = get_db()
            db.execute('insert into users (username) values (?)', [session['username']])
            db.commit()
        print 'current user is : ' + session['username']

        return render_template('show_pictures.html')
@app.route('/images', methods=['POST'])
def get_images():
        #files = os.listdir('static/BoxImags')
        #jpgs = [file for file in files if file.endswith('jpg')]

        # prevent user clear cookie
        if 'username' not in session:
            redirect('/login')
        else:
            return json.dumps(get_10_data())

@app.route('/storagedb', methods=['POST'])
def storage_db():
    # two_labeled = False
    res_data = {}
    res_data['msg'] = 'ok'
    # prevent user clear cookie
    if 'username' not in session:
        #code is 1 stand for user need login
        return json.dumps({'msg': 'please login before action....', 'code': 1})
    else:
        print 'make storage ....'
        print request.data
        data = request.data
        data = json.loads(data)
        cur_username = session['username']

        our_img_id, other_img_id = data['our']['id'], data['other']['id']
        try:
            db = get_db()
            if our_img_id:

                db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true', processing = 'false' WHERE id = ?",
                        [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'],  our_img_id])
                db.execute("insert into ourStatistic (username,ourbox) values (?,?)", [session['username'],our_img_id])
                # db = get_db()
                # cur = db.execute('SELECT username from ourStatistic WHERE ourbox = ?', [our_img_id])
                # entries = cur.fetchall()
                # usernames = []
                # for entry in entries:
                #     usernames.append(entry['username'])
                # if len(usernames) == 2:
                #     db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true', processing = 'false', pnum = 2 WHERE id = ?",
                #             [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'], our_img_id])
                #     two_labeled = True
                #     res_data['two_labeled'] = two_labeled
                #     return json.dumps(res_data)
                # if cur_username in usernames:
                #     db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'false', processing = 'false', pnum = 1 WHERE id = ?",
                #             [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'], our_img_id])
                # else:
                #     if len(usernames) == 0:
                #         db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'false', processing = 'false', pnum = 1 WHERE id = ?",
                #                 [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'], our_img_id])
                #
                #         db.execute("insert into ourStatistic (username,ourbox) values (?,?)", [session['username'],our_img_id])
                #     else:
                #         username = usernames[0]
                #         cur = db.execute('SELECT box_flag, word_flag, right_word from ourResult WHERE id = ?', [our_img_id])
                #         entries2 = cur.fetchall()
                #         box_flag, word_flag, right_word = entries2[0]['box_flag'], entries2[0]['word_flag'], entries2[0]['right_word']
                #         if data['our']['box_flag'] == box_flag and data['our']['word_flag'] == word_flag and data['our']['right_word'] == right_word:
                #             db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true', processing = 'false', pnum = 2 WHERE id = ?",
                #                     [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'], our_img_id])
                #
                #             db.execute("insert into ourStatistic (username,ourbox) values (?,?)", [session['username'],our_img_id])
                #             two_labeled = True
                #         else:
                #             # is two people labeled is not same, then restore the all field to default state and delete all row about the current `our_img_id`
                #             db.execute("UPDATE ourResult SET box_flag = null, word_flag = null, right_word = null, has_labeled = 'false', processing = 'false', pnum = 0 WHERE id = ?",
                #                     [our_img_id])
                #             db.execute("DELETE from ourStatistic WHERE ourbox = ?", [our_img_id])


            if other_img_id:
                # db = get_db()
                # cur = db.execute('SELECT username from otherStatistic WHERE otherbox = ?', [other_img_id])
                # entries = cur.fetchall()
                # usernames = []
                # for entry in entries:
                #     usernames.append(entry['username'])
                # if len(usernames) == 2:
                #     two_labeled = True
                #     res_data['two_labeled'] = two_labeled
                #     return json.dumps(res_data)
                #
                # if cur_username in usernames:
                #     db.execute("UPDATE otherResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'false', processing = 'false', pnum = 1 WHERE id = ?",
                #             [data['other']['box_flag'], data['other']['word_flag'], data['other']['right_word'], other_img_id])
                # else:
                #     if len(usernames) == 0:
                #         db.execute("UPDATE otherResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'false', processing = 'false', pnum = 1 WHERE id = ?",
                #                 [data['other']['box_flag'], data['other']['word_flag'], data['other']['right_word'], other_img_id])
                #
                #         db.execute("insert into otherStatistic (username,otherbox) values (?,?)", [session['username'], other_img_id])
                #     else:
                #         username = usernames[0]
                #         cur = db.execute('SELECT box_flag, word_flag, right_word from otherResult WHERE id = ?', [other_img_id])
                #         entries2 = cur.fetchall()
                #         box_flag, word_flag, right_word = entries2[0]['box_flag'], entries2[0]['word_flag'], entries2[0]['right_word']
                #         if data['other']['box_flag'] == box_flag and data['other']['word_flag'] == word_flag and data['other']['right_word'] == right_word:
                #             db.execute("UPDATE otherResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true', processing = 'false', pnum = 2 WHERE id = ?",
                #                     [data['other']['box_flag'], data['other']['word_flag'], data['other']['right_word'], other_img_id])
                #
                #             db.execute("insert into otherStatistic (username, otherbox) values (?,?)", [session['username'], other_img_id])
                #             two_labeled = True
                #         else:
                #             # is two people labeled is not same, then restore the all field to default state and delete all row about the current `other_img_id`
                #             db.execute("UPDATE otherResult SET box_flag = null, word_flag = null, right_word = null, has_labeled = 'false', processing = 'false', pnum = 0 WHERE id = ?",
                #                     [other_img_id])
                #             db.execute("DELETE from otherStatistic WHERE otherbox = ?", [other_img_id])
                db.execute("UPDATE otherResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true', processing = 'false' WHERE id = ?",
                        [data['other']['box_flag'], data['other']['word_flag'], data['other']['right_word'],  other_img_id])
                db.execute("insert into otherStatistic (username,otherbox) values (?,?)", [session['username'],other_img_id])
            db.commit()
            # res_data['two_labeled'] = two_labeled
            return json.dumps(res_data)
        except Exception, e:
            return json.dumps({'msg': e})
@app.route('/updateprostatus', methods=['POST'])
def update_processing_status():
    # prevent user clear cookie
    if 'username' not in session:
        return json.dumps({'msg': 'please login before action....', 'code': 1})
    else:
        print 'update_processing_status ...'
        print request.data
        data = request.data
        data = json.loads(data)
        id_list = {'our': [], 'other': [] }
        for image in data['images']:
            id_list['our'].append(image['our']['id'])
            id_list['other'].append(image['other']['id'])
        try:
            change_processing_status(id_list, 'false')
            return json.dumps({'msg': 'ok'})
        except Exception, e:
            return json.dumps({'msg': e})

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        print 'ggggggggg'
        username = request.form['username']
        if not hasattr(g, 'username'): g.username = []
        if username not in g.username:
            g.username.append(username)
            db = get_db()
            db.execute('insert into users (username) values (?)', [username])
            db.commit()

        session['username'] = username
        print 'current user is : ' + session['username']
        return redirect('/')
    if request.method == 'GET':
        print 'hhhhhh'
        if 'username' not in session:
            return render_template('login.html')
        else:
            print 'Login: current user is : ' + session['username']
            return redirect('/')


# @app.route('/add', methods=['POST'])
# def add_entry():
#     if not session.get('logged_in'):
#         abort(401)
#     db = get_db()
#     db.execute('insert into entries (title, text) values (?, ?)',
#                  [request.form['title'], request.form['text']])
#     db.commit()
#     flash('New entry was successfully posted')
#     return redirect(url_for('show_entries'))
#

#
# @app.route('/logout')
# def logout():
#     session.pop('logged_in', None)
#     flash('You were logged out')
#     return redirect(url_for('show_entries'))

if __name__ == '__main__':
    #createPicture
	app.run(host='0.0.0.0', debug=True)
