export type LeagueTier = "bronze" | "silver" | "gold" | "diamond" | "obsidian";

export type League = {
  tier: LeagueTier;
  label: string;
  minPoints: number;
};

// Puntaje maximo teorico del torneo: 16 partidos de 16avos (4 pts c/u) + 8 de
// octavos + 4 de cuartos + 2 de semis + final + tercer puesto (4 pts c/u) =
// 64 + 32 + 16 + 8 + 4 + 4 = 128. Los umbrales son porcentajes redondos de
// ese maximo, mas juntos entre si para que la liga cambie con cada tramo de
// puntaje en vez de agrupar rangos anchos; ajustar aqui si cambia la matriz
// de puntaje o el formato.
export const LEAGUES: League[] = [
  { tier: "bronze", label: "Liga Bronce", minPoints: 0 },
  { tier: "silver", label: "Liga Plata", minPoints: 8 },
  { tier: "gold", label: "Liga Oro", minPoints: 20 },
  { tier: "diamond", label: "Liga Diamante", minPoints: 35 },
  { tier: "obsidian", label: "Liga Obsidiana", minPoints: 55 },
];

export function getLeague(totalPoints: number): League {
  let current = LEAGUES[0];
  for (const league of LEAGUES) {
    if (totalPoints >= league.minPoints) {
      current = league;
    }
  }
  return current;
}
