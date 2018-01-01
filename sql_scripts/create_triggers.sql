begin;
  create or replace function on_submission_insert() returns trigger as $$
  begin
    begin
      insert into taskscores (participation_id, task_id, score, time)
      values (new.participation_id, new.task_id, 0, 0);
    exception when unique_violation then
      return null;
    end;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists submission_insert on submissions;
  create trigger submission_insert after insert on submissions for each row execute procedure on_submission_insert();

  create or replace function on_submission_scored() returns trigger as $$
    << vars >>
  declare
    t_id integer;
    p_id integer;
    nsubs integer;
    nsubscorrect integer;
    nusers integer;
    nuserscorrect integer;
    max_score integer;
    max_time float;
  begin
    -- find task and user id.
    select task_id, participation_id into t_id, p_id
    from submissions
    where submissions.id = new.submission_id;

    -- number of submissions
    select count(*) into nsubs
    from submission_results
    inner join submissions on submission_results.submission_id = submissions.id
    where task_id = t_id;

    -- number of correct submissions
    select count(*) into nsubscorrect
    from submission_results
    inner join submissions on submission_results.submission_id = submissions.id
    where task_id = t_id and score::integer = 100;

    -- best score
    select max(score)::integer into max_score
    from submission_results
    inner join submissions on submissions.id = submission_results.submission_id
    where task_id = t_id and participation_id = p_id;

    -- best time
    with tc_info as (
      select json_array_elements(score_details::json) as s_details, submission_id as id
      from submission_results
      inner join submissions on submissions.id = submission_results.submission_id
      where task_id = t_id and participation_id = p_id and score::integer = 100
    )
    select min(s_time) into max_time
    from (
      select max(time) as s_time
      from (
        select (json_array_elements(tc_info.s_details->'testcases')->>'time')::float as time, id
        from tc_info
        where (tc_info.s_details->'testcases') is not null
        union
        select (tc_info.s_details->>'time')::float as time, id
        from tc_info
        where (tc_info.s_details->'testcases') is null
      ) as times
      group by id
    ) as s_times;

    if max_time is null then
      max_time = 0;
    end if;

    update taskscores
    set score = max_score, time = max_time
    where task_id = t_id and participation_id = p_id;

    -- number of users that tried this task
    select count(id) into nusers
    from taskscores
    where task_id = t_id;

    -- number of users that solved this task
    select count(id) into nuserscorrect
    from taskscores
    where task_id = t_id and score::integer = 100;

    update social_tasks
    set nsubs = vars.nsubs, nsubscorrect = vars.nsubscorrect, nusers = vars.nusers, nuserscorrect = vars.nuserscorrect
    where id = t_id;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists submission_scored on submission_results;
  create trigger submission_scored after update or insert on submission_results for each row when (new.score is not null) execute procedure on_submission_scored();

  create or replace function on_user_insert() returns trigger as $$
  begin
    begin
        -- todo: fare meglio di un hard-coded 6
      insert into social_users (id, registration_time, access_level, last_recover)
      values (new.id, now(), 6, '1970-01-01 00:00:00');
    exception when unique_violation then
      return null;
    end;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists user_insert on users;
  create constraint trigger user_insert after insert on users deferrable initially deferred for each row execute procedure on_user_insert();

  create or replace function on_task_insert() returns trigger as $$
  begin
    begin
        -- todo: fare meglio di un hard-coded 7
      insert into social_tasks (id, access_level, help_available, nsubs, nsubscorrect, nusers, nuserscorrect)
      values (new.id, 7, 'f', 0, 0, 0, 0);
    exception when unique_violation then
      return null;
    end;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists task_insert on tasks;
  create constraint trigger task_insert after insert on tasks deferrable initially deferred for each row execute procedure on_task_insert();

  create or replace function on_contest_insert() returns trigger as $$
  begin
    begin
        -- todo: fare meglio di un hard-coded 7
      insert into social_contests (id, access_level, social_enabled, top_left_name, title, recaptcha_public_key, recaptcha_secret_key)
      values (new.id, 7, true, new.name, new.description, NULL, NULL);
    exception when unique_violation then
      return null;
    end;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists contest_insert on contests;
  create constraint trigger contest_insert after insert on contests deferrable initially deferred for each row execute procedure on_contest_insert();

  create or replace function on_participation_insert() returns trigger as $$
  begin
    begin
      insert into social_participations (id, access_level, score, last_help_time, help_count)
      values (new.id, null, 0, '1970-01-01 00:00:00', 0);
    exception when unique_violation then
      return null;
    end;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists participation_insert on participations;
  create constraint trigger participation_insert after insert on participations deferrable initially deferred for each row execute procedure on_participation_insert();

  create or replace function on_taskscore_update() returns trigger as $$
    << vars >>
  declare
    total_score integer;
  begin
    -- total score of participation
    select sum(score*social_tasks.score_multiplier) into total_score
    from taskscores
    join social_tasks on task_id = social_tasks.id
    where participation_id = NEW.participation_id;

    update social_participations
    set score = total_score
    where id = NEW.participation_id;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists taskscore_update on taskscores;
  create trigger taskscore_update after update or insert on taskscores for each row when (new.score is not null) execute procedure on_taskscore_update();


  create or replace function on_social_participation_update() returns trigger as $$
    << vars >>
  declare
    current_access_level integer;
  begin
    -- Current access level
    select new.access_level into current_access_level;

    if current_access_level is null then
      select social_users.access_level into current_access_level
      from social_users
        join participations on participations.user_id = social_users.id
      where participations.id = new.id;
    end if;

    -- Possibly update access level
    if new.score >= 300 and current_access_level = 6 then
      update social_participations
      set access_level = 5
      where id = new.id;
    end if;
    if new.score < 300 and current_access_level = 5 then
      update social_participations
      set access_level = 6
      where id = new.id;
    end if;
    return new;
  end;
  $$ language plpgsql;
  drop trigger if exists social_participation_update on social_participations;
  create trigger social_participation_update
  after update
  on social_participations
  for each row
  when (old.score is distinct from new.score)
  execute procedure on_social_participation_update();

commit;
