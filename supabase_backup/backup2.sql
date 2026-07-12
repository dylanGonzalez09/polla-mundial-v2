


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."phase_status" AS ENUM (
    'locked',
    'open',
    'closed'
);


ALTER TYPE "public"."phase_status" OWNER TO "postgres";


CREATE TYPE "public"."round" AS ENUM (
    'r32',
    'r16',
    'qf',
    'sf',
    'third',
    'final'
);


ALTER TYPE "public"."round" OWNER TO "postgres";


CREATE TYPE "public"."source_type" AS ENUM (
    'winner',
    'loser'
);


ALTER TYPE "public"."source_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."effective_status"("opens_at" timestamp with time zone, "closes_at" timestamp with time zone, "override" "public"."phase_status" DEFAULT NULL::"public"."phase_status") RETURNS "public"."phase_status"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select case
    when override is not null then override
    when opens_at is null then 'locked'::public.phase_status
    when now() < opens_at then 'locked'::public.phase_status
    when closes_at is not null and now() >= closes_at then 'closed'::public.phase_status
    else 'open'::public.phase_status
  end;
$$;


ALTER FUNCTION "public"."effective_status"("opens_at" timestamp with time zone, "closes_at" timestamp with time zone, "override" "public"."phase_status") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_peer_initial"() RETURNS TABLE("user_id" "uuid", "display_name" "text", "has_submitted" boolean, "total_points" integer, "picks" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  my_prediction_id uuid;
  is_allowed boolean;
begin
  select p.id, p.is_confirmed
  into my_prediction_id, is_allowed
  from public.predictions as p
  where p.user_id = auth.uid();

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
        from public.prediction_picks as pick
        join public.tournament_matches as tm on tm.id = pick.match_id
        where pick.prediction_id = p.id
      )
      else null
    end
  from public.profiles as pr
  left join public.predictions as p on p.user_id = pr.id
  where pr.id <> auth.uid()
    and not pr.is_admin
  order by pr.display_name asc;
end;
$$;


ALTER FUNCTION "public"."get_peer_initial"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_peer_round_scores"("target_round" "public"."round") RETURNS TABLE("user_id" "uuid", "display_name" "text", "has_submitted" boolean, "picks" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  my_prediction_id uuid;
  viewer_allowed boolean;
begin
  if target_round = 'r32' then
    raise exception 'Use get_peer_initial for round of 32 visibility.';
  end if;

  select p.id
  into my_prediction_id
  from public.predictions as p
  where p.user_id = auth.uid();

  select exists (
    select 1
    from public.prediction_phase_submissions as pps
    where pps.prediction_id = my_prediction_id
      and pps.round = target_round
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
      from public.prediction_phase_submissions as pps
      where pps.prediction_id = p.id
        and pps.round = target_round
    ) as has_submitted,
    case
      when exists (
        select 1
        from public.prediction_phase_submissions as pps
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
        from public.prediction_picks as pick
        join public.tournament_matches as tm on tm.id = pick.match_id
        where pick.prediction_id = p.id
          and tm.round = target_round
      )
      else null
    end
  from public.profiles as pr
  join public.predictions as p on p.user_id = pr.id
  where pr.id <> auth.uid()
    and not pr.is_admin
  order by pr.display_name asc;
end;
$$;


ALTER FUNCTION "public"."get_peer_round_scores"("target_round" "public"."round") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_prediction_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  total_matches integer;
  filled_teams integer;
  filled_scores integer;
  status public.phase_status;
  settings_row public.app_settings%rowtype;
begin
  new.updated_at := timezone('utc', now());

  if old.is_confirmed and not new.is_confirmed then
    raise exception 'Cannot unconfirm a prediction.';
  end if;

  if not old.is_confirmed and new.is_confirmed then
    select *
    into settings_row
    from public.app_settings
    where id = 1;

    status := public.effective_status(
      settings_row.initial_opens_at,
      settings_row.initial_deadline,
      settings_row.initial_override
    );

    if status <> 'open' then
      raise exception 'Initial prediction window is not open.';
    end if;

    select count(*)
    into total_matches
    from public.tournament_matches;

    select count(*)
    into filled_teams
    from public.prediction_picks
    where prediction_id = new.id
      and predicted_advancing_team_id is not null;

    select count(*)
    into filled_scores
    from public.prediction_picks p
    join public.tournament_matches m on m.id = p.match_id
    where p.prediction_id = new.id
      and m.round = 'r32'
      and p.home_score is not null
      and p.away_score is not null;

    if filled_teams <> total_matches then
      raise exception 'Initial prediction is incomplete.';
    end if;

    if filled_scores <> 16 then
      raise exception 'Round of 32 scores are incomplete.';
    end if;

    new.confirmed_at := timezone('utc', now());
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."guard_prediction_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."guard_prediction_pick_mutation"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
declare
  prediction_row public.predictions%rowtype;
  match_row public.tournament_matches%rowtype;
  phase_row public.match_phase%rowtype;
  current_status public.phase_status;
  round_submitted boolean;
