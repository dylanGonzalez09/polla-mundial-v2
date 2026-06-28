type ScoreLike = {
  homeScore: number | null;
  awayScore: number | null;
};

function scoreSign(homeScore: number, awayScore: number) {
  if (homeScore === awayScore) {
    return 0;
  }

  return homeScore > awayScore ? 1 : -1;
}

export function scoreMatch(pick: ScoreLike, official: ScoreLike) {
  if (
    pick.homeScore === null ||
    pick.awayScore === null ||
    official.homeScore === null ||
    official.awayScore === null
  ) {
    return 0;
  }

  if (
    pick.homeScore === official.homeScore &&
    pick.awayScore === official.awayScore
  ) {
    return 3;
  }

  return scoreSign(pick.homeScore, pick.awayScore) ===
    scoreSign(official.homeScore, official.awayScore)
    ? 1
    : 0;
}
