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
          { homeScore: pick?.homeScore ?? null, awayScore: pick?.awayScore ?? null },
          officialResult,
          advancingCorrect,
          matchupCorrect,
          match.round === "r32",
        )
      : null;

  const officialTeamsLabel =
    officialResult?.realHomeTeamName && officialResult.realAwayTeamName
      ? `${officialResult.realHomeTeamName} vs ${officialResult.realAwayTeamName}`
      : null;

  return (
    <Surface className="p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--accent)]">
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

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
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
        <span className="col-span-2 text-center text-sm font-semibold text-[var(--muted-ink)] sm:col-span-1 sm:pb-2">
          vs
        </span>
        <div className="flex flex-col gap-1">
          <span className="truncate text-xs font-semibold text-[var(--muted-ink)] sm:text-right">
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
        <div className="mt-4 rounded-[24px] bg-[var(--surface-soft)] px-3 py-3 sm:px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                Resultado oficial
              </p>
              {officialTeamsLabel ? (
                <p className="text-sm font-semibold text-[var(--ink)]">
                  {officialTeamsLabel}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white px-2.5 py-1 text-[var(--ink)]">
                  {officialResult.homeScore}-{officialResult.awayScore}
                </span>
                {officialResult.advancingTeamName ? (
                  <span className="rounded-full bg-[rgba(24,99,62,0.12)] px-2.5 py-1 text-[var(--accent)]">
                    Avanza {officialResult.advancingTeamName}
                  </span>
                ) : null}
              </div>
            </div>

            {points === null ? (
              <span className="text-xs font-semibold text-[var(--muted-ink)]">
                Sin pronostico
              </span>
            ) : points === 4 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                Ganador + marcador · +4
              </span>
            ) : points === 3 ? (
              <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-800">
                {match.round === "r32" ? "Marcador exacto · +3" : "Empate exacto · +3"}
              </span>
            ) : points === 2 ? (
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                Marcador exacto · +2
              </span>
            ) : points === 1 ? (
              <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                Ganador acertado · +1
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                Sin aciertos · 0
              </span>
            )}
          </div>
        </div>
      ) : null}
    </Surface>
  );
}
