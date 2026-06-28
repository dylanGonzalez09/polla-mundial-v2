"use client";

import type { Team } from "@/lib/domain/types";

type TeamSlotProps = {
  team: Team | null;
  selected: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export function TeamSlot({ team, selected, disabled, onSelect }: TeamSlotProps) {
  const className = selected
    ? "border-[var(--accent)] bg-[rgba(24,99,62,0.1)] text-[var(--ink)]"
    : "border-[var(--line)] bg-white text-[var(--muted-ink)]";

  return (
    <button
      className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${className} disabled:cursor-default disabled:opacity-70`}
      disabled={disabled || !team}
      type="button"
      onClick={onSelect}
    >
      <span>{team?.name ?? "Por definir"}</span>
      {selected ? <span className="text-xs uppercase tracking-[0.22em]">Avanza</span> : null}
    </button>
  );
}
