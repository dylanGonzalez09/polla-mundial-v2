import { teamFlagEmoji } from "@/lib/domain/flags";

type FlagProps = {
  code: string | null | undefined;
  className?: string;
};

export function Flag({ code, className = "" }: FlagProps) {
  const emoji = teamFlagEmoji(code);

  if (emoji) {
    return (
      <span aria-hidden className={`leading-none ${className}`}>
        {emoji}
      </span>
    );
  }

  if (!code) {
    return (
      <span
        aria-hidden
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[8px]! font-bold leading-none text-[var(--muted-ink)] ${className}`}
      >
        —
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[8px]! font-bold leading-none text-[var(--ink)] ${className}`}
    >
      {code.slice(0, 3)}
    </span>
  );
}
