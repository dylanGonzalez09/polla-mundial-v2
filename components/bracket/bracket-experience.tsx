"use client";

import { useActionState, useMemo, useState } from "react";

import { BracketFlow } from "@/components/bracket/bracket-flow";
import { MapUsageHint } from "@/components/bracket/map-usage-hint";
import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { buildResolvedMatches, matchesByRound } from "@/lib/domain/bracket";
import {
  canEditRoundScores,
  getInitialLockReason,
  idleActionState,
  missingInitialFields,
  missingRoundScores,
} from "@/lib/domain/validation";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import type {
  AppSettings,
  BracketMatchView,
  MatchPhaseWindow,
  OfficialResult,
  Prediction,
  PredictionPick,
  RoundKey,
  Team,
} from "@/lib/domain/types";
import { submitInitialPrediction, submitRoundScores } from "@/actions/predictions";

type BracketExperienceProps = {
  matches: BracketMatchView[];
  teams: Team[];
  initialSettings: AppSettings;
  phaseWindows: MatchPhaseWindow[];
  prediction: Prediction | null;
  picks: PredictionPick[];
  submittedRounds: RoundKey[];
  officialResults: OfficialResult[];
};

function serializeInitialPayload(picks: PredictionPick[]) {
  return JSON.stringify({
    confirmed: true,
    picks: picks.map((pick) => ({
      matchId: pick.matchId,
      predictedAdvancingTeamId: pick.predictedAdvancingTeamId,
      homeScore: pick.homeScore,
      awayScore: pick.awayScore,
    })),
  });
}

function serializeRoundPayload(round: RoundKey, picks: PredictionPick[], matchIds: number[]) {
  return JSON.stringify({
    round,
    picks: picks
      .filter((pick) => matchIds.includes(pick.matchId))
      .map((pick) => ({
        matchId: pick.matchId,
        homeScore: pick.homeScore,
        awayScore: pick.awayScore,
      })),
  });
}

