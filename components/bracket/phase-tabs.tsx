"use client";

import { useState } from "react";

import type { PredictionPick, RoundKey, Team } from "@/lib/domain/types";
import type { BracketMatchView } from "@/lib/domain/types";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import { MatchCard, type OfficialCell } from "@/components/bracket/match-card";

type PhaseTabsProps = {
  matches: Record<RoundKey, BracketMatchView[]>;
  picks: Map<number, PredictionPick>;
  canEditTeams: (match: BracketMatchView) => boolean;
  canEditScores: (match: BracketMatchView) => boolean;
  onPickWinner: (matchId: number, teamId: number) => void;
  onChangeScore: (
    matchId: number,
    side: "home" | "away",
    value: number | null,
  ) => void;
  resolveTeams: (match: BracketMatchView) => { homeTeam: Team | null; awayTeam: Team | null };
  officialResults?: Map<number, OfficialCell>;
  readOnly?: boolean;
};

export function PhaseTabs({
  matches,
  picks,
  canEditTeams,
  canEditScores,
  onPickWinner,
  onChangeScore,
  resolveTeams,
  officialResults,
  readOnly = false,
}: PhaseTabsProps) {
  const [activeRound, setActiveRound] = useState<RoundKey>("r32");

  return (
    <div className="lg:hidden">
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {ROUND_ORDER.map((round) => (
          <button
            key={round}
            className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeRound === round
                ? "bg-white text-[var(--ink)]"
                : "bg-white/15 text-white"
            }`}
            type="button"
            onClick={() => setActiveRound(round)}
          >
            {ROUND_LABELS[round]}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {matches[activeRound].map((match) => {
          const { homeTeam, awayTeam } = resolveTeams(match);
          return (
            <MatchCard
              key={match.id}
              match={match}
              pick={picks.get(match.id)}
              readOnly={readOnly}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              canEditTeams={canEditTeams(match)}
              canEditScores={canEditScores(match)}
              officialResult={officialResults?.get(match.id) ?? null}
              onPickWinner={(teamId) => onPickWinner(match.id, teamId)}
              onChangeScore={(side, value) => onChangeScore(match.id, side, value)}
            />
          );
        })}
      </div>
    </div>
  );
}
