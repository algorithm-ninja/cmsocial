BEGIN;
	CREATE OR REPLACE FUNCTION on_submission_insert() RETURNS TRIGGER AS $$
	DECLARE
		p_id integer;
	BEGIN
		SELECT participation_id INTO p_id
		FROM participations;
		
		BEGIN
			INSERT INTO taskscores (participation_id, task_id, score, time)
			VALUES (p_id, NEW.task_id, 0, 0);
		EXCEPTION WHEN unique_violation THEN
			RETURN NULL;
		END;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;
	DROP TRIGGER IF EXISTS submission_insert ON submissions;
	CREATE TRIGGER submission_insert AFTER INSERT ON submissions FOR EACH ROW EXECUTE PROCEDURE on_submission_insert();

	CREATE OR REPLACE FUNCTION on_submission_scored() RETURNS TRIGGER AS $$
	<< vars >>
	DECLARE
		t_id integer;
		p_id integer;
		nsubs integer;
		nsubscorrect integer;
		nusers integer;
		nuserscorrect integer;
		max_score integer;
		max_time float;
		total_score integer;
	BEGIN
		-- Find task and user ID.
		SELECT task_id, participation_id INTO t_id, p_id
		FROM submissions
		WHERE submissions.id = NEW.submission_id;

		-- Number of submissions
		SELECT count(*) INTO nsubs
		FROM submission_results
		INNER JOIN submissions ON submission_results.submission_id = submissions.id
		WHERE task_id = t_id;

		-- Number of correct submissions
		SELECT count(*) INTO nsubscorrect
		FROM submission_results
		INNER JOIN submissions ON submission_results.submission_id = submissions.id
		WHERE task_id = t_id AND score::integer = 100;

		-- Best score
		SELECT max(score)::integer INTO max_score
		FROM submission_results
		INNER JOIN submissions ON submissions.id = submission_results.submission_id
		WHERE task_id = t_id AND participation_id = p_id;

		-- Best time
		WITH tc_info AS (
			SELECT json_array_elements(score_details::json) AS s_details, submission_id AS id
			FROM submission_results
			INNER JOIN submissions ON submissions.id = submission_results.submission_id
			WHERE task_id = t_id AND participation_id = p_id AND score::integer = 100
		)
		SELECT min(s_time) INTO max_time
		FROM (
			SELECT max(time) AS s_time
			FROM (
				SELECT (json_array_elements(tc_info.s_details->'testcases')->>'time')::float AS time, id
				FROM tc_info
				WHERE (tc_info.s_details->'testcases') IS NOT NULL
				UNION
				SELECT (tc_info.s_details->>'time')::float AS time, id
				FROM tc_info
				WHERE (tc_info.s_details->'testcases') IS NULL
			) AS times
			GROUP BY id
		) AS s_times;

		IF max_time IS NULL THEN
			max_time = 0;
		END IF;

		UPDATE taskscores
		SET score = max_score, time = max_time
		WHERE task_id = t_id AND participation_id = p_id;

		-- Number of users that tried this task
		SELECT count(id) INTO nusers
		FROM taskscores
		WHERE task_id = t_id;

		-- Number of users that solved this task
		SELECT count(id) INTO nuserscorrect
		FROM taskscores
		WHERE task_id = t_id AND score::integer = 100;

		-- Total score of user
		SELECT sum(score) INTO total_score
		FROM taskscores
		WHERE participation_id = p_id;

		UPDATE social_tasks
		SET nsubs = vars.nsubs, nsubscorrect = vars.nsubscorrect, nusers = vars.nusers, nuserscorrect = vars.nuserscorrect
		WHERE id = t_id;

		UPDATE social_participations
		SET score = total_score
		WHERE id = p_id;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;
	DROP TRIGGER IF EXISTS submission_scored ON submission_results;
	CREATE TRIGGER submission_scored AFTER UPDATE OR INSERT ON submission_results FOR EACH ROW WHEN (NEW.score IS NOT NULL) EXECUTE PROCEDURE on_submission_scored();

	CREATE OR REPLACE FUNCTION on_user_insert() RETURNS TRIGGER AS $$
	BEGIN
		BEGIN
		    -- TODO: fare meglio di un hard-coded 6
			INSERT INTO social_users (id, access_level, score, registration_time, last_help_time, help_count)
			VALUES (NEW.id, 6, 0, now(), '1970-01-01 00:00:00', 0);
		EXCEPTION WHEN unique_violation THEN
			RETURN NULL;
		END;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;
	DROP TRIGGER IF EXISTS user_insert ON users;
	CREATE CONSTRAINT TRIGGER user_insert AFTER INSERT ON users DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE PROCEDURE on_user_insert();

	CREATE OR REPLACE FUNCTION on_task_insert() RETURNS TRIGGER AS $$
	BEGIN
		BEGIN
		    -- TODO: fare meglio di un hard-coded 7
			INSERT INTO social_tasks (id, access_level, help_available, nsubs, nsubscorrect, nusers, nuserscorrect)
			VALUES (NEW.id, 7, 'f', 0, 0, 0, 0);
		EXCEPTION WHEN unique_violation THEN
			RETURN NULL;
		END;
		RETURN NEW;
	END;
	$$ LANGUAGE plpgsql;
	DROP TRIGGER IF EXISTS task_insert ON tasks;
	CREATE CONSTRAINT TRIGGER task_insert AFTER INSERT ON tasks DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE PROCEDURE on_task_insert();
COMMIT;

