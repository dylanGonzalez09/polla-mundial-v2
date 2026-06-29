"use server";

import { refresh, revalidatePath } from "next/cache";

import { verifySession } from "@/lib/auth/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getBracketCatalog, getAppSettings, getPhaseWindows } from "@/lib/data/matches";
import { getCurrentUserPrediction } from "@/lib/data/predictions";
import {
  canEditRoundScores,
  initialPredictionPayloadSchema,
  missingInitialFields,
  missingRoundScores,
  roundSubmissionPayloadSchema,
  type ActionState,
} from "@/lib/domain/validation";

async function upsertPrediction(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("predictions")
    .upsert({ user_id: userId }, { onConflict: "user_id" })
    .select("id, user_id, is_confirmed, confirmed_at, total_points")
    .single();

  if (error || !data) {
    throw error ?? new Error("Unable to create prediction");
  }

  return data;
}

export async function submitInitialPrediction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await verifySession();
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return { ok: false, message: "Faltan datos del cuadro." };
  }

  const parsed = initialPredictionPayloadSchema.safeParse(JSON.parse(rawPayload));
  if (!parsed.success) {
    return { ok: false, message: "El cuadro enviado no es valido." };
  }

  const [{ matches }, settings, current] = await Promise.all([
    getBracketCatalog(),
    getAppSettings(),
    getCurrentUserPrediction(),
  ]);

  if (current.prediction?.isConfirmed) {
    return { ok: false, message: "Tu cuadro inicial ya fue confirmado." };
  }

  if (settings.initialEffectiveStatus !== "open") {
    return {
      ok: false,
      message: "La ventana inicial no esta disponible en este momento.",
    };
  }

  const missing = missingInitialFields(matches, parsed.data.picks);
  if (missing.missingTeams.length || missing.missingRound32Scores.length) {
    return {
      ok: false,
      message: "Completa todos los equipos y los marcadores de 16avos antes de confirmar.",
    };
  }

  const predictionRow = current.prediction ?? (await upsertPrediction(user.id));
  const supabase = await createServerSupabaseClient();
  const rows = parsed.data.picks.map((pick) => ({
    prediction_id: predictionRow.id,
    match_id: pick.matchId,
    predicted_advancing_team_id: pick.predictedAdvancingTeamId,
    home_score: pick.homeScore,
    away_score: pick.awayScore,
  }));

  const { error: picksError } = await supabase
    .from("prediction_picks")
    .upsert(rows, { onConflict: "prediction_id,match_id" });

  if (picksError) {
    return { ok: false, message: picksError.message };
  }

  const { error: predictionError } = await supabase
    .from("predictions")
    .update({
      is_confirmed: true,
    })
    .eq("id", predictionRow.id);

  if (predictionError) {
    return { ok: false, message: predictionError.message };
  }

  revalidatePath("/bracket");
  refresh();
  return { ok: true, message: "Pronostico inicial confirmado." };
}

export async function submitRoundScores(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await verifySession();
  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") {
    return { ok: false, message: "Faltan los marcadores a enviar." };
  }

  const parsed = roundSubmissionPayloadSchema.safeParse(JSON.parse(rawPayload));
  if (!parsed.success) {
    return { ok: false, message: "La ronda enviada no es valida." };
  }

  const [{ matches }, phaseWindows, current] = await Promise.all([
    getBracketCatalog(),
    getPhaseWindows(),
    getCurrentUserPrediction(),
  ]);

  if (!current.prediction) {
    return { ok: false, message: "Primero debes confirmar tu cuadro inicial." };
  }

  const round = parsed.data.round;
  const submittedRounds = current.submissions.map((submission) => submission.round);
  const phaseWindow = phaseWindows.find((window) => window.round === round) ?? null;

  if (
    !canEditRoundScores(
      round,
      phaseWindow,
      current.prediction,
      submittedRounds,
    )
  ) {
    return {
      ok: false,
      message: "La ronda no esta abierta o ya fue enviada.",
    };
  }

  const mergedPicks = current.picks.map((pick) => {
    const next = parsed.data.picks.find((item) => item.matchId === pick.matchId);
    if (!next) {
      return pick;
    }

    return {
      ...pick,
      homeScore: next.homeScore,
      awayScore: next.awayScore,
    };
  });

  const missing = missingRoundScores(matches, mergedPicks, round);
  if (missing.length) {
    return {
      ok: false,
      message: "Completa todos los marcadores de la ronda antes de enviarla.",
    };
  }

  const supabase = await createServerSupabaseClient();

  // Las filas de picks ya existen (se crearon al confirmar el cuadro inicial).
  // Usamos UPDATE en vez de upsert: un upsert es INSERT ... ON CONFLICT, y el
  // trigger BEFORE INSERT bloquea cargar marcadores de rondas posteriores
  // ("Later-round scores cannot be inserted during initial creation"), aunque
  // la fila ya exista. El UPDATE entra por la rama correcta del guard.
  for (const pick of parsed.data.picks) {
    const { error: picksError } = await supabase
      .from("prediction_picks")
      .update({
        home_score: pick.homeScore,
        away_score: pick.awayScore,
      })
      .eq("prediction_id", current.prediction.id)
      .eq("match_id", pick.matchId);

    if (picksError) {
      return { ok: false, message: picksError.message };
    }
  }

  const { error: submissionError } = await supabase
    .from("prediction_phase_submissions")
    .insert({
      prediction_id: current.prediction.id,
      round,
    });

  if (submissionError) {
    return { ok: false, message: submissionError.message };
  }

  // Si el admin ya reveló el resultado de algún partido de esta ronda,
  // recalcular los puntos del usuario para esos partidos.
  const submittedMatchIds = parsed.data.picks.map((p) => p.matchId);
  const { data: existingResults } = await supabase
    .from("official_results")
    .select("match_id")
    .in("match_id", submittedMatchIds);

  if (existingResults && existingResults.length > 0) {
    for (const result of existingResults) {
      await supabase.rpc("recompute_scores", { target_match_id: result.match_id });
    }
  }

  revalidatePath("/bracket");
  revalidatePath("/players");
  revalidatePath("/ranking");
  refresh();
  return { ok: true, message: "Marcadores enviados correctamente." };
}
