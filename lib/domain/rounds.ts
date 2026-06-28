import type { RoundKey } from "@/lib/domain/types";

export const ROUND_ORDER: RoundKey[] = [
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export const EDITABLE_SCORE_ROUNDS: RoundKey[] = [
  "r16",
  "qf",
  "sf",
  "third",
  "final",
];

export const ROUND_LABELS: Record<RoundKey, string> = {
  r32: "16avos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer lugar",
  final: "Final",
};

export function isRoundKey(value: string): value is RoundKey {
  return value in ROUND_LABELS;
}
