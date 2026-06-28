import { z } from "zod";

import { EDITABLE_SCORE_ROUNDS, isRoundKey } from "@/lib/domain/rounds";
import { effectiveStatus } from "@/lib/domain/phase";
import type {
  AppSettings,
  MatchPhaseWindow,
  Prediction,
  PredictionPick,
  RoundKey,
  TournamentMatch,
} from "@/lib/domain/types";

export const signupSchema = z.object({
  email: z.email("Ingresa un correo valido."),
  password: z
    .string()
    .min(8, "La contrasena debe tener al menos 8 caracteres."),
  displayName: z
    .string()
    .trim()
    .min(1, "El nombre visible es obligatorio."),
});

export const loginSchema = z.object({
  email: z.email("Ingresa un correo valido."),
  password: z.string().min(1, "La contrasena es obligatoria."),
});

export const initialPredictionPayloadSchema = z.object({
  confirmed: z.literal(true),
  picks: z.array(
    z.object({
      matchId: z.number().int(),
      predictedAdvancingTeamId: z.number().int().nullable(),
      homeScore: z.number().int().min(0).nullable(),
      awayScore: z.number().int().min(0).nullable(),
    }),
  ),
});

export const roundSubmissionPayloadSchema = z.object({
  round: z.string().refine(isRoundKey, "Ronda invalida."),
  picks: z.array(
    z.object({
      matchId: z.number().int(),
      homeScore: z.number().int().min(0).nullable(),
      awayScore: z.number().int().min(0).nullable(),
    }),
  ),
});

export type FormErrors = Record<string, string[]>;

export type ActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: FormErrors;
};

export const idleActionState: ActionState = {
  ok: false,
};

export function isTiedScore(
  homeScore: number | null | undefined,
  awayScore: number | null | undefined,
) {
  return homeScore != null && awayScore != null && homeScore === awayScore;
}

function byMatchId(picks: PredictionPick[]) {
  return new Map(picks.map((pick) => [pick.matchId, pick]));
}

export function canStartInitialPrediction(
  settings: AppSettings,
  prediction: Prediction | null,
) {
  if (prediction?.isConfirmed) {
    return false;
  }

  return settings.initialEffectiveStatus === "open";
}

export function missingInitialFields(
  matches: TournamentMatch[],
  picks: PredictionPick[],
) {
  const pickMap = byMatchId(picks);
  const missingTeams: number[] = [];
  const missingRound32Scores: number[] = [];

  for (const match of matches) {
    const pick = pickMap.get(match.id);
    if (!pick?.predictedAdvancingTeamId) {
      missingTeams.push(match.id);
    }

    if (
      match.round === "r32" &&
      (pick?.homeScore === null ||
        pick?.homeScore === undefined ||
        pick.awayScore === null ||
        pick.awayScore === undefined)
    ) {
      missingRound32Scores.push(match.id);
    }
  }

  return { missingTeams, missingRound32Scores };
}

export function roundMatches(matches: TournamentMatch[], round: RoundKey) {
  return matches.filter((match) => match.round === round);
}

export function missingRoundScores(
  matches: TournamentMatch[],
  picks: PredictionPick[],
  round: RoundKey,
) {
  const pickMap = byMatchId(picks);

  return roundMatches(matches, round)
    .filter((match) => {
      const pick = pickMap.get(match.id);
      return pick?.homeScore === null || pick?.awayScore === null || !pick;
    })
    .map((match) => match.id);
}

export function canEditRoundScores(
  round: RoundKey,
  phaseWindow: MatchPhaseWindow | null,
  prediction: Prediction | null,
  submittedRounds: RoundKey[],
) {
  if (!EDITABLE_SCORE_ROUNDS.includes(round)) {
    return false;
  }

  if (!prediction?.isConfirmed || !phaseWindow) {
    return false;
  }

  if (submittedRounds.includes(round)) {
    return false;
  }

  return phaseWindow.effectiveStatus === "open";
}

export function getInitialLockReason(
  settings: AppSettings,
  prediction: Prediction | null,
) {
  if (prediction?.isConfirmed) {
    return "Tu cuadro inicial ya fue confirmado.";
  }

  const status = effectiveStatus(
    settings.initialOpensAt,
    settings.initialDeadline,
    settings.initialOverride,
  );

  if (status === "open") {
    return null;
  }

  if (status === "closed") {
    return "La ventana inicial ya cerro.";
  }

  return "La ventana inicial todavia no esta abierta.";
}
