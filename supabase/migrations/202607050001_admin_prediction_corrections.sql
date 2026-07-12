begin;

create or replace function public.guard_prediction_pick_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  prediction_row public.predictions%rowtype;
  match_row public.tournament_matches%rowtype;
  phase_row public.match_phase%rowtype;
  current_status public.phase_status;
  round_submitted boolean;
begin
  new.updated_at := timezone('utc', now());

  if public.is_admin() then
    return new;
  end if;

  select *
  into prediction_row
  from public.predictions
  where id = new.prediction_id;

  select *
  into match_row
  from public.tournament_matches
  where id = new.match_id;

  if tg_op = 'INSERT' and match_row.round <> 'r32' and (new.home_score is not null or new.away_score is not null) then
    raise exception 'Later-round scores cannot be inserted during initial creation.';
  end if;

  if tg_op = 'UPDATE' and new.predicted_advancing_team_id is distinct from old.predicted_advancing_team_id and prediction_row.is_confirmed then
    raise exception 'Confirmed team picks cannot be changed.';
  end if;

  if tg_op = 'UPDATE' and (
    new.home_score is distinct from old.home_score
    or new.away_score is distinct from old.away_score
  ) then
    if match_row.round = 'r32' then
      if prediction_row.is_confirmed then
        raise exception 'Round of 32 scores are locked after confirmation.';
      end if;
      return new;
    end if;

    if not prediction_row.is_confirmed then
      raise exception 'Prediction must be confirmed before later scores can be edited.';
    end if;

    select exists (
      select 1
      from public.prediction_phase_submissions
      where prediction_id = new.prediction_id
        and round = match_row.round
    )
    into round_submitted;

    if round_submitted then
      raise exception 'This round has already been submitted.';
    end if;

    select *
    into phase_row
    from public.match_phase
    where round = match_row.round;

    current_status := public.effective_status(
      phase_row.opens_at,
      phase_row.closes_at,
      phase_row.manual_override
    );

    if current_status <> 'open' then
      raise exception 'This round is not open.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.get_admin_prediction_corrections()
returns table (
  user_id uuid,
  display_name text,
  prediction_id uuid,
  is_confirmed boolean,
  total_points integer,
  pick_id uuid,
  match_id bigint,
  predicted_advancing_team_id bigint,
  home_score integer,
  away_score integer,
  points integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can inspect prediction corrections.';
  end if;

  return query
  select
    pr.id as user_id,
    pr.display_name,
    p.id as prediction_id,
    p.is_confirmed,
    p.total_points,
    pk.id as pick_id,
    pk.match_id,
    pk.predicted_advancing_team_id,
    pk.home_score,
    pk.away_score,
    pk.points
  from public.profiles pr
  join public.predictions p on p.user_id = pr.id
  join public.prediction_picks pk on pk.prediction_id = p.id
  where not pr.is_admin
  order by lower(pr.display_name), pk.match_id;
end;
$$;

create or replace function public.admin_update_prediction_pick(
  target_prediction_id uuid,
  target_match_id bigint,
  target_home_score integer,
  target_away_score integer,
  target_advancing_team_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update prediction corrections.';
  end if;

  if target_home_score is not null and target_home_score < 0 then
    raise exception 'Home score cannot be negative.';
  end if;

  if target_away_score is not null and target_away_score < 0 then
    raise exception 'Away score cannot be negative.';
  end if;

  if (target_home_score is null) <> (target_away_score is null) then
    raise exception 'Both scores must be provided or both must be empty.';
  end if;

  if target_advancing_team_id is not null and not exists (
    select 1 from public.teams where id = target_advancing_team_id
  ) then
    raise exception 'Advancing team does not exist.';
  end if;

  update public.prediction_picks
  set home_score = target_home_score,
      away_score = target_away_score,
      predicted_advancing_team_id = target_advancing_team_id,
      updated_at = timezone('utc', now())
  where prediction_id = target_prediction_id
    and match_id = target_match_id;

  get diagnostics changed_count = row_count;

  if changed_count <> 1 then
    raise exception 'Prediction pick not found.';
  end if;

  perform public.recompute_scores(target_match_id);
end;
$$;

revoke execute on function public.get_admin_prediction_corrections() from public, anon;
grant execute on function public.get_admin_prediction_corrections() to authenticated;

revoke execute on function public.admin_update_prediction_pick(uuid, bigint, integer, integer, bigint) from public, anon;
grant execute on function public.admin_update_prediction_pick(uuid, bigint, integer, integer, bigint) to authenticated;

commit;
