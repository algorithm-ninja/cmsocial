BEGIN;
	ALTER TABLE social_contests ADD COLUMN cookie_domain VARCHAR;
ROLLBACK;
