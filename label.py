# all the imports
import os
import createPicture
#import sqlite3
from sqlite3 import dbapi2 as sqlite3
import json
from flask import Flask, request, session, g, redirect, url_for, \
     abort, render_template, flash

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

@app.teardown_appcontext
def close_db(error):
    if hasattr(g,'sqlite_db'):
        g.sqlite_db.close()

@app.route('/')
def load_json():
    # db = get_db()
    # cur = db.execute('select title, text from entries order by id desc')
    #entries = cur.fetchall()#[dict(title=row[0], text=row[1]) for row in cur.fetchall()]

    return render_template('show_pictures.html')
@app.route('/images', methods=['POST'])
def get_images():
        #files = os.listdir('static/BoxImags')
        #jpgs = [file for file in files if file.endswith('jpg')]
        data = { 'images': [] }
        other_images = []
        #data['images'] = jpgs
        # get all images msg from db
        db = get_db()
        cur = db.execute('SELECT  id, has_labeled, correspondid from ourResult;')
        entries = cur.fetchall()
        for entry in entries:
            if not entry['has_labeled']:
                our_image = 'our_'+entry['id']+'.jpg'
                other_image = None
                if entry['correspondid']:
                    other_image = 'other_' + entry['correspondid'] + '.jpg'
                    other_images.append(entry['correspondid'])
                data['images'].append([our_image, other_image])

        cur = db.execute('SELECT  id, has_labeled from otherResult;')
        entries = cur.fetchall()
        for entry in entries:
            if not entry['has_labeled'] and (entry['id'] not in other_images):
                data['images'].append([None, 'other_'+entry['id']+'.jpg'])
        # return json.dumps(data)
        return json.dumps(data)
        
@app.route('/storagedb', methods=['POST'])
def storage_db():
    print request.data
    data = request.data
    data = json.loads(data)

    our_img_id, other_img_id = data['our']['id'], data['other']['id']
    try:
        db = get_db()
        if our_img_id:
            print our_img_id
            db.execute("UPDATE ourResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true' WHERE id = ?",
                    [data['our']['box_flag'], data['our']['word_flag'], data['our']['right_word'], our_img_id])
        if other_img_id:
            db.execute("UPDATE otherResult SET box_flag = ?, word_flag = ?, right_word = ?, has_labeled = 'true' WHERE id = ?",
                    [data['other']['box_flag'], data['other']['word_flag'], data['other']['right_word'],  other_img_id])
        db.commit()
        return json.dumps({'msg': 'ok'})
    except Exception, e:
        return json.dumps({'msg': e})

@app.route('/add', methods=['POST'])
def add_entry():
    if not session.get('logged_in'):
        abort(401)
    db = get_db()
    db.execute('insert into entries (title, text) values (?, ?)',
                 [request.form['title'], request.form['text']])
    db.commit()
    flash('New entry was successfully posted')
    return redirect(url_for('show_entries'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form['username'] != app.config['USERNAME']:
            error = 'Invalid username'
        elif request.form['password'] != app.config['PASSWORD']:
            error = 'Invalid password'
        else:
            session['logged_in'] = True
            flash('You were logged in')
            return redirect(url_for('show_entries'))
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    flash('You were logged out')
    return redirect(url_for('show_entries'))

if __name__ == '__main__':
    #createPicture
	app.run(host='0.0.0.0', debug=True)
