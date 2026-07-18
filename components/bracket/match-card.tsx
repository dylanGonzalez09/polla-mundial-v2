"use client";

import { ScoreInput } from "@/components/bracket/score-input";
import { TeamSlot } from "@/components/bracket/team-slot";
import { Surface } from "@/components/ui/card";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import { scoreMatch } from "@/lib/domain/scoring";
import type {
  BracketMatchView,
  PredictionPick,
  Team,
} from "@/lib/domain/types";

export type OfficialCell = {
  homeScore: number | null;
  awayScore: number | null;
  advancingTeamId?: number | null;
  advancingTeamName?: string | null;
  realHomeTeamId?: number | null;
  realAwayTeamId?: number | null;
  realHomeTeamName?: string | null;
  realAwayTeamName?: string | null;
};

type MatchCardProps = {
  match: BracketMatchView;
  pick: PredictionPick | undefined;
  canEditTeams: boolean;
  canEditScores: boolean;
  readOnly?: boolean;
  homeTeam: Team | null;
  awayTeam: Team | null;
  officialResult?: OfficialCell | null;
  onPickWinner?: (teamId: number) => void;
  onChangeScore?: (side: "home" | "away", value: number | null) => void;
};

function OfficialOccupant({ name }: { name: string }) {
  return (
    <div className="ml-3 flex items-center gap-2 rounded-xl border border-dashed border-[var(--live)] bg-[rgba(224,16,47,0.06)] px-3 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--live)]">
        Avanzó
      </span>
      <span className="truncate text-xs font-semibold text-[var(--ink)]">
        {name}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  pick,
  canEditTeams,
  canEditScores,
  readOnly = false,
  homeTeam,
  awayTeam,
  officialResult,
  onPickWinner,
  onChangeScore,
}: MatchCardProps) {
  const lockLabel = readOnly
    ? "Solo lectura"
    : canEditScores || canEditTeams
      ? "Editable"
      : "Bloqueado";

  const hasOfficial =
    officialResult != null &&
    officialResult.homeScore !== null &&
    officialResult.awayScore !== null;

  const advancingCorrect =
    hasOfficial &&
    officialResult.advancingTeamId != null &&
    pick?.predictedAdvancingTeamId === officialResult.advancingTeamId;

  const matchupCorrect =
    hasOfficial &&
    officialResult.realHomeTeamId != null &&
    officialResult.realAwayTeamId != null &&
    homeTeam?.id === officialResult.realHomeTeamId &&
    awayTeam?.id === officialResult.realAwayTeamId;

  const hasPick =
    pick != null &&
    (pick.predictedAdvancingTeamId != null ||
      (pick.homeScore != null && pick.awayScore != null));

  const points =
    hasOfficial && hasPick
      ? scoreMatch(
          {
            homeScore: pick?.homeScore ?? null,
            awayScore: pick?.awayScore ?? null,
          },
          officialResult,
          advancingCorrect,
          matchupCorrect,
          match.round,
        )
      : null;

  // El ocupante real de cada slot (derivado de los avances oficiales de la
  // ronda anterior) difiere del equipo que el usuario habia puesto. Sirve para
  // mostrar quien paso de verdad sin borrar la prediccion del usuario.
  const officialHomeMismatch =
    officialResult?.realHomeTeamId != null &&
    officialResult.realHomeTeamId !== homeTeam?.id &&
    officialResult.realHomeTeamName != null;

  const officialAwayMismatch =
    officialResult?.realAwayTeamId != null &&
    officialResult.realAwayTeamId !== awayTeam?.id &&
    officialResult.realAwayTeamName != null;

  const officialTeamsLabel =
    officialResult?.realHomeTeamName && officialResult.realAwayTeamName
      ? `${officialResult.realHomeTeamName} vs ${officialResult.realAwayTeamName}`
      : null;

  return (
    <Surface className="min-w-0 p-3 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">
            {match.code}
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--muted-ink)]">
            {ROUND_LABELS[match.round]}
          </div>
        </div>
        <div className="shrink-0 rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted-ink)]">
          {lockLabel}
        </div>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <TeamSlot
              team={homeTeam}
              selected={pick?.predictedAdvancingTeamId === homeTeam?.id}
              disabled={readOnly || !canEditTeams}
              onSelect={
                homeTeam && onPickWinner
                  ? () => onPickWinner(homeTeam.id)
                  : undefined
              }
            />
            <ScoreInput
              className="w-12 shrink-0 sm:w-16"
              disabled={readOnly || !canEditScores}
              value={pick?.homeScore ?? null}
              onChange={(value) => onChangeScore?.("home", value)}
              label={homeTeam?.name ?? "local"}
            />
          </div>
          {officialHomeMismatch ? (
            <OfficialOccupant name={officialResult!.realHomeTeamName!} />
          ) : null}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <TeamSlot
              team={awayTeam}
              selected={pick?.predictedAdvancingTeamId === awayTeam?.id}
              disabled={readOnly || !canEditTeams}
              onSelect={
                awayTeam && onPickWinner
                  ? () => onPickWinner(awayTeam.id)
                  : undefined
              }
            />
            <ScoreInput
              className="w-12 shrink-0 sm:w-16"
              disabled={readOnly || !canEditScores}
              value={pick?.awayScore ?? null}
              onChange={(value) => onChangeScore?.("away", value)}
              label={awayTeam?.name ?? "visitante"}
            />
          </div>
          {officialAwayMismatch ? (
            <OfficialOccupant name={officialResult!.realAwayTeamName!} />
          ) : null}
        </div>
      </div>

      <div
        className="mt-3 text-xs text-[var(--muted-ink)]"
        suppressHydrationWarning
      >
        {new Intl.DateTimeFormat("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "America/Bogota",
        }).format(new Date(match.matchDate))}
      </div>

      {hasOfficial ? (
        <div className="mt-4 rounded-2xl bg-[var(--chip-active)] px-4 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--gold)]">
                Resultado oficial
              </p>
              {officialTeamsLabel ? (
                <p className="text-sm font-semibold text-white/90">
                  {officialTeamsLabel}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <span className="tabular-nums font-display text-2xl text-[var(--gold)]">
                  {officialResult.homeScore}-{officialResult.awayScore}
                </span>
                {officialResult.advancingTeamName ? (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                    Avanza {officialResult.advancingTeamName}
                  </span>
                ) : null}
              </div>
            </div>

            {points === null ? (
              <span className="text-xs font-semibold text-white/60">
                Sin pronostico
              </span>
            ) : points === 4 ? (
              <span className="rounded-full bg-[var(--gold)] px-2.5 py-1 text-xs font-bold text-[var(--chip-active)]">
                🥇 Ganador + marcador · +4
              </span>
            ) : points === 3 ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-800">
                {match.round === "r32"
                  ? "Marcador exacto · +3"
                  : "Empate exacto · +3"}
              </span>
            ) : points === 2 ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                Marcador exacto · +2
              </span>
            ) : points === 1 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                Ganador acertado · +1
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/70">
                Sin aciertos · 0
              </span>
            )}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