begin
  new.updated_at := timezone('utc', now());

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


ALTER FUNCTION "public"."guard_prediction_pick_mutation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recompute_scores"("target_match_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  later_round public.round;
begin
  if not public.is_admin() then
    raise exception 'Only admins can recompute scores.';
  end if;

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

  update public.predictions
  set total_points = 0,
      updated_at = timezone('utc', now())
  where id not in (select distinct prediction_id from public.prediction_picks);
end;
$$;


ALTER FUNCTION "public"."recompute_scores"("target_match_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_my_admin_flag"("admin_email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  changed boolean := false;
begin
  update public.profiles
  set is_admin = lower(email) = lower(admin_email)
  where id = auth.uid()
    and is_admin is distinct from (lower(email) = lower(admin_email));

  changed := found;
  return changed;
end;
$$;


ALTER FUNCTION "public"."sync_my_admin_flag"("admin_email" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "initial_opens_at" timestamp with time zone,
    "initial_deadline" timestamp with time zone,
    "initial_override" "public"."phase_status",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "app_settings_id_check" CHECK (("id" = 1)),
    CONSTRAINT "app_settings_initial_override_check" CHECK ((("initial_override" IS NULL) OR ("initial_override" <> 'locked'::"public"."phase_status")))
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."match_phase" (
    "round" "public"."round" NOT NULL,
    "opens_at" timestamp with time zone,
    "closes_at" timestamp with time zone,
    "manual_override" "public"."phase_status",
    CONSTRAINT "match_phase_manual_override_check" CHECK ((("manual_override" IS NULL) OR ("manual_override" <> 'locked'::"public"."phase_status")))
);


ALTER TABLE "public"."match_phase" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."official_results" (
    "match_id" bigint NOT NULL,
    "home_score" integer NOT NULL,
    "away_score" integer NOT NULL,
    "advancing_team_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "official_results_away_score_check" CHECK (("away_score" >= 0)),
    CONSTRAINT "official_results_home_score_check" CHECK (("home_score" >= 0))
);


ALTER TABLE "public"."official_results" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prediction_phase_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prediction_id" "uuid" NOT NULL,
    "round" "public"."round" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "prediction_phase_submissions_round_check" CHECK (("round" <> 'r32'::"public"."round"))
);


ALTER TABLE "public"."prediction_phase_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."prediction_picks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "prediction_id" "uuid" NOT NULL,
    "match_id" bigint NOT NULL,
    "predicted_advancing_team_id" bigint,
    "home_score" integer,
    "away_score" integer,
    "points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "prediction_picks_away_score_check" CHECK ((("away_score" IS NULL) OR ("away_score" >= 0))),
    CONSTRAINT "prediction_picks_home_score_check" CHECK ((("home_score" IS NULL) OR ("home_score" >= 0))),
    CONSTRAINT "prediction_picks_points_check" CHECK (("points" >= 0))
);


ALTER TABLE "public"."prediction_picks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."predictions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_confirmed" boolean DEFAULT false NOT NULL,
    "confirmed_at" timestamp with time zone,
    "total_points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "predictions_total_points_check" CHECK (("total_points" >= 0))
);


ALTER TABLE "public"."predictions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "profiles_display_name_check" CHECK (("char_length"(TRIM(BOTH FROM "display_name")) > 0))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."ranking" AS
 SELECT "pr"."display_name",
    COALESCE("p"."total_points", 0) AS "total_points"
   FROM ("public"."profiles" "pr"
     LEFT JOIN "public"."predictions" "p" ON (("p"."user_id" = "pr"."id")))
  WHERE (NOT "pr"."is_admin")
  ORDER BY COALESCE("p"."total_points", 0) DESC, "pr"."display_name";


ALTER VIEW "public"."ranking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE "public"."teams" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."teams_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tournament_matches" (
    "id" bigint NOT NULL,
    "code" "text" NOT NULL,
    "round" "public"."round" NOT NULL,
    "slot_order" integer NOT NULL,
    "match_date" timestamp with time zone NOT NULL,
    "venue_name" "text" NOT NULL,
    "home_team_id" bigint,
    "away_team_id" bigint,
    "home_source_match_id" bigint,
    "home_source_type" "public"."source_type",
    "away_source_match_id" bigint,
    "away_source_type" "public"."source_type",
    CONSTRAINT "tournament_matches_check" CHECK (((("round" = 'r32'::"public"."round") AND ("home_team_id" IS NOT NULL) AND ("away_team_id" IS NOT NULL)) OR (("round" <> 'r32'::"public"."round") AND ("home_source_match_id" IS NOT NULL) AND ("away_source_match_id" IS NOT NULL)))),
    CONSTRAINT "tournament_matches_check1" CHECK ((("home_source_match_id" IS NULL) = ("home_source_type" IS NULL))),
    CONSTRAINT "tournament_matches_check2" CHECK ((("away_source_match_id" IS NULL) = ("away_source_type" IS NULL)))
);


