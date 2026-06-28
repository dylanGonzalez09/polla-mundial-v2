import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OfficialResult } from "@/lib/domain/types";

export async function getOfficialResults() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("official_results")
    .select("match_id, home_score, away_score, advancing_team_id");

  if (error) {
    throw error;
  }

  const resultMap = new Map<number, OfficialResult>();
  for (const row of data ?? []) {
    resultMap.set(row.match_id, {
      matchId: row.match_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      advancingTeamId: row.advancing_team_id,
    });
  }

  return resultMap;
}
