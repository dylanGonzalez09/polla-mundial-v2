-- =====================================================================
-- Seed de validacion visual - matriz de puntaje
-- ---------------------------------------------------------------------
-- Script destructivo: limpia usuarios, predicciones y resultados, y deja
-- una base sembrada con 2 cuentas de prueba:
--
--   Admin:
--     email:    yaiiir.dev@gmail.com
--     password: AdminMatrix123!
--
--   Jugador:
--     email:    matrix.viewer@polla.local
--     password: ViewerMatrix123!
--
-- IMPORTANTE:
-- - El correo admin debe coincidir con ADMIN_EMAIL de la app. Si cambia,
--   ajusta este script antes de correrlo.
-- - Este seed esta pensado para validar visualmente la matriz actual:
--
--   r32:
--   - ganador + exacto = 4
--   - exacto = 3
--   - solo ganador = 1
--   - resto = 0
--
--   r16 en adelante:
--   - ganador + exacto = 4
--   - empate exacto + cruce correcto, sin acertar quien avanza = 3
--   - solo exacto = 2
--   - solo ganador = 1
--   - resto = 0
--
-- Casos sembrados para revisar rapido:
--   r32:
--     P73 = 4
--     P74 = 3
--     P77 = 1
--     P76 = 0
--   r16:
--     P92 = 4
--     P93 = 3
--     P90 = 2
--     P89 = 1
--     P91 = 0
--
-- Total esperado de la prediccion sembrada: 23 puntos
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) Limpieza total de datos de juego y auth
-- ---------------------------------------------------------------------
delete from public.prediction_phase_submissions;
delete from public.prediction_picks;
delete from public.predictions;
delete from public.official_results;
delete from auth.identities;
delete from auth.users;

update public.match_phase
set opens_at = null,
    closes_at = null,
    manual_override = case when round = 'r32' then 'open'::public.phase_status else null end;

insert into public.app_settings (id, initial_opens_at, initial_deadline, initial_override)
values (1, timezone('utc', now()) - interval '1 day', null, 'open')
on conflict (id) do update set
  initial_opens_at = excluded.initial_opens_at,
  initial_deadline = excluded.initial_deadline,
  initial_override = excluded.initial_override,
  updated_at = timezone('utc', now());

-- ---------------------------------------------------------------------
-- 2) Usuarios de prueba
-- ---------------------------------------------------------------------
with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        'yaiiir.dev@gmail.com'::text,
        'Admin Seed'::text,
        'AdminMatrix123!'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        'matrix.viewer@polla.local'::text,
        'Matrix Viewer'::text,
        'ViewerMatrix123!'::text
      )
  ) as v(user_id, email, display_name, plain_password)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  confirmation_token,
  recovery_token,
  email_change,
  email_change_token_new,
  email_change_token_current,
  reauthentication_token,
  phone_change,
  phone_change_token,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_sso_user,
  is_anonymous
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  su.user_id,
  'authenticated',
  'authenticated',
  su.email,
  crypt(su.plain_password, gen_salt('bf')),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  timezone('utc', now()),
  timezone('utc', now()),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_build_object(
    'sub', su.user_id::text,
    'email', su.email,
    'display_name', su.display_name,
    'email_verified', true,
    'phone_verified', false
  ),
  timezone('utc', now()),
  timezone('utc', now()),
  false,
  false
from seed_users su;

with seed_users as (
  select *
  from (
    values
      (
        '11111111-1111-4111-8111-111111111111'::uuid,
        'yaiiir.dev@gmail.com'::text,
        'Admin Seed'::text
      ),
      (
        '22222222-2222-4222-8222-222222222222'::uuid,
        'matrix.viewer@polla.local'::text,
        'Matrix Viewer'::text
      )
  ) as v(user_id, email, display_name)
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  su.user_id::text,
  su.user_id,
  jsonb_build_object(
    'sub', su.user_id::text,
    'email', su.email,
    'display_name', su.display_name,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  timezone('utc', now()),
  timezone('utc', now()),
  timezone('utc', now())
from seed_users su;

update public.profiles
set is_admin = lower(email) = lower('yaiiir.dev@gmail.com'),
    display_name = case
      when lower(email) = lower('yaiiir.dev@gmail.com') then 'Admin Seed'
      when lower(email) = lower('matrix.viewer@polla.local') then 'Matrix Viewer'
      else display_name
    end
where lower(email) in (lower('yaiiir.dev@gmail.com'), lower('matrix.viewer@polla.local'));

-- ---------------------------------------------------------------------
-- 3) Prediccion confirmada del usuario normal
-- ---------------------------------------------------------------------
insert into public.predictions (
  id,
  user_id,
  is_confirmed,
  confirmed_at,
  total_points,
  created_at,
  updated_at
)
values (
  '33333333-3333-4333-8333-333333333333'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid,
  true,
  timezone('utc', now()),
  0,
  timezone('utc', now()),
  timezone('utc', now())
);

with seed_picks as (
  select *
  from (
    values
      (73,  'RSA', 2, 1),
      (74,  'PAR', 1, 1),
      (75,  'NED', 1, 0),
      (76,  'BRA', 3, 0),
      (77,  'FRA', 1, 0),
      (78,  'CIV', 2, 1),
      (79,  'MEX', 1, 0),
      (80,  'ENG', 2, 1),
      (81,  'USA', 1, 0),
      (82,  'BEL', 2, 0),
      (83,  'POR', 2, 1),
      (84,  'ESP', 1, 0),
      (85,  'SUI', 1, 0),
      (86,  'ARG', 2, 0),
      (87,  'COL', 1, 0),
      (88,  'AUS', 2, 1),
      (89,  'FRA', null, null),
      (90,  'NED', null, null),
      (91,  'BRA', null, null),
      (92,  'ENG', null, null),
      (93,  'POR', null, null),
      (94,  'USA', null, null),
      (95,  'ARG', null, null),
      (96,  'SUI', null, null),
      (97,  'FRA', null, null),
      (98,  'USA', null, null),
      (99,  'ENG', null, null),
      (100, 'ARG', null, null),
      (101, 'USA', null, null),
      (102, 'ARG', null, null),
      (103, 'ENG', null, null),
      (104, 'ARG', null, null)
  ) as v(match_id, advancing_code, home_score, away_score)
)
insert into public.prediction_picks (
  prediction_id,
  match_id,
  predicted_advancing_team_id,
  home_score,
  away_score
)
select
  '33333333-3333-4333-8333-333333333333'::uuid,
  sp.match_id,
  t.id,
  sp.home_score,
  sp.away_score
from seed_picks sp
join public.teams t on t.code = sp.advancing_code;

-- ---------------------------------------------------------------------
-- 4) Marcadores de r16 para validar la matriz posterior a r32
-- ---------------------------------------------------------------------
update public.match_phase
set manual_override = 'open'::public.phase_status
where round = 'r16';

