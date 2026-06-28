import type { PropsWithChildren } from "react";

export function Surface({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}