export function BracketExperience({
  matches,
  teams,
  initialSettings,
  phaseWindows,
  prediction,
  picks,
  submittedRounds,
  officialResults,
}: BracketExperienceProps) {
  const [localPicks, setLocalPicks] = useState<PredictionPick[]>(
    matches.map((match) => {
      const existing = picks.find((pick) => pick.matchId === match.id);
      return (
        existing ?? {
          matchId: match.id,
          predictedAdvancingTeamId: null,
          homeScore: null,
          awayScore: null,
        }
      );
    }),
  );

  const [initialState, initialAction] = useActionState(
    submitInitialPrediction,
    idleActionState,
  );
  const [roundState, roundAction] = useActionState(
    submitRoundScores,
    idleActionState,
  );

  const pickMap = useMemo(
    () => new Map(localPicks.map((pick) => [pick.matchId, pick])),
    [localPicks],
  );

  const resolvedMatches = useMemo(
    () => buildResolvedMatches(matches, teams, localPicks),
    [localPicks, matches, teams],
  );

  const matchesByStage = useMemo(
    () => matchesByRound(resolvedMatches),
    [resolvedMatches],
  );
  const roundWindowMap = useMemo(
    () => new Map(phaseWindows.map((window) => [window.round, window])),
    [phaseWindows],
  );
  // Ocupantes reales de cada cruce, derivados del avance oficial (mismo
  // algoritmo del cuadro, pero alimentado con resultados oficiales en vez de
  // los picks del usuario). Sirve para saber si el usuario acertó el cruce.
  const officialResolvedById = useMemo(() => {
    const officialPicks = officialResults.map((result) => ({
      matchId: result.matchId,
      predictedAdvancingTeamId: result.advancingTeamId,
      homeScore: null,
      awayScore: null,
    }));
    return new Map(
      buildResolvedMatches(matches, teams, officialPicks).map((match) => [
        match.id,
        match,
      ]),
    );
  }, [matches, teams, officialResults]);

  const officialMap = useMemo(() => {
    const resultById = new Map(
      officialResults.map((result) => [result.matchId, result]),
    );

    // Construimos una celda para TODOS los partidos (no solo los que ya
    // tienen marcador), para poder mostrar el ocupante oficial de cada cruce
    // en la ronda siguiente aunque ese partido aun no se juegue.
    return new Map(
      matches.map((match) => {
        const result = resultById.get(match.id) ?? null;
        const resolved = officialResolvedById.get(match.id);
        return [
          match.id,
          {
            homeScore: result?.homeScore ?? null,
            awayScore: result?.awayScore ?? null,
            advancingTeamId: result?.advancingTeamId ?? null,
            advancingTeamName:
              teams.find((team) => team.id === result?.advancingTeamId)?.name ??
              null,
            realHomeTeamId: resolved?.homeTeam?.id ?? null,
            realAwayTeamId: resolved?.awayTeam?.id ?? null,
            realHomeTeamName: resolved?.homeTeam?.name ?? null,
            realAwayTeamName: resolved?.awayTeam?.name ?? null,
          },
        ];
      }),
    );
  }, [matches, officialResults, officialResolvedById, teams]);

  const initialLockReason = getInitialLockReason(initialSettings, prediction);

  const initialMissing = useMemo(
    () => missingInitialFields(matches, localPicks),
    [matches, localPicks],
  );

  const missingTeamsByRound = useMemo(() => {
    const counts = {} as Record<RoundKey, number>;
    for (const matchId of initialMissing.missingTeams) {
      const match = matches.find((item) => item.id === matchId);
      if (match) {
        counts[match.round] = (counts[match.round] ?? 0) + 1;
      }
    }
    return counts;
  }, [initialMissing.missingTeams, matches]);

  const initialComplete =
    initialMissing.missingTeams.length === 0 &&
    initialMissing.missingRound32Scores.length === 0;

  const updatePick = (matchId: number, updater: (current: PredictionPick) => PredictionPick) => {
    setLocalPicks((current) =>
      current.map((pick) => (pick.matchId === matchId ? updater(pick) : pick)),
    );
  };

  const resolveTeams = (match: BracketMatchView) => ({
    homeTeam: resolvedMatches.find((item) => item.id === match.id)?.homeTeam ?? null,
    awayTeam: resolvedMatches.find((item) => item.id === match.id)?.awayTeam ?? null,
  });

  const canEditTeams = () =>
    !prediction?.isConfirmed && initialSettings.initialEffectiveStatus === "open";
  const canEditScoresForMatch = (match: BracketMatchView) => {
    if (match.round === "r32") {
      return !prediction?.isConfirmed && initialSettings.initialEffectiveStatus === "open";
    }

    return canEditRoundScores(
      match.round,
      roundWindowMap.get(match.round) ?? null,
      prediction,
      submittedRounds,
    );
  };

  return (
    <div className="space-y-6">
      <Surface className="p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              Estado del juego
            </p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--ink)]">
              {prediction?.isConfirmed ? "Tu cuadro ya esta confirmado" : "Arma tu cuadro"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">
              Confirma todos los equipos y marcadores de 16avos una sola vez. Las
              rondas siguientes se habilitan por ventanas administradas.
            </p>
          </div>

          <div className="rounded-[24px] bg-[var(--surface-soft)] px-5 py-4 text-sm text-[var(--muted-ink)]">
            <strong className="text-[var(--ink)]">Ventana inicial:</strong>{" "}
            {initialSettings.initialEffectiveStatus === "open"
              ? "abierta"
              : initialSettings.initialEffectiveStatus === "closed"
                ? "cerrada"
                : "bloqueada"}
          </div>
        </div>

        {initialLockReason ? (
          <p className="mt-5 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
            {initialLockReason}
          </p>
        ) : null}

        {initialState.message ? (
          <p className="mt-4 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
            {initialState.message}
          </p>
        ) : null}

      {roundState.message ? (
        <p className="mt-4 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
          {roundState.message}
        </p>
      ) : null}
      </Surface>

      <MapUsageHint />

      <div className="rounded-[32px] bg-[linear-gradient(160deg,#0f5130_0%,#0b2d1b_55%,#0b1621_100%)] p-2 sm:p-4">
        <BracketFlow
          matches={matchesByStage}
          picks={pickMap}
          canEditTeams={canEditTeams}
          canEditScores={canEditScoresForMatch}
          onPickWinner={(matchId, teamId) =>
            updatePick(matchId, (current) => ({
              ...current,
              predictedAdvancingTeamId: teamId,
            }))
          }
          onChangeScore={(matchId, side, value) =>
            updatePick(matchId, (current) => ({
              ...current,
              homeScore: side === "home" ? value : current.homeScore,
              awayScore: side === "away" ? value : current.awayScore,
            }))
          }
          resolveTeams={resolveTeams}
          officialResults={officialMap}
        />
      </div>

      {!prediction?.isConfirmed ? (
        <Surface className="p-6" data-tour="confirm">
          <form
            action={initialAction}
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              if (!initialComplete) {
                e.preventDefault();
              }
            }}
          >
            <input
              name="payload"
              type="hidden"
              value={serializeInitialPayload(localPicks)}
            />
            <div>
              <h3 className="font-serif text-2xl text-[var(--ink)]">
                Confirmar cuadro inicial
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-ink)]">
                Antes de confirmar debes elegir el equipo que avanza en{" "}
                <strong>todas las rondas (16avos hasta la final)</strong> y los
                marcadores de 16avos. Al confirmar, los equipos quedan fijos para
                siempre y se habilitan los marcadores de las fases que abra el admin.
              </p>
            </div>

            <ul className="flex flex-col gap-2">
              {ROUND_ORDER.map((round) => {
                const pending = missingTeamsByRound[round] ?? 0;
                const done = pending === 0;
                return (
                  <li
                    key={round}
                    className="flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-4 py-2 text-sm"
                  >
                    <span className="font-semibold text-[var(--ink)]">
                      Equipos · {ROUND_LABELS[round]}
                    </span>
                    <span className={done ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                      {done ? "✓ Completo" : `Faltan ${pending}`}
                    </span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between rounded-2xl bg-[var(--surface-soft)] px-4 py-2 text-sm">
                <span className="font-semibold text-[var(--ink)]">
                  Marcadores · 16avos
                </span>
                <span
                  className={
                    initialMissing.missingRound32Scores.length === 0
                      ? "text-[var(--accent)]"
                      : "text-[var(--danger)]"
                  }
                >
                  {initialMissing.missingRound32Scores.length === 0
                    ? "✓ Completo"
                    : `Faltan ${initialMissing.missingRound32Scores.length}`}
                </span>
              </li>
            </ul>

            <SubmitButton disabled={!initialComplete}>
              {initialComplete
                ? "Confirmar cuadro inicial"
                : "Completa el cuadro para confirmar"}
            </SubmitButton>
          </form>
        </Surface>
      ) : null}

      {prediction?.isConfirmed ? (
        <Surface className="p-6" data-tour="phases">
          <div>
            <h3 className="font-serif text-2xl text-[var(--ink)]">
              Marcadores por fase
            </h3>
            <p className="mt-1 text-sm leading-6 text-[var(--muted-ink)]">
              Los marcadores se escriben arriba, en cada partido. Cuando el admin
              abra una fase, completa sus marcadores y envíala desde aquí. Una vez
              enviada, esa fase queda fija.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {ROUND_ORDER.filter((round) => round !== "r32").map((round) => {
              const window = roundWindowMap.get(round) ?? null;
              const matchIds = matchesByStage[round].map((match) => match.id);
              const submitted = submittedRounds.includes(round);
              const editable = canEditRoundScores(
                round,
                window,
                prediction,
                submittedRounds,
              );
              const pendingScores = missingRoundScores(matches, localPicks, round).length;

              let badge: string;
              let badgeTone: string;
              if (submitted) {
                badge = "✅ Enviada";
                badgeTone = "bg-[rgba(24,99,62,0.12)] text-[var(--accent)]";
              } else if (!window || window.effectiveStatus === "locked") {
                badge = "🔒 La abre el admin";
                badgeTone = "bg-[var(--surface-soft)] text-[var(--muted-ink)]";
              } else if (window.effectiveStatus === "closed") {
                badge = "⏳ Cerrada";
                badgeTone = "bg-[var(--surface-soft)] text-[var(--muted-ink)]";
              } else {
                badge = "✏️ Abierta";
                badgeTone = "bg-[rgba(24,99,62,0.12)] text-[var(--accent)]";
              }

              const ready = editable && pendingScores === 0;
              const buttonLabel = submitted
                ? "Ronda enviada"
                : editable && pendingScores > 0
                  ? `Faltan ${pendingScores} marcador(es)`
                  : `Enviar ${ROUND_LABELS[round]}`;

              return (
                <div
                  key={round}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-xl text-[var(--ink)]">
                      {ROUND_LABELS[round]}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeTone}`}
                    >
                      {badge}
                    </span>
                  </div>

                  <form
                    action={roundAction}
                    onSubmit={(e) => {
                      if (!ready) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <input
                      name="payload"
                      type="hidden"
                      value={serializeRoundPayload(round, localPicks, matchIds)}
                    />
                    <SubmitButton
                      tone={ready ? "primary" : "secondary"}
                      disabled={!ready}
                    >
                      {buttonLabel}
                    </SubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}
