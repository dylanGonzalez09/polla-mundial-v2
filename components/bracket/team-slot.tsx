"use client";

import { Flag } from "@/components/ui/flag";
import type { Team } from "@/lib/domain/types";

type TeamSlotProps = {
  team: Team | null;
  selected: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export function TeamSlot({ team, selected, disabled, onSelect }: TeamSlotProps) {
  const className = selected
    ? "border-2 border-[var(--primary)] bg-[rgba(0,168,89,0.08)] text-[var(--ink)]"
    : "border border-[var(--line)] bg-white text-[var(--muted-ink)]";

  return (
    <button
      className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${className} disabled:cursor-default disabled:opacity-70`}
      disabled={disabled || !team}
      type="button"
      onClick={onSelect}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <Flag code={team?.code} className="text-lg" />
        {team?.code ? (
          <span className="shrink-0 rounded-md bg-[rgba(0,71,187,0.1)] px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--info)]">
            {team.code}
          </span>
        ) : null}
        <span className="min-w-0 truncate text-pretty">{team?.name ?? "Por definir"}</span>
      </span>
      {selected ? (
        <span className="shrink-0 rounded-full bg-[var(--primary)] px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
          Avanza
        </span>
      ) : null}
    </button>
  );
}
