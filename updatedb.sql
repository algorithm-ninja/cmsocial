BEGIN;
  -- Create/alter tables for users
  CREATE TABLE "social_users" (
    id                INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    access_level      INTEGER NOT NULL,
    score             INTEGER NOT NULL,
    registration_time TIMESTAMP NOT NULL,
    institute_id      INTEGER REFERENCES institutes(id) ON UPDATE CASCADE ON DELETE SET NULL,
    last_help_time    TIMESTAMP NOT NULL DEFAULT to_timestamp(0),
    help_count        INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX "ix_social_users_institute_id" ON social_users (institute_id);

  CREATE SEQUENCE "teams_id_seq" START 1;
  CREATE TABLE "teams" (
    id                INTEGER NOT NULL PRIMARY KEY DEFAULT nextval('teams_id_seq'::regclass),
    code              VARCHAR NOT NULL,
    name              VARCHAR NOT NULL
  );
  CREATE UNIQUE INDEX "teams_code_key" ON teams(code);

  CREATE SEQUENCE participations_id_seq START 1;
  CREATE TABLE "participations" (
    id                INTEGER NOT NULL PRIMARY KEY DEFAULT nextval('participations_id_seq'::regclass),
    ip                VARCHAR,
    starting_time     TIMESTAMP,
    delay_time        INTERVAL NOT NULL CHECK(delay_time >= '00:00:00'::interval),
    extra_time        INTERVAL NOT NULL CHECK(extra_time >= '00:00:00'::interval),
    password          VARCHAR,
    hidden            BOOLEAN NOT NULL,
    contest_id        INTEGER NOT NULL REFERENCES contests(id) ON UPDATE CASCADE ON DELETE CASCADE,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id           INTEGER REFERENCES teams(id) ON UPDATE CASCADE ON DELETE SET NULL
  );
  CREATE UNIQUE INDEX "participations_contest_id_user_id_key" ON participations(contest_id, user_id);
  CREATE INDEX "ix_participations_contest_id" ON participations(contest_id);
  CREATE INDEX "ix_participations_user_id" ON participations(user_id);
  ALTER TABLE users RENAME COLUMN primary_statements TO preferred_languages;

  -- Create/alter tables for tasks
  CREATE TABLE "social_tasks" (
    id                INTEGER NOT NULL PRIMARY KEY REFERENCES tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
    access_level      INTEGER NOT NULL,
    nsubs             INTEGER NOT NULL,
    nsubscorrect      INTEGER NOT NULL,
    nusers            INTEGER NOT NULL,
    nuserscorrect     INTEGER NOT NULL,
    help_available    BOOLEAN NOT NULL DEFAULT 'f'
  );
  CREATE UNIQUE INDEX tasks_name_key ON tasks(name);
  -- Create/alter tables for other stuff
  CREATE UNIQUE INDEX "contests_name_key" ON contests(name);
  ALTER TABLE contests ADD COLUMN submissions_download_allowed BOOLEAN NOT NULL DEFAULT 't';
  ALTER TABLE contests ADD COLUMN ip_autologin BOOLEAN NOT NULL DEFAULT 'f';
  ALTER TABLE tasktags RENAME TO task_tags;

  -- Copy relevant data for users
  INSERT INTO social_users (id, access_level, score, registration_time, institute_id)
  SELECT id, access_level, score, registration_time, institute_id FROM users;

  INSERT INTO participations (id, ip, starting_time, delay_time, extra_time, hidden, contest_id, user_id)
  SELECT id, ip, starting_time, delay_time, extra_time, hidden, contest_id, id FROM users;

  SELECT setval('participations_id_seq', (SELECT max(id)+1 FROM participations), false);

  -- Copy relevant data for tasks
  INSERT INTO social_tasks (id, access_level, nsubs, nsubscorrect, nusers, nuserscorrect)
  SELECT id, access_level, nsubs, nsubscorrect, nusers, nuserscorrect FROM tasks;

  -- Drop useless columns
  ALTER TABLE users DROP COLUMN access_level;
  ALTER TABLE users DROP COLUMN score;
  ALTER TABLE users DROP COLUMN registration_time;
  ALTER TABLE users DROP COLUMN institute_id;
  ALTER TABLE users DROP COLUMN ip;
  ALTER TABLE users DROP COLUMN starting_time;
  ALTER TABLE users DROP COLUMN delay_time;
  ALTER TABLE users DROP COLUMN extra_time;
  ALTER TABLE users DROP COLUMN hidden;
  ALTER TABLE users DROP COLUMN contest_id;
  ALTER TABLE tasks DROP COLUMN access_level;
  ALTER TABLE tasks DROP COLUMN nsubs;
  ALTER TABLE tasks DROP COLUMN nsubscorrect;
  ALTER TABLE tasks DROP COLUMN nusers;
  ALTER TABLE tasks DROP COLUMN nuserscorrect;

  -- Change foreign keys for users/tasks
  ALTER TABLE messages DROP CONSTRAINT messages_user_id_fkey;
  ALTER TABLE messages RENAME COLUMN user_id TO participation_id;
  ALTER TABLE messages ADD CONSTRAINT messages_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE printjobs DROP CONSTRAINT printjobs_user_id_fkey;
  ALTER TABLE printjobs RENAME COLUMN user_id TO participation_id;
  ALTER TABLE printjobs ADD CONSTRAINT printjobs_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE questions DROP CONSTRAINT questions_user_id_fkey;
  ALTER TABLE questions RENAME COLUMN user_id TO participation_id;
  ALTER TABLE questions ADD CONSTRAINT questions_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE submissions DROP CONSTRAINT submissions_user_id_fkey;
  ALTER TABLE submissions RENAME COLUMN user_id TO participation_id;
  ALTER TABLE submissions ADD CONSTRAINT submissions_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE user_tests DROP CONSTRAINT user_tests_user_id_fkey;
  ALTER TABLE user_tests RENAME COLUMN user_id TO participation_id;
  ALTER TABLE user_tests ADD CONSTRAINT user_tests_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;

  ALTER TABLE taskscores DROP CONSTRAINT taskscores_user_id_fkey;
  ALTER TABLE taskscores ADD CONSTRAINT taskscores_participation_id_fkey FOREIGN KEY (user_id) REFERENCES social_users(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE testscores DROP CONSTRAINT testscores_user_id_fkey;
  ALTER TABLE testscores ADD CONSTRAINT testscores_participation_id_fkey FOREIGN KEY (user_id) REFERENCES social_users(id) ON UPDATE CASCADE ON DELETE CASCADE;
  ALTER TABLE task_tags DROP CONSTRAINT tasktags_user_id_fkey;
  ALTER TABLE task_tags ADD CONSTRAINT task_tags_participation_id_fkey FOREIGN KEY (user_id) REFERENCES social_users(id);

  ALTER TABLE task_tags DROP CONSTRAINT tasktags_task_id_fkey;
  ALTER TABLE task_tags ADD CONSTRAINT task_tags_task_id_fkey FOREIGN KEY (task_id) REFERENCES social_tasks(id);

  ALTER TABLE task_tags DROP CONSTRAINT tasktags_pkey;
  ALTER TABLE task_tags ADD CONSTRAINT task_tags_pkey PRIMARY KEY (task_id, tag_id);
  ALTER TABLE task_tags DROP CONSTRAINT tasktags_tag_id_fkey;
  ALTER TABLE task_tags ADD CONSTRAINT task_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES tags(id);

ROLLBACK;
