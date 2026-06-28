import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RankingRow } from "@/lib/domain/types";

export async function getRanking(): Promise<RankingRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("ranking")
    .select("display_name, total_points");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => ({
      displayName: row.display_name,
      totalPoints: row.total_points,
    }))
    .sort((left, right) => {
      if (right.totalPoints !== left.totalPoints) {
        return right.totalPoints - left.totalPoints;
      }

      return left.displayName.localeCompare(right.displayName);
    });
}
