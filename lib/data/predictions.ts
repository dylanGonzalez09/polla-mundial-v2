import "server-only";

import { cache } from "react";

import { verifySession } from "@/lib/auth/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  Prediction,
  PredictionPhaseSubmission,
  PredictionPick,
  RoundKey,
} from "@/lib/domain/types";

export const getCurrentUserTotalPoints = cache(async (): Promise<number> => {
  const user = await verifySession();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("predictions")
    .select("total_points")
    .eq("user_id", user.id)
    .maybeSingle();

  return data?.total_points ?? 0;
});

function normalizePrediction(row: Record<string, unknown>): Prediction {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    isConfirmed: Boolean(row.is_confirmed),
    confirmedAt: row.confirmed_at ? String(row.confirmed_at) : null,
    totalPoints: Number(row.total_points ?? 0),
  };
}

export async function getCurrentUserPrediction() {
  const user = await verifySession();
  const supabase = await createServerSupabaseClient();

  const { data: predictionRow } = await supabase
    .from("predictions")
    .select("id, user_id, is_confirmed, confirmed_at, total_points")
    .eq("user_id", user.id)
    .maybeSingle();

  const prediction = predictionRow ? normalizePrediction(predictionRow) : null;

  if (!prediction) {
    return {
      prediction: null,
      picks: [] as PredictionPick[],
      submissions: [] as PredictionPhaseSubmission[],
    };
  }

  const [{ data: picksRows, error: picksError }, { data: submissionRows, error: submissionError }] =
    await Promise.all([
      supabase
        .from("prediction_picks")
        .select(
          "id, prediction_id, match_id, predicted_advancing_team_id, home_score, away_score, points",
        )
        .eq("prediction_id", prediction.id)
        .order("match_id", { ascending: true }),
      supabase
        .from("prediction_phase_submissions")
        .select("round, submitted_at")
        .eq("prediction_id", prediction.id)
        .order("submitted_at", { ascending: true }),
    ]);

  if (picksError) {
    throw picksError;
  }

  if (submissionError) {
    throw submissionError;
  }

  const picks =
    picksRows?.map((row) => ({
      id: row.id,
      predictionId: row.prediction_id,
      matchId: row.match_id,
      predictedAdvancingTeamId: row.predicted_advancing_team_id,
      homeScore: row.home_score,
      awayScore: row.away_score,
      points: row.points,
    })) ?? [];

  const submissions =
    submissionRows?.map((row) => ({
      round: row.round as RoundKey,
      submittedAt: row.submitted_at,
    })) ?? [];

  return { prediction, picks, submissions };
}
