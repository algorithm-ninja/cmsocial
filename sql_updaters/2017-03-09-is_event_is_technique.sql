begin;

alter table tags add is_event default 'f' not null;
alter table tags alter is_event drop default;
alter table tags add is_technique default 'f' not null;
alter table tags alter is_technique drop default;

rollback;
