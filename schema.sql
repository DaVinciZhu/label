drop table if exists users;
drop table if exists ourStatistic;
drop table if exists otherStatistic;
drop table if exists ourResult;
drop table if exists otherResult;
drop table if exists entries;
pragma foreign_keys = ON;
-- PRAGMA synchronous = OFF; --

create table users (
    id integer primary key autoincrement,
    username string not null
);
create table ourStatistic (
    id integer primary key autoincrement,
    username string not null,
    ourbox string not null,
    FOREIGN KEY(username) REFERENCES users(username)
    FOREIGN KEY(ourbox) REFERENCES ourResult(id)
);
create table otherStatistic (
    id integer primary key autoincrement,
    username string not null,
    otherbox string not null,
    FOREIGN KEY(username) REFERENCES users(username)
    FOREIGN KEY(otherbox) REFERENCES otherResult(id)
);
create table ourResult (
  id string primary key, --autoincrement,
  img string not null,
  box_ string not null,
  word string not null,
  box_flag bool,
  word_flag bool,
  right_word string,
  has_labeled bool default('false'),
  processing bool default('false'),
  pnum integer default(0),
  correspondid integer,

  FOREIGN KEY(correspondid) REFERENCES otherResult(id)
  -- CONSTRAINT "不重复规则" UNIQUE('id')
);
create table otherResult (
  id string primary key, --autoincrement,
  img string not null,
  box_ string not null,
  word string not null,
  box_flag bool,
  word_flag bool,
  right_word string,
  has_labeled bool default('false'),
  processing bool default('false'),
  pnum integer default(0)
);
