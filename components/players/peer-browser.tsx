"use client";

import { useMemo, useState } from "react";

import { BracketFlow } from "@/components/bracket/bracket-flow";
import { MapUsageHint } from "@/components/bracket/map-usage-hint";
import { Surface } from "@/components/ui/card";
import { Flag } from "@/components/ui/flag";
import { LeagueBadge } from "@/components/ui/league-badge";
import { buildResolvedMatches, matchesByRound } from "@/lib/domain/bracket";
import { getLeague, type LeagueTier } from "@/lib/domain/leagues";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import { scoreMatch } from "@/lib/domain/scoring";
import type {
  BracketMatchView,
  OfficialResult,
  PredictionPick,
  RoundKey,
  Team,
} from "@/lib/domain/types";

type Peer = {
  userId: string;
  displayName: string;
  hasInitial: boolean;
  totalPoints: number;
  phaseStatus: Partial<Record<RoundKey, boolean>>;
  picks: PredictionPick[];
};

// Fondo del banner de jugador tenido con el color de su liga, para que el
// escudo no sea el unico indicio de rango.
const LEAGUE_BANNER_CLASS: Record<LeagueTier, string> = {
  bronze:
    "border-[#d3812f] bg-[linear-gradient(115deg,rgba(211,129,47,0.22),transparent_56%)]",
  silver:
    "border-[#b7c0cc] bg-[linear-gradient(115deg,rgba(183,192,204,0.2),transparent_56%)]",
  gold: "border-[#f5b301] bg-[linear-gradient(115deg,rgba(245,179,1,0.24),transparent_56%)]",
  diamond:
    "border-[#54c8ff] bg-[linear-gradient(115deg,rgba(61,139,255,0.25),transparent_56%)]",
  obsidian:
    "border-[#c9a6ff] bg-[linear-gradient(115deg,rgba(74,63,107,0.35),rgba(201,166,255,0.14)_48%,transparent_76%)]",
};

const LEAGUE_CHIP_ACTIVE_CLASS: Record<LeagueTier, string> = {
  bronze: "bg-[var(--bronze)] text-white",
  silver: "bg-[var(--silver)] text-[var(--chip-active)]",
  gold: "bg-[var(--gold)] text-[var(--chip-active)]",
  diamond: "bg-[var(--info)] text-white",
  obsidian: "bg-[linear-gradient(120deg,#4a3f6b,#0a0812)] text-white",
};

// Marco por liga: estilo de borde + resplandor propio, para que el banner se
// vea distinto por rango y no solo cambie de color.
const LEAGUE_FRAME_CLASS: Record<LeagueTier, string> = {
  bronze: "border-solid shadow-[0_22px_55px_rgba(211,129,47,0.16)]",
  silver: "border-solid shadow-[0_22px_55px_rgba(183,192,204,0.15)]",
  gold: "border-solid shadow-[0_20px_45px_rgba(245,179,1,0.28)]",
  diamond: "border-solid shadow-[0_20px_45px_rgba(61,139,255,0.24)]",
  obsidian: "border-solid shadow-[0_24px_55px_rgba(201,166,255,0.3)]",
};

const LEAGUE_ORNAMENT: Record<LeagueTier, string> = {
  bronze: "◆",
  silver: "✦",
  gold: "♛",
  diamond: "✧",
  obsidian: "★",
};

const LEAGUE_RIBBON_CLASS: Record<LeagueTier, string> = {
  bronze: "bg-[var(--bronze)] text-white",
  silver: "bg-[var(--silver)] text-[var(--chip-active)]",
  gold: "bg-[var(--gold)] text-[var(--chip-active)]",
  diamond: "bg-[var(--info)] text-white",
  obsidian: "bg-[linear-gradient(120deg,#4a3f6b,#0a0812)] text-white",
};

