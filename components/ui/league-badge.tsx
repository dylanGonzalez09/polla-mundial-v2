import type { LeagueTier } from "@/lib/domain/leagues";

type LeagueBadgeProps = {
  tier: LeagueTier;
  size?: "sm" | "lg" | "xl";
  className?: string;
};

const TIER_COLORS: Record<
  LeagueTier,
  { from: string; to: string; ring: string; gem: string }
> = {
  bronze: { from: "#d59a5f", to: "#8a5628", ring: "#f0c497", gem: "#5c3416" },
  silver: { from: "#eef2f6", to: "#95a3b3", ring: "#ffffff", gem: "#5b6b7d" },
  gold: { from: "#ffe08a", to: "#c98e00", ring: "#fff4cf", gem: "#8a5a00" },
  diamond: { from: "#a6e8ff", to: "#0047bb", ring: "#e3faff", gem: "#00284d" },
  obsidian: { from: "#4a3f6b", to: "#0a0812", ring: "#c9a6ff", gem: "#1a0f2e" },
};

const SIZE_PX = { sm: 32, lg: 64, xl: 96 };

export function LeagueBadge({ tier, size = "sm", className = "" }: LeagueBadgeProps) {
  const colors = TIER_COLORS[tier];
  const px = SIZE_PX[size];
  const uid = `${tier}-${size}`;
  const shieldGradientId = `league-shield-${uid}`;
  const glowGradientId = `league-glow-${uid}`;

  const hasRing = tier !== "bronze";
  const hasGems = tier === "diamond" || tier === "obsidian";
  const hasLaurels = tier === "gold" || tier === "diamond" || tier === "obsidian";
  const hasCrown = tier === "obsidian";
  const hasBurst = tier === "obsidian" || tier === "diamond";

  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={shieldGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.from} />
          <stop offset="100%" stopColor={colors.to} />
        </linearGradient>
        <radialGradient id={glowGradientId}>
          <stop offset="0%" stopColor={colors.ring} stopOpacity="0.55" />
          <stop offset="100%" stopColor={colors.ring} stopOpacity="0" />
        </radialGradient>
      </defs>

      {hasBurst ? (
        <path
          d="M32 0 L38 10 L49 4 L47 16 L60 16 L52 26 L62 34 L50 37 L54 49 L42 44 L38 56 L32 46 L26 56 L22 44 L10 49 L14 37 L2 34 L12 26 L4 16 L17 16 L15 4 L26 10 Z"
          fill={`url(#${glowGradientId})`}
        />
      ) : null}

      {hasLaurels ? (
        <>
          <path
            d="M14 26c-4 6-4 14 1 20"
            fill="none"
            stroke={colors.to}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d="M50 26c4 6 4 14-1 20"
            fill="none"
            stroke={colors.to}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        </>
      ) : null}

      {hasCrown ? (
        <path
          d="M20 14 L24 22 L32 10 L40 22 L44 14 L46 24 H18 Z"
          fill={colors.ring}
          stroke={colors.gem}
          strokeWidth="1"
        />
      ) : null}

      <path
        d={hasCrown ? "M18 25 H46 V38c0 10-6.5 17.5-14 21-7.5-3.5-14-11-14-21 Z" : "M9 12 L32 4 L55 12 V27c0 13-9 24-23 30-14-6-23-17-23-30 Z"}
        fill={`url(#${shieldGradientId})`}
        stroke={colors.ring}
        strokeWidth={hasRing ? 2.5 : 1.5}
      />

      {hasRing && !hasCrown ? (
        <path
          d="M13 15 L32 8 L51 15 V27c0 11-7.5 20.5-19 25.5C20.5 47.5 13 38 13 27Z"
          fill="none"
          stroke={colors.ring}
          strokeWidth="1"
          opacity="0.75"
        />
      ) : null}

      {hasGems ? (
        <>
          <path d="M32 18 L37 25 L32 34 L27 25 Z" fill={colors.ring} />
          <circle cx="22" cy="30" r="2.4" fill={colors.ring} />
          <circle cx="42" cy="30" r="2.4" fill={colors.ring} />
        </>
      ) : (
        <circle
          cx="32"
          cy={hasCrown ? 33 : 27}
          r="6.5"
          fill={colors.ring}
          opacity="0.9"
        />
      )}

      {tier === "bronze" ? (
        <>
          <circle cx="16" cy="16" r="1.6" fill={colors.ring} opacity="0.8" />
          <circle cx="48" cy="16" r="1.6" fill={colors.ring} opacity="0.8" />
          <circle cx="16" cy="38" r="1.6" fill={colors.ring} opacity="0.8" />
          <circle cx="48" cy="38" r="1.6" fill={colors.ring} opacity="0.8" />
        </>
      ) : null}
    </svg>
  );
}
