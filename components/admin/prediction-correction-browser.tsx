"use client";

import { useMemo, useState } from "react";

import {
  PredictionCorrectionForm,
  type PredictionCorrectionMatch,
} from "@/components/admin/prediction-correction-form";
import { Surface } from "@/components/ui/card";
import { LeagueBadge } from "@/components/ui/league-badge";
import { getLeague } from "@/lib/domain/leagues";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import type { RoundKey } from "@/lib/domain/types";

export type CorrectionPlayer = {
  userId: string;
  displayName: string;
  isConfirmed: boolean;
  totalPoints: number;
  matches: PredictionCorrectionMatch[];
};

export function PredictionCorrectionBrowser({ players }: { players: CorrectionPlayer[] }) {
  const [search, setSearch] = useState("");
  const [activePlayerId, setActivePlayerId] = useState(players[0]?.userId ?? "");
  const [activeRound, setActiveRound] = useState<RoundKey>(ROUND_ORDER[0]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return players;
    }
    return players.filter((player) => player.displayName.toLowerCase().includes(query));
  }, [players, search]);

  const activePlayer =
    players.find((player) => player.userId === activePlayerId) ?? players[0] ?? null;

  const matchesByRound = useMemo(() => {
    const map = new Map<RoundKey, PredictionCorrectionMatch[]>();
    for (const round of ROUND_ORDER) {
      map.set(
        round,
        (activePlayer?.matches ?? []).filter((match) => match.round === round),
      );
    }
    return map;
  }, [activePlayer]);

  const activeMatches = matchesByRound.get(activeRound) ?? [];

  if (players.length === 0) {
    return (
      <Surface className="p-6">
        <p className="text-sm text-[var(--muted-ink)]">
          No hay predicciones de jugadores para corregir.
        </p>
      </Surface>
    );
  }

  return (
    <div className="space-y-5">
      <Surface accent="live" className="p-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar jugador..."
          className="h-10 w-full rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--ink)] outline-none focus:border-[var(--live)]"
        />
        <div className="mt-3 flex max-h-48 flex-wrap gap-2 overflow-y-auto">
          {filteredPlayers.map((player) => {
            const tier = getLeague(player.totalPoints).tier;
            const active = player.userId === activePlayer?.userId;
            return (
              <button
                key={player.userId}
                type="button"
                onClick={() => setActivePlayerId(player.userId)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--live)] text-white"
                    : "bg-[var(--surface-soft)] text-[var(--muted-ink)] hover:text-[var(--ink)]"
                }`}
              >
                <LeagueBadge tier={tier} size="sm" />
                {player.displayName}
              </button>
            );
          })}
        </div>
      </Surface>

      {activePlayer ? (
        <>
          <Surface className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-[var(--ink)]">
                  {activePlayer.displayName}
                </h2>
                <p className="text-xs text-[var(--muted-ink)]">
                  {activePlayer.isConfirmed ? "Cuadro confirmado" : "Sin confirmar"}
                </p>
              </div>
              <span className="tabular-nums rounded-full bg-[var(--surface-soft)] px-3 py-1 text-sm font-semibold text-[var(--ink)]">
                {activePlayer.totalPoints} pts
              </span>
            </div>
          </Surface>

          <div className="flex flex-wrap gap-1.5 overflow-x-auto rounded-2xl bg-[var(--surface-soft)] p-1.5 shadow-[0_10px_28px_rgba(4,10,24,0.3)]">
            {ROUND_ORDER.map((round) => {
              const count = matchesByRound.get(round)?.length ?? 0;
              const active = round === activeRound;
              if (count === 0) {
                return null;
              }
              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => setActiveRound(round)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--chip-active)] text-white"
                      : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
                  }`}
                >
                  {ROUND_LABELS[round]}
                  <span
                    className={`tabular-nums rounded-full px-2 py-0.5 text-xs font-bold ${
                      active ? "bg-white/25 text-white" : "bg-white/10 text-[var(--muted-ink)]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {activeMatches.length === 0 ? (
            <Surface className="p-6">
              <p className="text-sm text-[var(--muted-ink)]">
                Este jugador no tiene picks en esta ronda.
              </p>
            </Surface>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {activeMatches.map((match) => (
                <PredictionCorrectionForm
                  key={`${activePlayer.userId}-${match.matchId}`}
                  playerName={activePlayer.displayName}
                  match={match}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
