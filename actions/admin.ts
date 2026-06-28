"use server";

import { refresh, revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/dal";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isRoundKey } from "@/lib/domain/rounds";
import type { ActionState } from "@/lib/domain/validation";

function parseDateTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  return new Date(value).toISOString();
}

export async function setPhaseWindow(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const scope = formData.get("scope");
  const round = formData.get("round");
  const opensAt = parseDateTime(formData.get("opensAt"));
  const closesAt = parseDateTime(formData.get("closesAt"));
  const supabase = await createServerSupabaseClient();

  if (scope === "initial") {
    const { error } = await supabase
      .from("app_settings")
      .update({
        initial_opens_at: opensAt,
        initial_deadline: closesAt,
      })
      .eq("id", 1);

    if (error) {
      return { ok: false, message: error.message };
    }
  } else {
    if (typeof round !== "string" || !isRoundKey(round)) {
      return { ok: false, message: "Ronda invalida." };
    }

    const { error } = await supabase.from("match_phase").upsert({
      round,
      opens_at: opensAt,
      closes_at: closesAt,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/bracket");
  refresh();
  return { ok: true, message: "Ventana actualizada." };
}

export async function setManualOverride(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const scope = formData.get("scope");
  const round = formData.get("round");
  const overrideValue = formData.get("manualOverride");
  const manualOverride =
    overrideValue === "open" || overrideValue === "closed" ? overrideValue : null;
  const supabase = await createServerSupabaseClient();

  if (scope === "initial") {
    const { error } = await supabase
      .from("app_settings")
      .update({ initial_override: manualOverride })
      .eq("id", 1);

    if (error) {
      return { ok: false, message: error.message };
    }
  } else {
    if (typeof round !== "string" || !isRoundKey(round)) {
      return { ok: false, message: "Ronda invalida." };
    }

    const { error } = await supabase.from("match_phase").upsert({
      round,
      manual_override: manualOverride,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  revalidatePath("/admin");
  revalidatePath("/bracket");
  refresh();
  return { ok: true, message: "Override actualizado." };
}

export async function recordOfficialResult(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const matchId = Number(formData.get("matchId"));
  const homeScore = Number(formData.get("homeScore"));
  const awayScore = Number(formData.get("awayScore"));
  const advancingTeamIdValue = formData.get("advancingTeamId");
  const advancingTeamId =
    typeof advancingTeamIdValue === "string" && advancingTeamIdValue !== ""
      ? Number(advancingTeamIdValue)
      : null;

  if (!Number.isFinite(matchId) || !Number.isFinite(homeScore) || !Number.isFinite(awayScore)) {
    return { ok: false, message: "Resultado invalido." };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("official_results").upsert({
    match_id: matchId,
    home_score: homeScore,
    away_score: awayScore,
    advancing_team_id: advancingTeamId,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { error: recomputeError } = await supabase.rpc("recompute_scores", {
    target_match_id: matchId,
  });

  if (recomputeError) {
    return { ok: false, message: recomputeError.message };
  }

  revalidatePath("/admin");
  revalidatePath("/ranking");
  revalidatePath("/players");
  refresh();
  return { ok: true, message: "Resultado oficial guardado." };
}
