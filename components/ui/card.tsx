import type { HTMLAttributes, PropsWithChildren } from "react";

type SurfaceAccent = "primary" | "info" | "gold" | "live";

// Tailwind necesita ver el nombre de clase completo como string literal para
// generarlo — no se puede interpolar el color dentro de shadow-[...] en runtime.
const ACCENT_SHADOW_CLASS: Record<SurfaceAccent, string> = {
  primary: "shadow-[0_14px_36px_rgba(4,10,24,0.35),inset_0_3px_0_0_var(--primary)]",
  info: "shadow-[0_14px_36px_rgba(4,10,24,0.35),inset_0_3px_0_0_var(--info)]",
  gold: "shadow-[0_14px_36px_rgba(4,10,24,0.35),inset_0_3px_0_0_var(--gold)]",
  live: "shadow-[0_14px_36px_rgba(4,10,24,0.35),inset_0_3px_0_0_var(--live)]",
};

const BASE_SHADOW_CLASS = "shadow-[0_14px_36px_rgba(4,10,24,0.35)]";

export function Surface({
  children,
  className = "",
  accent,
  style,
  ...rest
}: PropsWithChildren<
  { className?: string; accent?: SurfaceAccent } & HTMLAttributes<HTMLDivElement>
>) {
  const shadowClass = accent ? ACCENT_SHADOW_CLASS[accent] : BASE_SHADOW_CLASS;

  return (
    <div
      className={`rounded-[20px] border border-white/10 bg-[#101f31] text-[#f2f5fa] ${shadowClass} ${className}`}
      style={{ backgroundColor: "#101f31", color: "#f2f5fa", ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
