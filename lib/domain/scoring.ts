type ScoreLike = {
  homeScore: number | null;
  awayScore: number | null;
};

/**
 * Puntaje por partido, combinando dos dimensiones independientes:
 *
 * - **Ganador**: acertaste el equipo que avanza de esta posición (sin importar
 *   si el cruce fue el correcto). Para 16avos equivale a acertar quién avanza.
 * - **Cruce**: los dos equipos del cruce pronosticado coinciden con los reales.
 * - **Marcador**: el marcador exacto a 90' coincide con el oficial.
 *
 * Reglas:
 * - Ganador correcto + marcador exacto → 4
 * - Empate exacto, pero sin acertar quien avanza → 3
 * - Solo marcador exacto → 2
 * - Solo ganador correcto → 1
 * - En cualquier otro caso → 0
 */
export function scoreMatch(
  pick: ScoreLike,
  official: ScoreLike,
  advancingCorrect: boolean,
) {
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

  if (advancingCorrect && scoreExact) {
    return 4;
  }

  if (officialDraw && scoreExact) {
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
