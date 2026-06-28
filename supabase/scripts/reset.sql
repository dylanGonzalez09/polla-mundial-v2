-- =====================================================================
-- Reset de datos — Polla Mundial
-- ---------------------------------------------------------------------
-- Vacía TODOS los datos de juego y usuarios, y deja la configuración en
-- su estado "fresco" inicial, SIN tocar la estructura del cuadro
-- (teams y tournament_matches se conservan).
--
-- Qué borra:
--   - Usuarios de auth (auth.users) -> en cascada borra profiles,
--     predictions, prediction_picks y prediction_phase_submissions.
--   - Resultados oficiales (official_results).
--
-- Qué conserva:
--   - teams, tournament_matches (estructura sembrada por la migración).
--
-- Qué restablece:
--   - match_phase: solo 16avos (r32) abierto; octavos, cuartos, semis,
--     3er lugar y final BLOQUEADOS hasta que el admin los abra.
--   - app_settings: ventana inicial abierta (override 'open').
--
-- Cómo correrlo:
--   - Supabase Dashboard -> SQL Editor -> pegar y ejecutar, o
--   - psql "$DATABASE_URL" -f supabase/scripts/reset.sql
--
-- Tras el reset: vuelve a registrarte con el correo de ADMIN_EMAIL para
-- recuperar el rol admin (el trigger lo asigna automáticamente).
-- =====================================================================

begin;

-- 1) Datos de juego de los usuarios (orden seguro respecto a las FKs;
--    igual caería por cascada al borrar auth.users, pero lo hacemos
--    explícito para que el script sea claro y robusto).
delete from public.prediction_phase_submissions;
delete from public.prediction_picks;
delete from public.predictions;

-- 2) Resultados oficiales (no dependen de usuarios).
delete from public.official_results;

-- 3) Cuentas. Borrar auth.users elimina en cascada profiles + lo anterior.
delete from auth.users;

-- 4) Restablecer ventanas de fase al estado fresco.
--    Todo bloqueado salvo 16avos (r32), que arranca abierto.
update public.match_phase
set opens_at = null,
    closes_at = null,
    manual_override = case when round = 'r32' then 'open'::public.phase_status else null end;

-- 5) Restablecer la ventana del primer llenado: abierta por override.
--    deadline en null = no se autocierra; el admin la controla cuando quiera.
insert into public.app_settings (id, initial_opens_at, initial_deadline, initial_override)
values (1, timezone('utc', now()) - interval '1 day', null, 'open')
on conflict (id) do update set
  initial_opens_at = excluded.initial_opens_at,
  initial_deadline = excluded.initial_deadline,
  initial_override = excluded.initial_override,
  updated_at = timezone('utc', now());

commit;

-- Verificación rápida (opcional):
-- select round, public.effective_status(opens_at, closes_at, manual_override) as estado
-- from public.match_phase order by round;
