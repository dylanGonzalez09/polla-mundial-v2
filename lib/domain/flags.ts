// Codigos FIFA (3 letras) -> ISO 3166-1 alfa-2, para pintar la bandera emoji.
// Cubre las selecciones clasificadas/en camino al Mundial 2026 que ya existen
// en el catalogo de equipos.
export const FIFA_TO_ISO2: Record<string, string> = {
  RSA: "ZA",
  CAN: "CA",
  GER: "DE",
  PAR: "PY",
  NED: "NL",
  MAR: "MA",
  BRA: "BR",
  JPN: "JP",
  FRA: "FR",
  SWE: "SE",
  CIV: "CI",
  NOR: "NO",
  MEX: "MX",
  ECU: "EC",
  COD: "CD",
  USA: "US",
  BIH: "BA",
  BEL: "BE",
  SEN: "SN",
  POR: "PT",
  HRV: "HR",
  ESP: "ES",
  AUT: "AT",
  SUI: "CH",
  DZA: "DZ",
  ARG: "AR",
  CPV: "CV",
  COL: "CO",
  GHA: "GH",
  AUS: "AU",
  EGY: "EG",
  ITA: "IT",
  URU: "UY",
  CHI: "CL",
  PER: "PE",
  VEN: "VE",
  BOL: "BO",
  KOR: "KR",
  IRN: "IR",
  KSA: "SA",
  QAT: "QA",
  JOR: "JO",
  UZB: "UZ",
  NZL: "NZ",
  PAN: "PA",
  CRC: "CR",
  JAM: "JM",
  HAI: "HT",
  TUN: "TN",
  NGA: "NG",
};

export function teamFlagEmoji(code: string | undefined | null): string | null {
  if (!code) {
    return null;
  }
  if (code === "ENG") {
    return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  }
  const iso = FIFA_TO_ISO2[code];
  if (!iso) {
    return null;
  }
  return String.fromCodePoint(
    ...[...iso].map((char) => 127397 + char.charCodeAt(0)),
  );
}
