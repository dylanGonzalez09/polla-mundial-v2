import type { PredictionPick, RoundKey, Team } from "@/lib/domain/types";
import type { BracketMatchView } from "@/lib/domain/types";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import { MatchCard } from "@/components/bracket/match-card";

type BracketViewProps = {
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
  officialResults?: Map<number, { homeScore: number | null; awayScore: number | null }>;
  readOnly?: boolean;
};

export function BracketView({
  matches,
  picks,
  canEditTeams,
  canEditScores,
  onPickWinner,
  onChangeScore,
  resolveTeams,
  officialResults,
  readOnly = false,
}: BracketViewProps) {
  return (
    <div className="hidden overflow-x-auto pb-2 lg:block">
      <div className="flex gap-6">
      {ROUND_ORDER.map((round) => (
        <div key={round} className="flex w-[260px] shrink-0 flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl text-white">{ROUND_LABELS[round]}</h2>
            <p className="text-sm text-white/70">
              {round === "r32" ? "Arranque del cuadro" : "Sigue la cascada de tus picks"}
            </p>
          </div>
          {matches[round].map((match) => {
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
      ))}
      </div>
    </div>
  );
}
