-- Ocultar a los administradores del ranking global y de la vista de jugadores
-- (peers). Los admins no participan, así que no deben aparecer en ninguna lista
-- comparativa de jugadores.

begin;

-- Ranking sin admins.
create or replace view public.ranking as
select
  pr.display_name,
  coalesce(p.total_points, 0) as total_points
from public.profiles pr
left join public.predictions p on p.user_id = pr.id
where not pr.is_admin
order by coalesce(p.total_points, 0) desc, pr.display_name asc;

grant select on public.ranking to authenticated;

-- Peers (envío inicial) sin admins.
create or replace function public.get_peer_initial()
returns table (
  user_id uuid,
  display_name text,
  has_submitted boolean,
  total_points integer,
  picks jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  my_prediction_id uuid;
  is_allowed boolean;
begin
  select id, is_confirmed
  into my_prediction_id, is_allowed
  from public.predictions
  where user_id = auth.uid();

  if coalesce(is_allowed, false) is false then
    raise exception 'Initial peer visibility is locked.';
  end if;

  return query
  select
    pr.id,
    pr.display_name,
    p.is_confirmed,
    p.total_points,
    case
      when p.is_confirmed then (
        select jsonb_agg(
          jsonb_build_object(
            'match_id', pick.match_id,
            'predicted_advancing_team_id', pick.predicted_advancing_team_id,
            'home_score', case when tm.round = 'r32' then pick.home_score else null end,
            'away_score', case when tm.round = 'r32' then pick.away_score else null end
          )
          order by pick.match_id
        )
        from public.prediction_picks pick
        join public.tournament_matches tm on tm.id = pick.match_id
        where pick.prediction_id = p.id
      )
      else null
    end
  from public.profiles pr
  left join public.predictions p on p.user_id = pr.id
  where pr.id <> auth.uid()
    and not pr.is_admin
  order by pr.display_name asc;
end;
$$;

-- Peers (marcadores por ronda) sin admins.
create or replace function public.get_peer_round_scores(target_round public.round)
returns table (
  user_id uuid,
  display_name text,
  has_submitted boolean,
  picks jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  my_prediction_id uuid;
  viewer_allowed boolean;
begin
  if target_round = 'r32' then
    raise exception 'Use get_peer_initial for round of 32 visibility.';
  end if;

  select id
  into my_prediction_id
  from public.predictions
  where user_id = auth.uid();

  select exists (
    select 1
    from public.prediction_phase_submissions
    where prediction_id = my_prediction_id
      and round = target_round
  )
  into viewer_allowed;

  if not viewer_allowed then
    raise exception 'Peer visibility for this round is locked.';
  end if;

  return query
  select
    pr.id,
    pr.display_name,
    exists (
      select 1
      from public.prediction_phase_submissions pps
      where pps.prediction_id = p.id
        and pps.round = target_round
    ) as has_submitted,
    case
      when exists (
        select 1
        from public.prediction_phase_submissions pps
        where pps.prediction_id = p.id
          and pps.round = target_round
      ) then (
        select jsonb_agg(
          jsonb_build_object(
            'match_id', pick.match_id,
            'home_score', pick.home_score,
            'away_score', pick.away_score
          )
          order by pick.match_id
        )
        from public.prediction_picks pick
        join public.tournament_matches tm on tm.id = pick.match_id
        where pick.prediction_id = p.id
          and tm.round = target_round
      )
      else null
    end
  from public.profiles pr
  join public.predictions p on p.user_id = pr.id
  where pr.id <> auth.uid()
    and not pr.is_admin
  order by pr.display_name asc;
end;
$$;

commit;
