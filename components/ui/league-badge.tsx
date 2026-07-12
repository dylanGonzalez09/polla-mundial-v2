import type { LeagueTier } from "@/lib/domain/leagues";

type LeagueBadgeProps = {
  tier: LeagueTier;
  size?: "sm" | "lg";
  className?: string;
};

const TIER_COLORS: Record<LeagueTier, { from: string; to: string; ring: string }> = {
  bronze: { from: "#c98a52", to: "#8a5a2e", ring: "#e8b183" },
  silver: { from: "#d7dde3", to: "#8f98a3", ring: "#eef1f4" },
  gold: { from: "#ffd66b", to: "#c98e00", ring: "#fff0bd" },
  diamond: { from: "#7fd8ff", to: "#0047bb", ring: "#bfeeff" },
  legend: { from: "#ffd66b", to: "#e0102f", ring: "#ffe9a8" },
};

const SIZE_PX = { sm: 28, lg: 56 };

export function LeagueBadge({ tier, size = "sm", className = "" }: LeagueBadgeProps) {
  const colors = TIER_COLORS[tier];
  const px = SIZE_PX[size];
  const gradientId = `league-gradient-${tier}-${size}`;
  const ornamented = tier === "gold" || tier === "diamond" || tier === "legend";
  const legendary = tier === "legend";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
      </defs>

      {legendary ? (
        <path
          d="M24 2 L30 8 L38 6 L36 14 L44 18 L37 23 L44 28 L36 32 L38 40 L30 38 L24 44 L18 38 L10 40 L12 32 L4 28 L11 23 L4 18 L12 14 L10 6 L18 8 Z"
          fill={colors.ring}
          opacity="0.55"
        />
      ) : null}

      <path
        d="M24 4 L40 10 V22 C40 32 33 40 24 44 C15 40 8 32 8 22 V10 Z"
        fill={`url(#${gradientId})`}
        stroke={colors.ring}
        strokeWidth={ornamented ? 2 : 1.2}
      />

      {ornamented ? (
        <path
          d="M24 8 L36 13 V22 C36 30 30.5 36.5 24 40 C17.5 36.5 12 30 12 22 V13 Z"
          fill="none"
          stroke={colors.ring}
          strokeWidth="1"
          opacity="0.7"
        />
      ) : null}

      {tier === "diamond" || tier === "legend" ? (
        <path d="M24 16 L28 22 L24 32 L20 22 Z" fill="white" opacity="0.85" />
      ) : (
        <circle cx="24" cy="24" r="6" fill="white" opacity="0.5" />
      )}
    </svg>
  );
}
