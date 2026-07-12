"use client";

import { useMemo, useState } from "react";

import { OfficialResultForm } from "@/components/admin/official-result-form";
import { Flag } from "@/components/ui/flag";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import type { BracketMatchView, OfficialResult, RoundKey } from "@/lib/domain/types";

export function AdminMatchBrowser({
  matches,
  results,
}: {
  matches: BracketMatchView[];
  results: Map<number, OfficialResult>;
}) {
  const [activeRound, setActiveRound] = useState<RoundKey>(ROUND_ORDER[0]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const byRound = useMemo(() => {
    const map = new Map<RoundKey, BracketMatchView[]>();
    for (const round of ROUND_ORDER) {
      map.set(
        round,
        matches
          .filter((match) => match.round === round)
          .sort((left, right) => left.slotOrder - right.slotOrder),
      );
    }
    return map;
  }, [matches]);

  const pendingCountByRound = useMemo(() => {
    const counts = {} as Record<RoundKey, number>;
    for (const round of ROUND_ORDER) {
      counts[round] = (byRound.get(round) ?? []).filter(
        (match) => !results.has(match.id),
      ).length;
    }
    return counts;
  }, [byRound, results]);

  const activeMatches = byRound.get(activeRound) ?? [];

  function toggle(matchId: number) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(matchId)) {
        next.delete(matchId);
      } else {
        next.add(matchId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 overflow-x-auto rounded-2xl bg-[var(--surface-soft)] p-1.5">
        {ROUND_ORDER.map((round) => {
          const pending = pendingCountByRound[round] ?? 0;
          const active = round === activeRound;
          return (
            <button
              key={round}
              type="button"
              onClick={() => setActiveRound(round)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--ink)] text-white"
                  : "text-[var(--muted-ink)] hover:text-[var(--ink)]"
              }`}
            >
              {ROUND_LABELS[round]}
              {pending > 0 ? (
                <span
                  className={`tabular-nums rounded-full px-2 py-0.5 text-xs font-bold ${
                    active ? "bg-white/20 text-white" : "bg-[var(--live)] text-white"
                  }`}
                >
                  {pending}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {activeMatches.map((match) => {
          const result = results.get(match.id) ?? null;
          const hasResult = result != null;
          const expanded = expandedIds.has(match.id) || !hasResult;

          if (!expanded && result) {
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => toggle(match.id)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 text-left transition hover:border-[var(--primary)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                    {match.code}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-[var(--ink)]">
                    <Flag code={match.homeTeam?.code} />
                    <span className="truncate">{match.homeTeam?.name ?? "Por definir"}</span>
                    <span className="tabular-nums shrink-0 text-[var(--muted-ink)]">
                      {result.homeScore}-{result.awayScore}
                    </span>
                    <span className="truncate">{match.awayTeam?.name ?? "Por definir"}</span>
                    <Flag code={match.awayTeam?.code} />
                  </span>
                </div>
                <span className="shrink-0 text-xs font-semibold text-[var(--muted-ink)]">
                  Editar
                </span>
              </button>
            );
          }

          return (
            <div key={match.id} className="space-y-2">
              {hasResult ? (
                <button
                  type="button"
                  onClick={() => toggle(match.id)}
                  className="text-xs font-semibold text-[var(--muted-ink)] underline decoration-dotted"
                >
                  Colapsar
                </button>
              ) : null}
              <OfficialResultForm match={match} result={result} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
