\timing
BEGIN;

-- disable all the triggers
SET session_replication_role = replica;

\echo announcements
ALTER TABLE public.announcements
    ADD COLUMN admin_id integer;
ALTER TABLE public.announcements
    ADD CONSTRAINT announcements_admin_id_fkey FOREIGN KEY (admin_id)
    REFERENCES public.admins (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
CREATE INDEX ix_announcements_admin_id
    ON public.announcements USING btree
    (contest_id ASC NULLS LAST)
    TABLESPACE pg_default;


\echo contests
ALTER TABLE public.contests
    DROP COLUMN allowed_localizations;
ALTER TABLE public.contests
    ADD COLUMN allowed_localizations character varying[] NOT NULL DEFAULT '{}';
ALTER TABLE public.contests
    ALTER COLUMN languages TYPE character varying[] USING string_to_array(languages, ',');

ALTER TABLE public.contests
    ADD COLUMN allow_registration boolean NOT NULL DEFAULT 'f';


\echo datasets
ALTER TABLE public.datasets
    ALTER COLUMN memory_limit TYPE bigint;

ALTER TABLE public.datasets
    ALTER COLUMN task_type_parameters TYPE jsonb USING task_type_parameters::jsonb;

ALTER TABLE public.datasets
    ALTER COLUMN score_type_parameters TYPE jsonb USING score_type_parameters::jsonb;


\echo evaluations
UPDATE public.evaluations
    SET "text" = '[]' WHERE "text" IS NULL; -- Time: 15877.404 ms (00:15.877)
UPDATE public.evaluations
    SET "text" = REPLACE("text", '%d', '%s'); -- Time: 951369.001 ms (15:51.369)
ALTER TABLE public.evaluations
    ADD COLUMN text_new character varying[];
UPDATE public.evaluations
    SET text_new = ARRAY(SELECT json_array_elements_text("text"::json))::character varying[]; -- Time: 1123580.539 ms (18:43.581)
ALTER TABLE public.evaluations
    DROP COLUMN "text";
ALTER TABLE public.evaluations
    RENAME COLUMN text_new TO "text";
ALTER TABLE public.evaluations
    ALTER COLUMN "text" SET NOT NULL; -- Time: 14155.878 ms (00:14.156)

ALTER TABLE public.evaluations
    ALTER COLUMN execution_memory TYPE bigint; -- Time: 206478.588 ms (03:26.479)


\echo fsobjects
ALTER TABLE public.fsobjects
    ALTER COLUMN loid TYPE oid;


\echo messages
ALTER TABLE public.messages
    ADD COLUMN admin_id integer;
ALTER TABLE public.messages
    ADD CONSTRAINT messages_admin_id_fkey FOREIGN KEY (admin_id)
    REFERENCES public.admins (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
CREATE INDEX ix_messages_admin_id
    ON public.messages USING btree
    (admin_id ASC NULLS LAST)
    TABLESPACE pg_default;


\echo printjobs
DROP TABLE printjobs;
CREATE TABLE public.printjobs
(
    id SERIAL NOT NULL,
    participation_id integer NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    filename character varying COLLATE pg_catalog."default" NOT NULL,
    digest character varying COLLATE pg_catalog."default" NOT NULL,
    done boolean NOT NULL,
    status character varying[] COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT printjobs_pkey PRIMARY KEY (id),
    CONSTRAINT printjobs_participation_id_fkey FOREIGN KEY (participation_id)
        REFERENCES public.participations (id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
CREATE INDEX ix_printjobs_participation_id
    ON public.printjobs USING btree
    (participation_id ASC NULLS LAST)
    TABLESPACE pg_default;


\echo questions
ALTER TABLE public.questions
    ADD COLUMN admin_id integer;
ALTER TABLE public.questions
    ADD CONSTRAINT questions_admin_id_fkey FOREIGN KEY (admin_id)
    REFERENCES public.admins (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
CREATE INDEX ix_questions_admin_id
    ON public.questions USING btree
    (admin_id ASC NULLS LAST)
    TABLESPACE pg_default;


\echo submission_results
ALTER TABLE public.submission_results
    ALTER COLUMN compilation_outcome TYPE compilation_outcome USING compilation_outcome::compilation_outcome; -- Time: 28078.010 ms (00:28.078)
UPDATE public.submission_results
    SET compilation_text = '[]' WHERE compilation_text IS NULL;
ALTER TABLE public.submission_results
    ADD COLUMN compilation_text_new character varying[];
UPDATE public.submission_results
    SET compilation_text_new = ARRAY(SELECT json_array_elements_text(compilation_text::json))::character varying[]; -- Time: 103581.364 ms (01:43.581)
ALTER TABLE public.submission_results
    DROP COLUMN compilation_text;
ALTER TABLE public.submission_results
    RENAME COLUMN compilation_text_new TO compilation_text;
ALTER TABLE public.submission_results
    ALTER COLUMN compilation_text SET NOT NULL;

ALTER TABLE public.submission_results
    ALTER COLUMN compilation_memory TYPE bigint; -- Time: 35748.545 ms (00:35.749)

ALTER TABLE public.submission_results
    ALTER COLUMN evaluation_outcome TYPE evaluation_outcome USING evaluation_outcome::evaluation_outcome; -- Time: 52958.690 ms (00:52.959)

ALTER TABLE public.submission_results
    ALTER COLUMN score_details TYPE jsonb USING score_details::jsonb;  -- Time: 168110.600 ms (02:48.111)

ALTER TABLE public.submission_results
    ALTER COLUMN public_score_details TYPE jsonb USING public_score_details::jsonb; -- Time: 114823.649 ms (01:54.824)

ALTER TABLE submission_results
    ADD COLUMN ranking_score_details_new character varying[];
UPDATE submission_results
    SET ranking_score_details_new = ARRAY(SELECT json_array_elements_text(ranking_score_details::json))::character varying[];  -- Time: 87976.580 ms (01:27.977)
ALTER TABLE submission_results
    DROP COLUMN ranking_score_details;
ALTER TABLE submission_results
    RENAME COLUMN ranking_score_details_new TO ranking_score_details;


\echo tasks
ALTER TABLE public.tasks
    ADD COLUMN submission_format character varying[] COLLATE pg_catalog."default" NOT NULL DEFAULT '{}';
UPDATE public.tasks
    SET submission_format = array(select filename from submission_format_elements where task_id = tasks.id)::character varying[];

ALTER TABLE tasks
    ADD COLUMN primary_statements_new character varying[];
UPDATE tasks
    SET primary_statements_new = ARRAY(SELECT json_array_elements_text(primary_statements::json))::character varying[];
ALTER TABLE tasks
    DROP COLUMN primary_statements;
ALTER TABLE tasks
    RENAME COLUMN primary_statements_new TO primary_statements;

ALTER TABLE public.tasks
    ADD COLUMN feedback_level feedback_level DEFAULT 'full' NOT NULL;

-- re-enable all the triggers
SET session_replication_role = DEFAULT;

\echo user_tests
DELETE FROM user_tests;
ALTER TABLE user_test_results
    ALTER COLUMN compilation_text TYPE character varying[] USING compilation_text::character varying[];
ALTER TABLE user_test_results
    ALTER COLUMN compilation_text SET NOT NULL;
ALTER TABLE user_test_results
    ALTER COLUMN evaluation_text TYPE character varying[] USING evaluation_text::character varying[];
ALTER TABLE user_test_results
    ALTER COLUMN evaluation_text SET NOT NULL;
ALTER TABLE user_test_results
    ALTER COLUMN compilation_memory TYPE bigint;
ALTER TABLE user_test_results
    ALTER COLUMN execution_memory TYPE bigint;

ALTER TABLE public.users
    DROP COLUMN preferred_languages;
ALTER TABLE public.users
    ADD COLUMN preferred_languages character varying[] NOT NULL DEFAULT '{}';

ALTER TYPE public.score_mode
    ADD VALUE 'max_subtask' AFTER 'max';

-- ROLLBACK;
COMMIT;
