import type {
  BracketMatchView,
  PredictionPick,
  Team,
  TournamentMatch,
} from "@/lib/domain/types";
import { ROUND_ORDER } from "@/lib/domain/rounds";

type TeamMap = Map<number, Team>;
type MatchMap = Map<number, TournamentMatch>;
type PickMap = Map<number, PredictionPick>;
type ResolvedMap = Map<number, ResolvedMatch>;

export type ResolvedMatch = BracketMatchView & {
  predictedTeam: Team | null;
};

function teamById(teamMap: TeamMap, teamId: number | null) {
  return teamId ? teamMap.get(teamId) ?? null : null;
}

function pickByMatch(pickMap: PickMap, matchId: number | null) {
  return matchId ? pickMap.get(matchId) ?? null : null;
}

function resolveSourceTeam(
  sourceMatch: ResolvedMatch,
  sourcePick: PredictionPick | null,
  teamMap: TeamMap,
) {
  const home = sourceMatch.homeTeam ?? teamById(teamMap, sourceMatch.homeTeamId);
  const away = sourceMatch.awayTeam ?? teamById(teamMap, sourceMatch.awayTeamId);
  const chosen = sourcePick?.predictedAdvancingTeamId ?? null;

  return {
    home,
    away,
    chosen: chosen ? teamMap.get(chosen) ?? null : null,
  };
}

function resolveSlotTeam(
  resolvedMap: ResolvedMap,
  matchMap: MatchMap,
  pickMap: PickMap,
  teamMap: TeamMap,
  sourceMatchId: number | null,
  sourceType: TournamentMatch["homeSourceType"],
  fallbackTeamId: number | null,
) {
  if (!sourceMatchId || !sourceType) {
    return teamById(teamMap, fallbackTeamId);
  }

  const baseMatch = matchMap.get(sourceMatchId);
  const feeder = resolvedMap.get(sourceMatchId);
  const sourceMatch =
    feeder ??
    (baseMatch
      ? {
          ...baseMatch,
          homeTeam: teamById(teamMap, baseMatch.homeTeamId),
          awayTeam: teamById(teamMap, baseMatch.awayTeamId),
          predictedTeam: null,
        }
      : null);
  if (!sourceMatch) {
    return null;
  }

  const feederPick = pickByMatch(pickMap, sourceMatchId);
  const resolved = resolveSourceTeam(sourceMatch, feederPick, teamMap);

  if (!resolved.home || !resolved.away || !resolved.chosen) {
    return null;
  }

  if (sourceType === "winner") {
    return resolved.chosen;
  }

  return resolved.chosen.id === resolved.home.id ? resolved.away : resolved.home;
}

export function buildResolvedMatches(
  matches: TournamentMatch[],
  teams: Team[],
  picks: PredictionPick[],
): ResolvedMatch[] {
  const teamMap: TeamMap = new Map(teams.map((team) => [team.id, team]));
  const matchMap: MatchMap = new Map(matches.map((match) => [match.id, match]));
  const pickMap: PickMap = new Map(picks.map((pick) => [pick.matchId, pick]));
  const resolvedMap: ResolvedMap = new Map();
  const resolvedMatches = [...matches]
    .sort((left, right) => left.id - right.id)
    .map((match) => {
      const homeTeam = resolveSlotTeam(
        resolvedMap,
        matchMap,
        pickMap,
        teamMap,
        match.homeSourceMatchId,
        match.homeSourceType,
        match.homeTeamId,
      );
      const awayTeam = resolveSlotTeam(
        resolvedMap,
        matchMap,
        pickMap,
        teamMap,
        match.awaySourceMatchId,
        match.awaySourceType,
        match.awayTeamId,
      );
      const predictedTeam = teamById(
        teamMap,
        pickMap.get(match.id)?.predictedAdvancingTeamId ?? null,
      );

      const resolvedMatch = {
        ...match,
        homeTeam,
        awayTeam,
        predictedTeam,
      };

      resolvedMap.set(match.id, resolvedMatch);
      return resolvedMatch;
    });

  return resolvedMatches;
}

export function matchesByRound<TMatch extends { round: (typeof ROUND_ORDER)[number] }>(
  matches: TMatch[],
) {
  return ROUND_ORDER.reduce(
    (accumulator, round) => {
      accumulator[round] = matches.filter((match) => match.round === round);
      return accumulator;
    },
    {} as Record<(typeof ROUND_ORDER)[number], TMatch[]>,
  );
}
