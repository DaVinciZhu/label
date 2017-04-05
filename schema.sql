drop table if exists ourResult;
drop table if exists otherResult;
drop table if exists entries;
pragma foreign_keys = ON;
-- PRAGMA synchronous = OFF; --

create table ourResult (
  id string primary key, --autoincrement,
  img string not null,
  box_ string not null,
  word string not null,
  box_flag bool,
  word_flag bool,
  right_word string,
  has_labeled bool,
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
  has_labeled bool
);
