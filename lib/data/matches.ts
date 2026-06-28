import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { effectiveStatus } from "@/lib/domain/phase";
import type {
  AppSettings,
  BracketMatchView,
  MatchPhaseWindow,
  Team,
  TournamentMatch,
} from "@/lib/domain/types";

function normalizeMatch(row: Record<string, unknown>): TournamentMatch {
  return {
    id: Number(row.id),
    code: String(row.code),
    round: row.round as TournamentMatch["round"],
    slotOrder: Number(row.slot_order),
    matchDate: String(row.match_date),
    venueName: String(row.venue_name),
    homeTeamId: row.home_team_id ? Number(row.home_team_id) : null,
    awayTeamId: row.away_team_id ? Number(row.away_team_id) : null,
    homeSourceMatchId: row.home_source_match_id
      ? Number(row.home_source_match_id)
      : null,
    homeSourceType: (row.home_source_type as TournamentMatch["homeSourceType"]) ?? null,
    awaySourceMatchId: row.away_source_match_id
      ? Number(row.away_source_match_id)
      : null,
    awaySourceType: (row.away_source_type as TournamentMatch["awaySourceType"]) ?? null,
  };
}

export async function getAllTeams(): Promise<Team[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("teams")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
  }));
}

export async function getTournamentMatches(): Promise<TournamentMatch[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tournament_matches")
    .select(
      "id, code, round, slot_order, match_date, venue_name, home_team_id, away_team_id, home_source_match_id, home_source_type, away_source_match_id, away_source_type",
    )
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => normalizeMatch(row));
}

export async function getBracketCatalog(): Promise<{
  matches: TournamentMatch[];
  teams: Team[];
}> {
  const [matches, teams] = await Promise.all([getTournamentMatches(), getAllTeams()]);
  return { matches, teams };
}

export async function getBracketViewMatches(): Promise<BracketMatchView[]> {
  const { matches, teams } = await getBracketCatalog();
  const teamMap = new Map(teams.map((team) => [team.id, team]));

  return matches.map((match) => ({
    ...match,
    homeTeam: match.homeTeamId ? teamMap.get(match.homeTeamId) ?? null : null,
    awayTeam: match.awayTeamId ? teamMap.get(match.awayTeamId) ?? null : null,
  }));
}

export async function getPhaseWindows(): Promise<MatchPhaseWindow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("match_phase")
    .select("round, opens_at, closes_at, manual_override")
    .order("round", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    round: row.round,
    opensAt: row.opens_at,
    closesAt: row.closes_at,
    manualOverride: row.manual_override,
    effectiveStatus: effectiveStatus(
      row.opens_at,
      row.closes_at,
      row.manual_override,
    ),
  }));
}

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("initial_opens_at, initial_deadline, initial_override")
    .eq("id", 1)
    .single();

  if (error || !data) {
    throw error ?? new Error("Missing app settings");
  }

  return {
    initialOpensAt: data.initial_opens_at,
    initialDeadline: data.initial_deadline,
    initialOverride: data.initial_override,
    initialEffectiveStatus: effectiveStatus(
      data.initial_opens_at,
      data.initial_deadline,
      data.initial_override,
    ),
  };
}
