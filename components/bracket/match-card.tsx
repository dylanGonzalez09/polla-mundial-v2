"use client";

import { ScoreInput } from "@/components/bracket/score-input";
import { TeamSlot } from "@/components/bracket/team-slot";
import { Surface } from "@/components/ui/card";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import { scoreMatch } from "@/lib/domain/scoring";
import type { BracketMatchView, PredictionPick, Team } from "@/lib/domain/types";

export type OfficialCell = {
  homeScore: number | null;
  awayScore: number | null;
  /** Equipo que avanzó oficialmente en esta posición. */
  advancingTeamId?: number | null;
  /** Equipos que realmente ocuparon el cruce (derivados de resultados oficiales). */
  realHomeTeamId?: number | null;
  realAwayTeamId?: number | null;
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

  // advancingCorrect: acertaste el equipo que avanza de esta posición
  // (independiente de si el cruce es correcto).
  const advancingCorrect =
    hasOfficial &&
    officialResult.advancingTeamId != null &&
    pick?.predictedAdvancingTeamId === officialResult.advancingTeamId;

  const hasPick =
    pick != null &&
    (pick.predictedAdvancingTeamId != null ||
      (pick.homeScore != null && pick.awayScore != null));

  const points =
    hasOfficial && hasPick
      ? scoreMatch(
          { homeScore: pick?.homeScore ?? null, awayScore: pick?.awayScore ?? null },
          officialResult,
          advancingCorrect,
        )
      : null;

  return (
    <Surface className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
            {match.code}
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--muted-ink)]">
            {ROUND_LABELS[match.round]}
          </div>
        </div>
        <div className="rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--muted-ink)]">
          {lockLabel}
        </div>
      </div>

      <div className="space-y-3">
        <TeamSlot
          team={homeTeam}
          selected={pick?.predictedAdvancingTeamId === homeTeam?.id}
          disabled={readOnly || !canEditTeams}
          onSelect={
            homeTeam && onPickWinner ? () => onPickWinner(homeTeam.id) : undefined
          }
        />
        <TeamSlot
          team={awayTeam}
          selected={pick?.predictedAdvancingTeamId === awayTeam?.id}
          disabled={readOnly || !canEditTeams}
          onSelect={
            awayTeam && onPickWinner ? () => onPickWinner(awayTeam.id) : undefined
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs font-semibold text-[var(--muted-ink)]">
            {homeTeam?.name ?? "Local"}
          </span>
          <ScoreInput
            disabled={readOnly || !canEditScores}
            value={pick?.homeScore ?? null}
            onChange={(value) => onChangeScore?.("home", value)}
            label={homeTeam?.name ?? "local"}
          />
        </div>
        <span className="pb-2 text-sm font-semibold text-[var(--muted-ink)]">vs</span>
        <div className="flex flex-col gap-1">
          <span className="truncate text-right text-xs font-semibold text-[var(--muted-ink)]">
            {awayTeam?.name ?? "Visitante"}
          </span>
          <ScoreInput
            disabled={readOnly || !canEditScores}
            value={pick?.awayScore ?? null}
            onChange={(value) => onChangeScore?.("away", value)}
            label={awayTeam?.name ?? "visitante"}
          />
        </div>
      </div>

      <div className="mt-4 text-xs text-[var(--muted-ink)]">
        {new Intl.DateTimeFormat("es-CO", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(match.matchDate))}
      </div>

      {hasOfficial ? (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-[var(--surface-soft)] px-3 py-2 text-xs font-semibold">
          <span className="text-[var(--muted-ink)]">
            Oficial {officialResult.homeScore}–{officialResult.awayScore}
          </span>
          {points === null ? (
            <span className="text-[var(--muted-ink)]">Sin pronostico</span>
          ) : points === 4 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
              ✓ Ganador + marcador · +4
            </span>
          ) : points === 2 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800">
              ✓ Marcador exacto · +2
            </span>
          ) : points === 1 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
              ≈ Ganador acertado · +1
            </span>
          ) : (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-800">
              ✗ Sin aciertos · 0
            </span>
          )}
        </div>
      ) : null}
    </Surface>
  );
}