export function PeerBrowser({
  peers,
  matches,
  teams,
  unlockedRounds,
  officialResults,
}: {
  peers: Peer[];
  matches: BracketMatchView[];
  teams: Team[];
  unlockedRounds: RoundKey[];
  officialResults: OfficialResult[];
}) {
  const [activePeerId, setActivePeerId] = useState(peers[0]?.userId ?? "");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const activePeer = peers.find((peer) => peer.userId === activePeerId) ?? null;
  const activeLeague = activePeer ? getLeague(activePeer.totalPoints) : null;
  const pickMap = useMemo(
    () => new Map((activePeer?.picks ?? []).map((pick) => [pick.matchId, pick])),
    [activePeer],
  );
  const resolvedMatches = useMemo(
    () => buildResolvedMatches(matches, teams, activePeer?.picks ?? []),
    [activePeer, matches, teams],
  );
  const byRound = useMemo(() => matchesByRound(resolvedMatches), [resolvedMatches]);
  const resolvedMatchMap = useMemo(
    () => new Map(resolvedMatches.map((match) => [match.id, match])),
    [resolvedMatches],
  );
  const officialResolvedById = useMemo(() => {
    const officialPicks = officialResults.map((result) => ({
      matchId: result.matchId,
      predictedAdvancingTeamId: result.advancingTeamId,
      homeScore: null,
      awayScore: null,
    }));
    return new Map(
      buildResolvedMatches(matches, teams, officialPicks).map((match) => [
        match.id,
        match,
      ]),
    );
  }, [matches, teams, officialResults]);

  const officialMap = useMemo(() => {
    const resultById = new Map(
      officialResults.map((result) => [result.matchId, result]),
    );

    // Construimos una celda para TODOS los partidos (no solo los que ya
    // tienen marcador), para poder mostrar el ocupante oficial de cada cruce
    // en la ronda siguiente aunque ese partido aun no se juegue.
    return new Map(
      matches.map((match) => {
        const result = resultById.get(match.id) ?? null;
        const resolved = officialResolvedById.get(match.id);
        return [
          match.id,
          {
            homeScore: result?.homeScore ?? null,
            awayScore: result?.awayScore ?? null,
            advancingTeamId: result?.advancingTeamId ?? null,
            advancingTeamName:
              teams.find((team) => team.id === result?.advancingTeamId)?.name ??
              null,
            realHomeTeamId: resolved?.homeTeam?.id ?? null,
            realAwayTeamId: resolved?.awayTeam?.id ?? null,
            realHomeTeamName: resolved?.homeTeam?.name ?? null,
            realAwayTeamName: resolved?.awayTeam?.name ?? null,
          },
        ];
      }),
    );
  }, [matches, officialResults, officialResolvedById, teams]);

  const resolveTeams = (match: BracketMatchView) => {
    const resolved = resolvedMatchMap.get(match.id);

    return {
      homeTeam: resolved?.homeTeam ?? null,
      awayTeam: resolved?.awayTeam ?? null,
    };
  };

  const matchOptionsByRound = useMemo(() => {
    return ROUND_ORDER.map((round) => ({
      round,
      options: matches
        .filter((match) => match.round === round)
        .sort((left, right) => left.slotOrder - right.slotOrder)
        .map((match) => {
          const official = officialMap.get(match.id);
          const homeName =
            official?.realHomeTeamName ?? match.homeTeam?.name ?? "Por definir";
          const awayName =
            official?.realAwayTeamName ?? match.awayTeam?.name ?? "Por definir";
          return {
            id: match.id,
            label: `${homeName} vs ${awayName}`,
          };
        }),
    })).filter((group) => group.options.length > 0);
  }, [matches, officialMap]);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  const selectedMatchOfficial = useMemo(() => {
    if (!selectedMatch) {
      return null;
    }

    const official = officialMap.get(selectedMatch.id) ?? null;
    const hasOfficial =
      official != null && official.homeScore !== null && official.awayScore !== null;

    return {
      hasOfficial,
      homeTeamName: official?.realHomeTeamName ?? selectedMatch.code,
      awayTeamName: official?.realAwayTeamName ?? selectedMatch.code,
      homeScore: official?.homeScore ?? null,
      awayScore: official?.awayScore ?? null,
      advancingTeamName: official?.advancingTeamName ?? null,
    };
  }, [selectedMatch, officialMap]);

  const matchPicksByPeer = useMemo(() => {
    if (!selectedMatch) {
      return [];
    }

    const official = officialMap.get(selectedMatch.id) ?? null;
    const hasOfficial =
      official != null && official.homeScore !== null && official.awayScore !== null;

    return peers.map((peer) => {
      const resolved = buildResolvedMatches(matches, teams, peer.picks);
      const match = resolved.find((item) => item.id === selectedMatch.id) ?? null;
      const pick = peer.picks.find((item) => item.matchId === selectedMatch.id) ?? null;

      const advancingCorrect =
        hasOfficial &&
        official.advancingTeamId != null &&
        pick?.predictedAdvancingTeamId === official.advancingTeamId;

      const matchupCorrect =
        hasOfficial &&
        official.realHomeTeamId != null &&
        official.realAwayTeamId != null &&
        match?.homeTeam?.id === official.realHomeTeamId &&
        match?.awayTeam?.id === official.realAwayTeamId;

      const hasPick =
        pick != null &&
        (pick.predictedAdvancingTeamId != null ||
          (pick.homeScore != null && pick.awayScore != null));

      const points =
        hasOfficial && hasPick && official
          ? scoreMatch(
              { homeScore: pick?.homeScore ?? null, awayScore: pick?.awayScore ?? null },
              official,
              advancingCorrect,
              matchupCorrect,
              selectedMatch.round,
            )
          : null;

      const isCorrect = hasOfficial ? advancingCorrect : null;

      return {
        peer,
        homeTeam: match?.homeTeam ?? null,
        awayTeam: match?.awayTeam ?? null,
        predictedTeam: match?.predictedTeam ?? null,
        homeScore: pick?.homeScore ?? null,
        awayScore: pick?.awayScore ?? null,
        points,
        isCorrect,
      };
    });
  }, [selectedMatch, peers, matches, teams, officialMap]);

  if (!peers.length) {
    return (
      <Surface className="p-6">
        <p className="text-sm text-[var(--muted-ink)]">
          Aun no hay jugadores con fases visibles para comparar.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-6">
      <Surface accent="info" className="p-6">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg leading-none">
            🔎
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--info)]">
            Filtrar por partido
          </p>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-ink)]">
          Elige un cruce especifico (pais vs pais) para ver de un vistazo que
          pronostico cada jugador en ese partido, sin tener que abrir cuadro por
          cuadro. Usa &quot;Limpiar filtro&quot; para volver a la vista por jugador.
        </p>
        <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <select
            className="w-full min-w-0 max-w-full truncate rounded-full border-2 border-[var(--info)]/25 bg-[var(--surface-soft)] px-4 py-2 text-sm font-semibold text-[var(--ink)] sm:max-w-sm"
            value={selectedMatchId ?? ""}
            onChange={(event) =>
              setSelectedMatchId(
                event.target.value === "" ? null : Number(event.target.value),
              )
            }
          >
            <option value="">Selecciona un partido...</option>
            {matchOptionsByRound.map((group) => (
              <optgroup key={group.round} label={ROUND_LABELS[group.round]}>
                {group.options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedMatchId == null}
            onClick={() => setSelectedMatchId(null)}
            className="self-start rounded-full px-4 py-2 text-sm font-semibold text-[var(--muted-ink)] underline decoration-dotted disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
          >
            Limpiar filtro
          </button>
        </div>
      </Surface>

      {selectedMatch ? (
        <Surface accent="info" className="overflow-hidden">
          <div className="border-b border-[var(--line)] px-6 py-4 sm:px-8">
            <h2 className="font-display text-xl text-[var(--ink)]">
              {matchOptionsByRound
                .flatMap((group) => group.options)
                .find((option) => option.id === selectedMatch.id)?.label ??
                selectedMatch.code}
            </h2>
            {selectedMatchOfficial?.hasOfficial ? (
              <p className="mt-2 text-sm text-[var(--muted-ink)]">
                Resultado oficial: {selectedMatchOfficial.homeTeamName}{" "}
                {selectedMatchOfficial.homeScore} - {selectedMatchOfficial.awayScore}{" "}
                {selectedMatchOfficial.awayTeamName}
                {selectedMatchOfficial.advancingTeamName
                  ? ` · Avanza: ${selectedMatchOfficial.advancingTeamName}`
                  : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted-ink)]">
                Este partido todavia no tiene resultado oficial cargado.
              </p>
            )}
          </div>
          <div className="overflow-x-auto">
          <div className="sm:min-w-[640px]">
          <div className="hidden gap-2 border-b border-[var(--line)] bg-[var(--surface-soft)] px-6 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] sm:grid sm:grid-cols-[1.4fr_1.6fr_1fr_0.8fr] sm:px-8">
            <span>Jugador</span>
            <span>Marcador pronosticado</span>
            <span>Resultado</span>
            <span className="text-right">Puntos</span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {matchPicksByPeer.map(
              ({
                peer,
                homeTeam,
                awayTeam,
                predictedTeam,
                homeScore,
                awayScore,
                points,
                isCorrect,
              }) => (
              <div
                key={peer.userId}
                className="grid grid-cols-1 gap-2 px-6 py-4 sm:grid-cols-[1.4fr_1.6fr_1fr_0.8fr] sm:items-center sm:gap-2 sm:px-8"
              >
                <span className="font-semibold text-[var(--ink)]">
                  {peer.displayName}
                </span>
                <span className="text-sm text-[var(--ink)]">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] sm:hidden">
                    Marcador pronosticado:{" "}
                  </span>
                  <span className="tabular-nums flex items-center gap-1.5 break-words">
                    {homeTeam && awayTeam && homeScore != null && awayScore != null ? (
                      <>
                        <Flag code={homeTeam.code} /> {homeTeam.name} {homeScore} - {awayScore}{" "}
                        {awayTeam.name} <Flag code={awayTeam.code} />
                      </>
                    ) : (
                      "Sin marcador"
                    )}
                  </span>
                  {predictedTeam ? (
                    <span className="block text-xs text-[var(--muted-ink)]">
                      Pronostico avanza: {predictedTeam.name}
                    </span>
                  ) : null}
                </span>
                <span>
                  <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] sm:hidden">
                    Resultado:{" "}
                  </span>
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isCorrect === true
                        ? "bg-emerald-100 text-emerald-800"
                        : isCorrect === false
                          ? "bg-red-100 text-red-800"
                          : "bg-[var(--surface-soft)] text-[var(--muted-ink)]"
                    }`}
                  >
                    {isCorrect === true
                      ? "Acerto quien avanza"
                      : isCorrect === false
                        ? "Fallo quien avanza"
                        : "Sin resultado oficial"}
                  </span>
                </span>
                <span className="text-sm font-semibold text-[var(--ink)] sm:text-right">
                  <span className="mr-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-ink)] sm:hidden">
                    Puntos:{" "}
                  </span>
                  {points != null ? `${points} pts` : "—"}
                </span>
              </div>
              ),
            )}
          </div>
          </div>
          </div>
        </Surface>
      ) : (
        <>
          <Surface accent="primary" className="p-6">
            <div className="flex flex-wrap gap-2">
              {peers.map((peer) => {
                const peerTier = getLeague(peer.totalPoints).tier;
                const active = peer.userId === activePeerId;
                return (
                  <button
                    key={peer.userId}
                    className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? LEAGUE_CHIP_ACTIVE_CLASS[peerTier]
                        : "bg-[var(--surface-soft)] text-[var(--muted-ink)] hover:text-[var(--ink)]"
                    }`}
                    type="button"
                    onClick={() => setActivePeerId(peer.userId)}
                  >
                    <LeagueBadge tier={peerTier} size="sm" />
                    {peer.displayName}
                  </button>
                );
              })}
            </div>
          </Surface>

          {activePeer && activeLeague ? (
            <>
              <Surface
                className={`relative isolate overflow-hidden border-2 p-0 ${
                  LEAGUE_BANNER_CLASS[activeLeague.tier]
                } ${LEAGUE_FRAME_CLASS[activeLeague.tier]}`}
              >
                <div className="absolute inset-y-0 left-0 w-1.5 bg-current opacity-80" />
                <div className="pointer-events-none absolute -bottom-16 -right-8 select-none font-display text-[10rem] leading-none text-white/[0.035]">
                  {LEAGUE_ORNAMENT[activeLeague.tier]}
                </div>
                <div
                  className={`absolute right-0 top-0 rounded-bl-2xl px-5 py-2 text-[10px] font-bold uppercase tracking-[0.24em] ${
                    LEAGUE_RIBBON_CLASS[activeLeague.tier]
                  }`}
                >
                  {activeLeague.label}
                </div>
                <LeagueBadge
                  tier={activeLeague.tier}
                  className="pointer-events-none absolute -right-8 top-10 h-44 w-44 rotate-12 opacity-[0.09]"
                />

                <div className="relative grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
                  <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full border border-white/15 bg-black/20 shadow-inner">
                    <span className="absolute inset-2 rounded-full border border-dashed border-white/20" />
                    <LeagueBadge tier={activeLeague.tier} size="xl" />
                  </div>

                  <div className="min-w-0 pt-5 sm:pt-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-white/60">
                      Jugador seleccionado
                    </p>
                    <h2 className="font-display mt-2 break-words text-3xl uppercase leading-none text-white sm:text-4xl">
                      {activePeer.displayName}
                    </h2>
                    <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-white/70">
                      <span aria-hidden>{LEAGUE_ORNAMENT[activeLeague.tier]}</span>
                      <span>{activeLeague.label}</span>
                    </div>
                  </div>

                  <div className="w-fit rounded-2xl border border-white/15 bg-black/25 px-5 py-3 text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">Puntaje</p>
                    <p className="tabular-nums font-display mt-1 text-4xl text-white">
                      {activePeer.totalPoints}
                    </p>
                    <p className="text-xs font-semibold text-white/55">puntos</p>
                  </div>
                </div>
            <div className="relative border-t border-white/10 bg-black/15 px-6 py-4 sm:px-8">
              <div className="flex flex-wrap gap-2">
              {unlockedRounds.map((round) => {
                const submitted = activePeer.phaseStatus[round] ?? false;

                return (
                  <div
                    key={round}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      submitted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {ROUND_LABELS[round]}: {submitted ? "Enviado" : "No enviado"}
                  </div>
                );
              })}
              </div>
            </div>
          </Surface>

          <MapUsageHint readOnly />

          <div className="pattern-stadium rounded-[32px] p-2 sm:p-4">
            <BracketFlow
              matches={byRound}
              picks={pickMap}
              canEditTeams={() => false}
              canEditScores={() => false}
              onPickWinner={() => {}}
              onChangeScore={() => {}}
              resolveTeams={resolveTeams}
              officialResults={officialMap}
              readOnly
            />
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
