import type { RoundKey } from "./types";

type ScoreLike = {
  homeScore: number | null;
  awayScore: number | null;
};

/**
 * Matriz de puntaje:
 *
 * - 16avos:
 *   - ganador + marcador exacto = 4
 *   - marcador exacto = 3
 *   - solo ganador = 1
 *   - resto = 0
 *
 * - Octavos a semifinal:
 *   - ganador + marcador exacto = 4
 *   - empate exacto + cruce correcto, pero sin acertar quien avanza = 3
 *   - solo marcador exacto = 2
 *   - solo ganador = 1
 *   - resto = 0
 *
 * - Tercer lugar y final (puntaje aditivo: ganador + bono de marcador):
 *   - ganador: 3 (tercer lugar) / 7 (final)
 *   - + 3 adicional si acierta el marcador exacto
 *   - solo marcador exacto = 3
 *   - resto = 0
 */
export function scoreMatch(
  pick: ScoreLike,
  official: ScoreLike,
  advancingCorrect: boolean,
  matchupCorrect: boolean,
  round: RoundKey,
) {
  const isRoundOf32 = round === "r32";

  const scoreExact =
    pick.homeScore !== null &&
    pick.awayScore !== null &&
    official.homeScore !== null &&
    official.awayScore !== null &&
    pick.homeScore === official.homeScore &&
    pick.awayScore === official.awayScore;

  const officialDraw =
    official.homeScore !== null &&
    official.awayScore !== null &&
    official.homeScore === official.awayScore;

  if (round === "third" || round === "final") {
    const winnerPoints = advancingCorrect ? (round === "final" ? 7 : 3) : 0;
    const exactBonus = scoreExact ? 3 : 0;
    return winnerPoints + exactBonus;
  }

  if (advancingCorrect && scoreExact) {
    return 4;
  }

  if (isRoundOf32 && scoreExact) {
    return 3;
  }

  if (officialDraw && matchupCorrect && scoreExact) {
    return 3;
  }

  if (scoreExact) {
    return 2;
  }

  if (advancingCorrect) {
    return 1;
  }

  return 0;
}
