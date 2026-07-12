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
    ? "border-2 border-[var(--primary)] bg-[rgba(0,196,106,0.12)] text-[var(--ink)]"
    : "border border-[var(--line)] bg-[var(--surface-soft)] text-[var(--muted-ink)]";

  return (
    <button
      className={`flex min-h-12 w-full min-w-0 flex-1 basis-full items-center justify-between gap-1.5 rounded-2xl px-2.5 py-3 text-left text-sm font-semibold transition sm:w-auto sm:basis-0 sm:gap-3 sm:px-4 ${className} disabled:cursor-default disabled:opacity-70`}
      disabled={disabled || !team}
      type="button"
      onClick={onSelect}
    >
      <span className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2.5">
        <Flag code={team?.code} className="shrink-0 text-lg" />
        {team?.code ? (
          <span className="hidden shrink-0 rounded-md bg-[rgba(0,71,187,0.1)] px-1.5 py-0.5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--info)] sm:inline-block">
            {team.code}
          </span>
        ) : null}
        <span className="min-w-0 flex-1 truncate text-pretty">
          {team?.name ?? "Por definir"}
        </span>
      </span>
      {selected ? (
        <span className="shrink-0 rounded-full bg-[var(--primary)] px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-white sm:px-2.5 sm:text-[10px] sm:tracking-[0.22em]">
          Avanza
        </span>
      ) : null}
    </button>
  );
}
