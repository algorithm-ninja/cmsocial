BEGIN;
  ALTER TABLE social_tasks ADD COLUMN score_multiplier FLOAT NOT NULL DEFAULT 1.0;
  CREATE INDEX ON social_tasks (score_multiplier);
ROLLBACK;
