import type { HTMLAttributes, PropsWithChildren } from "react";

export function Surface({
  children,
  className = "",
  ...rest
}: PropsWithChildren<{ className?: string } & HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={`rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_16px_40px_rgba(15,23,42,0.06)] ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