ALTER TABLE "public"."tournament_matches" OWNER TO "postgres";


ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_phase"
    ADD CONSTRAINT "match_phase_pkey" PRIMARY KEY ("round");



ALTER TABLE ONLY "public"."official_results"
    ADD CONSTRAINT "official_results_pkey" PRIMARY KEY ("match_id");



ALTER TABLE ONLY "public"."prediction_phase_submissions"
    ADD CONSTRAINT "prediction_phase_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prediction_phase_submissions"
    ADD CONSTRAINT "prediction_phase_submissions_prediction_id_round_key" UNIQUE ("prediction_id", "round");



ALTER TABLE ONLY "public"."prediction_picks"
    ADD CONSTRAINT "prediction_picks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prediction_picks"
    ADD CONSTRAINT "prediction_picks_prediction_id_match_id_key" UNIQUE ("prediction_id", "match_id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "guard_prediction_picks_before_insert" BEFORE INSERT ON "public"."prediction_picks" FOR EACH ROW EXECUTE FUNCTION "public"."guard_prediction_pick_mutation"();



CREATE OR REPLACE TRIGGER "guard_prediction_picks_before_update" BEFORE UPDATE ON "public"."prediction_picks" FOR EACH ROW EXECUTE FUNCTION "public"."guard_prediction_pick_mutation"();



CREATE OR REPLACE TRIGGER "guard_predictions_before_update" BEFORE UPDATE ON "public"."predictions" FOR EACH ROW EXECUTE FUNCTION "public"."guard_prediction_mutation"();



ALTER TABLE ONLY "public"."official_results"
    ADD CONSTRAINT "official_results_advancing_team_id_fkey" FOREIGN KEY ("advancing_team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."official_results"
    ADD CONSTRAINT "official_results_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_phase_submissions"
    ADD CONSTRAINT "prediction_phase_submissions_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_picks"
    ADD CONSTRAINT "prediction_picks_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."prediction_picks"
    ADD CONSTRAINT "prediction_picks_predicted_advancing_team_id_fkey" FOREIGN KEY ("predicted_advancing_team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."prediction_picks"
    ADD CONSTRAINT "prediction_picks_prediction_id_fkey" FOREIGN KEY ("prediction_id") REFERENCES "public"."predictions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictions"
    ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_away_source_match_id_fkey" FOREIGN KEY ("away_source_match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_home_source_match_id_fkey" FOREIGN KEY ("home_source_match_id") REFERENCES "public"."tournament_matches"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."tournament_matches"
    ADD CONSTRAINT "tournament_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE RESTRICT;



ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "app_settings_admin_write" ON "public"."app_settings" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "app_settings_select_authenticated" ON "public"."app_settings" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."match_phase" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "match_phase_admin_write" ON "public"."match_phase" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "match_phase_select_authenticated" ON "public"."match_phase" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "matches_admin_write" ON "public"."tournament_matches" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "matches_select_authenticated" ON "public"."tournament_matches" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."official_results" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "official_results_admin_write" ON "public"."official_results" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "official_results_select_authenticated" ON "public"."official_results" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."prediction_phase_submissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prediction_phase_submissions_insert_self" ON "public"."prediction_phase_submissions" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_phase_submissions"."prediction_id") AND ("p"."user_id" = "auth"."uid"()) AND "p"."is_confirmed"))) AND (EXISTS ( SELECT 1
   FROM "public"."match_phase" "mp"
  WHERE (("mp"."round" = "prediction_phase_submissions"."round") AND ("public"."effective_status"("mp"."opens_at", "mp"."closes_at", "mp"."manual_override") = 'open'::"public"."phase_status")))) AND (NOT (EXISTS ( SELECT 1
   FROM ("public"."prediction_picks" "pick"
     JOIN "public"."tournament_matches" "tm" ON (("tm"."id" = "pick"."match_id")))
  WHERE (("pick"."prediction_id" = "prediction_phase_submissions"."prediction_id") AND ("tm"."round" = "prediction_phase_submissions"."round") AND (("pick"."home_score" IS NULL) OR ("pick"."away_score" IS NULL))))))));