with r16_scores as (
  select *
  from (
    values
      (89, 1, 0),
      (90, 2, 0),
      (91, 3, 0),
      (92, 0, 1),
      (93, 1, 1)
  ) as v(match_id, home_score, away_score)
)
update public.prediction_picks pk
set home_score = rs.home_score,
    away_score = rs.away_score,
    updated_at = timezone('utc', now())
from r16_scores rs
where pk.prediction_id = '33333333-3333-4333-8333-333333333333'::uuid
  and pk.match_id = rs.match_id;

update public.match_phase
set manual_override = 'closed'::public.phase_status
where round = 'r16';

-- ---------------------------------------------------------------------
-- 5) Resultados oficiales
-- ---------------------------------------------------------------------
with official_seed as (
  select *
  from (
    values
      (73,  2, 1, 'RSA'),
      (74,  1, 1, 'GER'),
      (75,  0, 2, 'MAR'),
      (76,  0, 1, 'JPN'),
      (77,  2, 0, 'FRA'),
      (78,  1, 0, 'CIV'),
      (79,  2, 0, 'MEX'),
      (80,  1, 0, 'ENG'),
      (83,  1, 0, 'POR'),
      (84,  2, 2, 'ESP'),
      (89,  2, 1, 'FRA'),
      (90,  2, 0, 'RSA'),
      (91,  1, 2, 'CIV'),
      (92,  0, 1, 'ENG'),
      (93,  1, 1, 'ESP')
  ) as v(match_id, home_score, away_score, advancing_code)
)
insert into public.official_results (
  match_id,
  home_score,
  away_score,
  advancing_team_id
)
select
  os.match_id,
  os.home_score,
  os.away_score,
  t.id
from official_seed os
join public.teams t on t.code = os.advancing_code;

-- ---------------------------------------------------------------------
-- 6) Recalculo de puntajes sin depender de auth.uid()
-- ---------------------------------------------------------------------
create temporary table tmp_real_occ (
  match_id bigint primary key,
  home_occ bigint,
  away_occ bigint,
  adv bigint
) on commit drop;

create temporary table tmp_pred_occ (
  prediction_id uuid,
  match_id bigint,
  home_occ bigint,
  away_occ bigint,
  adv bigint,
  primary key (prediction_id, match_id)
) on commit drop;

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

do $$
declare
  later_round public.round;
begin
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
end $$;

with scored as (
  select
    pk.id as pick_id,
    case
      when res.match_id is null then 0
      when (
        res.advancing_team_id is not null
        and pk.predicted_advancing_team_id is not distinct from res.advancing_team_id
        and pk.home_score is not null
        and pk.away_score is not null
        and pk.home_score = res.home_score
        and pk.away_score = res.away_score
      ) then 4
      when (
        m.round = 'r32'
        and pk.home_score is not null
        and pk.away_score is not null
        and pk.home_score = res.home_score
        and pk.away_score = res.away_score
      ) then 3
      when (
        m.round <> 'r32'
        and res.home_score = res.away_score
        and ro.home_occ is not null
        and ro.away_occ is not null
        and po.home_occ is not distinct from ro.home_occ
        and po.away_occ is not distinct from ro.away_occ
        and pk.home_score is not null
        and pk.away_score is not null
        and pk.home_score = res.home_score
        and pk.away_score = res.away_score
      ) then 3
      when (
        pk.home_score is not null
        and pk.away_score is not null
        and pk.home_score = res.home_score
        and pk.away_score = res.away_score
      ) then 2
      when (
        res.advancing_team_id is not null
        and pk.predicted_advancing_team_id is not distinct from res.advancing_team_id
      ) then 1
      else 0
    end as points
  from public.prediction_picks pk
  join public.tournament_matches m on m.id = pk.match_id
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

commit;

-- Verificacion sugerida:
-- select tm.code, tm.round, pp.points
-- from public.prediction_picks pp
-- join public.tournament_matches tm on tm.id = pp.match_id
-- where pp.prediction_id = '33333333-3333-4333-8333-333333333333'::uuid
--   and tm.id in (73, 74, 76, 77, 89, 90, 91, 92, 93)
-- order by tm.id;
--
-- Esperado:
--   P73 = 4
--   P74 = 3
--   P76 = 0
--   P77 = 1
--   P89 = 1
--   P90 = 2
--   P91 = 0
--   P92 = 4
--   P93 = 3
--
-- select total_points
-- from public.predictions
-- where id = '33333333-3333-4333-8333-333333333333'::uuid;
--
-- Esperado: 23
