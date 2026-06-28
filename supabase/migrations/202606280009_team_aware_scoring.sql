begin;

-- Nuevo modelo de puntaje por partido, con dos dimensiones independientes:
--
--   * Equipo: el cruce es el correcto (los dos equipos que el usuario llevó a
--     esa posición coinciden con los reales) Y el equipo que avanza coincide
--     con el oficial. En 16avos, donde los equipos son fijos, equivale a
--     acertar quién avanza.
--   * Marcador: el marcador exacto a 90' coincide con el oficial.
--
--   | equipo | marcador exacto | puntos |
--   |   ✓    |        ✓        |   4    |
--   |   ✓    |        ✗        |   1    |
--   |   ✗    |        ✓        |   2    |
--   |   ✗    |        ✗        |   0    |
--
-- Acertar el equipo de un cruce depende de qué equipos llegaron realmente
-- (resultado oficial de las rondas previas) y de a qué equipos llevó el usuario
-- en su cuadro, así que el recálculo es GLOBAL: reevalúa todos los picks de
-- todas las predicciones. El parámetro target_match_id se conserva por
-- compatibilidad con quien llama, pero ya no acota el recálculo.

create or replace function public.recompute_scores(target_match_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  later_round public.round;
begin
  if not public.is_admin() then
    raise exception 'Only admins can recompute scores.';
  end if;

  -- Ocupantes y equipo que avanza REALES por partido.
  create temporary table tmp_real_occ (
    match_id bigint primary key,
    home_occ bigint,
    away_occ bigint,
    adv bigint
  ) on commit drop;

  -- Ocupantes y equipo que avanza PRONOSTICADOS por (predicción, partido).
  create temporary table tmp_pred_occ (
    prediction_id uuid,
    match_id bigint,
    home_occ bigint,
    away_occ bigint,
    adv bigint,
    primary key (prediction_id, match_id)
  ) on commit drop;

  -- Base: 16avos, donde los equipos son fijos.
  insert into tmp_real_occ (match_id, home_occ, away_occ, adv)
  select m.id, m.home_team_id, m.away_team_id, orr.advancing_team_id
  from public.tournament_matches m
  left join public.official_results orr on orr.match_id = m.id
  where m.round = 'r32';

  insert into tmp_pred_occ (prediction_id, match_id, home_occ, away_occ, adv)
  select pk.prediction_id, m.id, m.home_team_id, m.away_team_id, pk.predicted_advancing_team_id
  from public.prediction_picks pk
  join public.tournament_matches m on m.id = pk.match_id
  where m.round = 'r32';

  -- Rondas posteriores, en orden. Cada cruce se resuelve desde sus dos
  -- alimentadores ya presentes en las tablas temporales (winner = el que
  -- avanza; loser = el otro ocupante del partido alimentador).
  foreach later_round in array array['r16', 'qf', 'sf', 'third', 'final']::public.round[]
  loop
    insert into tmp_real_occ (match_id, home_occ, away_occ, adv)
    select
      m.id,
      case
        when m.home_source_type = 'winner' then hs.adv
        when hs.adv = hs.home_occ then hs.away_occ
        when hs.adv = hs.away_occ then hs.home_occ
        else null
      end,
      case
        when m.away_source_type = 'winner' then aw.adv
        when aw.adv = aw.home_occ then aw.away_occ
        when aw.adv = aw.away_occ then aw.home_occ
        else null
      end,
      orr.advancing_team_id
    from public.tournament_matches m
    join tmp_real_occ hs on hs.match_id = m.home_source_match_id
    join tmp_real_occ aw on aw.match_id = m.away_source_match_id
    left join public.official_results orr on orr.match_id = m.id
    where m.round = later_round;

    insert into tmp_pred_occ (prediction_id, match_id, home_occ, away_occ, adv)
    select
      pk.prediction_id,
      m.id,
      case
        when m.home_source_type = 'winner' then hs.adv
        when hs.adv = hs.home_occ then hs.away_occ
        when hs.adv = hs.away_occ then hs.home_occ
        else null
      end,
      case
        when m.away_source_type = 'winner' then aw.adv
        when aw.adv = aw.home_occ then aw.away_occ
        when aw.adv = aw.away_occ then aw.home_occ
        else null
      end,
      pk.predicted_advancing_team_id
    from public.prediction_picks pk
    join public.tournament_matches m on m.id = pk.match_id
    join tmp_pred_occ hs
      on hs.prediction_id = pk.prediction_id
      and hs.match_id = m.home_source_match_id
    join tmp_pred_occ aw
      on aw.prediction_id = pk.prediction_id
      and aw.match_id = m.away_source_match_id
    where m.round = later_round;
  end loop;

  with scored as (
    select
      pk.id as pick_id,
      case
        when res.match_id is null then 0
        -- cruce correcto + ganador correcto + marcador exacto → 4
        when (
          ro.home_occ is not null
          and ro.away_occ is not null
          and po.home_occ is not distinct from ro.home_occ
          and po.away_occ is not distinct from ro.away_occ
          and res.advancing_team_id is not null
          and pk.predicted_advancing_team_id is not distinct from res.advancing_team_id
          and pk.home_score is not null
          and pk.away_score is not null
          and pk.home_score = res.home_score
          and pk.away_score = res.away_score
        ) then 4
        -- ganador correcto (con o sin cruce) → 1
        when (
          res.advancing_team_id is not null
          and pk.predicted_advancing_team_id is not distinct from res.advancing_team_id
        ) then 1
        -- marcador exacto pero sin ganador correcto → 2
        when pk.home_score is not null
          and pk.away_score is not null
          and pk.home_score = res.home_score
          and pk.away_score = res.away_score
        then 2
        else 0
      end as points
    from public.prediction_picks pk
    left join public.official_results res on res.match_id = pk.match_id
    left join tmp_real_occ ro on ro.match_id = pk.match_id
    left join tmp_pred_occ po
      on po.prediction_id = pk.prediction_id
      and po.match_id = pk.match_id
  )
  update public.prediction_picks pk
  set points = scored.points,
      updated_at = timezone('utc', now())
  from scored
  where scored.pick_id = pk.id;

  update public.predictions as p
  set total_points = coalesce(score_totals.points, 0),
      updated_at = timezone('utc', now())
  from (
    select prediction_id, sum(points) as points
    from public.prediction_picks
    group by prediction_id
  ) as score_totals
  where p.id = score_totals.prediction_id;

  update public.predictions
  set total_points = 0,
      updated_at = timezone('utc', now())
  where id not in (select distinct prediction_id from public.prediction_picks);
end;
$$;

revoke execute on function public.recompute_scores(bigint) from public, anon;
grant execute on function public.recompute_scores(bigint) to authenticated;

commit;
