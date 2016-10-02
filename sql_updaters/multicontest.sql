BEGIN;
-- Fill up social_contests with sane defaults
INSERT INTO social_contests (id, access_level, social_enabled, top_left_name, title)
    SELECT id, 7, true, name, name FROM contests;

-- Fill up social_participations with sane defaults
INSERT INTO social_participations (id, access_level, score, last_help_time, help_count)
    SELECT id, NULL, 0, '1970-01-01 00:00:00', 0 FROM participations;


-- Remove useless columns from social_users
ALTER TABLE social_users DROP COLUMN score;
ALTER TABLE social_users DROP COLUMN last_help_time;
ALTER TABLE social_users DROP COLUMN help_count;

-- Change TaskScore relationship to participations instead of users
ALTER TABLE taskscores ADD COLUMN participation_id INTEGER;
UPDATE taskscores
    SET participation_id = participations.id
    FROM participations
    INNER JOIN users ON users.id = participations.user_id
    WHERE users.id = taskscores.user_id AND participations.contest_id = 1;
ALTER TABLE taskscores DROP COLUMN user_id;
ALTER TABLE taskscores ALTER COLUMN participation_id SET NOT NULL;
ALTER TABLE taskscores ADD CONSTRAINT taskscores_participation_id_fkey
    FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE taskscores ADD CONSTRAINT taskscores_participation_id_task_id_key
    UNIQUE (participation_id, task_id);

-- Change Test to add a Contest relationship
ALTER TABLE tests ADD COLUMN contest_id INTEGER NOT NULL DEFAULT 1;
ALTER TABLE tests ADD CONSTRAINT tests_contest_id_fkey
    FOREIGN KEY (contest_id) REFERENCES contests(id) ON UPDATE CASCADE ON DELETE CASCADE;

-- Change TestScore relationship to participations instead of users
ALTER TABLE testscores ADD COLUMN participation_id INTEGER;
UPDATE testscores
    SET participation_id = participations.id
    FROM participations
    INNER JOIN users ON users.id = participations.user_id
    WHERE users.id = testscores.user_id AND participations.contest_id = 1;
ALTER TABLE testscores DROP COLUMN user_id;
ALTER TABLE testscores ALTER COLUMN participation_id SET NOT NULL;
ALTER TABLE testscores ADD CONSTRAINT testscores_participation_id_fkey
    FOREIGN KEY (participation_id) REFERENCES participations(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE testscores ADD CONSTRAINT testscores_participation_id_test_id_key
    UNIQUE (participation_id, test_id);

-- Recompute all the participation scores.
UPDATE social_participations
    SET score = (
        SELECT SUM(subquery.score) FROM (
            SELECT score FROM taskscores
                WHERE taskscores.participation_id = social_participations.id
            UNION ALL
            SELECT 0 AS score
        ) AS subquery);

SELECT * FROM social_participations ORDER BY score;

ROLLBACK;