CREATE POLICY "prediction_phase_submissions_select_self" ON "public"."prediction_phase_submissions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_phase_submissions"."prediction_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."prediction_picks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "prediction_picks_insert_self" ON "public"."prediction_picks" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_picks"."prediction_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "prediction_picks_select_self" ON "public"."prediction_picks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_picks"."prediction_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "prediction_picks_update_self" ON "public"."prediction_picks" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_picks"."prediction_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."predictions" "p"
  WHERE (("p"."id" = "prediction_picks"."prediction_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."predictions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "predictions_insert_self" ON "public"."predictions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "predictions_select_self" ON "public"."predictions" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "predictions_update_self" ON "public"."predictions" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_admin_write" ON "public"."teams" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "teams_select_authenticated" ON "public"."teams" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."tournament_matches" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."effective_status"("opens_at" timestamp with time zone, "closes_at" timestamp with time zone, "override" "public"."phase_status") TO "anon";
GRANT ALL ON FUNCTION "public"."effective_status"("opens_at" timestamp with time zone, "closes_at" timestamp with time zone, "override" "public"."phase_status") TO "authenticated";
GRANT ALL ON FUNCTION "public"."effective_status"("opens_at" timestamp with time zone, "closes_at" timestamp with time zone, "override" "public"."phase_status") TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_peer_initial"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_peer_initial"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_peer_initial"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."get_peer_round_scores"("target_round" "public"."round") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_peer_round_scores"("target_round" "public"."round") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_peer_round_scores"("target_round" "public"."round") TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_prediction_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_prediction_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_prediction_mutation"() TO "service_role";



GRANT ALL ON FUNCTION "public"."guard_prediction_pick_mutation"() TO "anon";
GRANT ALL ON FUNCTION "public"."guard_prediction_pick_mutation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."guard_prediction_pick_mutation"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."recompute_scores"("target_match_id" bigint) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recompute_scores"("target_match_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."recompute_scores"("target_match_id" bigint) TO "service_role";



REVOKE ALL ON FUNCTION "public"."sync_my_admin_flag"("admin_email" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."sync_my_admin_flag"("admin_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_my_admin_flag"("admin_email" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON TABLE "public"."match_phase" TO "anon";
GRANT ALL ON TABLE "public"."match_phase" TO "authenticated";
GRANT ALL ON TABLE "public"."match_phase" TO "service_role";



GRANT ALL ON TABLE "public"."official_results" TO "anon";
GRANT ALL ON TABLE "public"."official_results" TO "authenticated";
GRANT ALL ON TABLE "public"."official_results" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_phase_submissions" TO "anon";
GRANT ALL ON TABLE "public"."prediction_phase_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_phase_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."prediction_picks" TO "anon";
GRANT ALL ON TABLE "public"."prediction_picks" TO "authenticated";
GRANT ALL ON TABLE "public"."prediction_picks" TO "service_role";



GRANT ALL ON TABLE "public"."predictions" TO "anon";
GRANT ALL ON TABLE "public"."predictions" TO "authenticated";
GRANT ALL ON TABLE "public"."predictions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."ranking" TO "anon";
GRANT ALL ON TABLE "public"."ranking" TO "authenticated";
GRANT ALL ON TABLE "public"."ranking" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tournament_matches" TO "anon";
GRANT ALL ON TABLE "public"."tournament_matches" TO "authenticated";
GRANT ALL ON TABLE "public"."tournament_matches" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































