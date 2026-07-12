import { Surface } from "@/components/ui/card";
import { LeagueBadge } from "@/components/ui/league-badge";
import { getLeague } from "@/lib/domain/leagues";
import type { RankingRow } from "@/lib/domain/types";

const PODIUM_EMOJIS = ["🏆😎", "🥈🔥", "🥉💪"];
const FUNNY_EMOJIS = ["😅", "🫠", "🤡", "🐢"];
const LAST_PLACE_EMOJI = "💀";

const PODIUM_STEP_STYLES = [
  "sm:order-2 sm:pb-10",
  "sm:order-1 sm:pb-4",
  "sm:order-3 sm:pb-0",
];

const PODIUM_MEDAL_CARD_CLASS = [
  "border-2 border-[var(--gold)] bg-[linear-gradient(160deg,rgba(245,179,1,0.16),rgba(245,179,1,0.02))] shadow-[0_10px_30px_rgba(245,179,1,0.18)]",
  "border-2 border-[var(--silver)] bg-[linear-gradient(160deg,rgba(154,165,177,0.18),rgba(154,165,177,0.02))] shadow-[0_10px_30px_rgba(154,165,177,0.16)]",
  "border-2 border-[var(--bronze)] bg-[linear-gradient(160deg,rgba(181,101,29,0.16),rgba(181,101,29,0.02))] shadow-[0_10px_30px_rgba(181,101,29,0.16)]",
];

type PointGroup = {
  points: number;
  players: string[];
  emoji: string;
};

function groupByPoints(rows: RankingRow[]): PointGroup[] {
  const groups: { points: number; players: string[] }[] = [];

  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (last && last.points === row.totalPoints) {
      last.players.push(row.displayName);
    } else {
      groups.push({ points: row.totalPoints, players: [row.displayName] });
    }
  }

  const topCount = Math.min(3, groups.length);
  const rest = groups.slice(topCount);

  return groups.map((group, index) => {
    if (index < topCount) {
      return { ...group, emoji: PODIUM_EMOJIS[index] };
    }

    const restIndex = index - topCount;
    const isLast = restIndex === rest.length - 1;
    if (isLast) {
      return { ...group, emoji: LAST_PLACE_EMOJI };
    }

    const bucketSize = Math.max(1, Math.ceil((rest.length - 1) / FUNNY_EMOJIS.length));
    const bucket = Math.min(Math.floor(restIndex / bucketSize), FUNNY_EMOJIS.length - 1);
    return { ...group, emoji: FUNNY_EMOJIS[bucket] };
  });
}

function PodiumStep({
  group,
  place,
  isMe,
}: {
  group: PointGroup;
  place: 1 | 2 | 3;
  isMe: (name: string) => boolean;
}) {
  return (
    <div className={`flex flex-1 flex-col items-center ${PODIUM_STEP_STYLES[place - 1]}`}>
      <span className="font-display text-3xl leading-none">{group.emoji}</span>
      <div
        className={`mt-3 flex w-full flex-col items-center gap-1 rounded-2xl px-3 py-4 text-center ${PODIUM_MEDAL_CARD_CLASS[place - 1]}`}
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-ink)]">
          Puesto {place}
        </span>
        <div className="flex flex-col items-center gap-0.5">
          {group.players.map((name) => (
            <span
              key={name}
              className={`truncate text-sm font-semibold ${
                isMe(name) ? "text-[var(--info)]" : "text-[var(--ink)]"
              }`}
            >
              {name}
            </span>
          ))}
        </div>
        <span className="tabular-nums font-display text-2xl text-[var(--gold-strong)]">
          {group.points}
        </span>
      </div>
    </div>
  );
}

export function RankingBoard({
  rows,
  currentUserDisplayName,
}: {
  rows: RankingRow[];
  currentUserDisplayName: string;
}) {
  const groups = groupByPoints(rows);
  const podiumGroups = groups.slice(0, 3);
  const restGroups = groups.slice(3);
  const isMe = (name: string) => name === currentUserDisplayName;

  const tableRows = restGroups
    .flatMap((group, groupIndex) =>
      group.players.map((name) => ({
        name,
        points: group.points,
        emoji: group.emoji,
        position: groupIndex + 4,
      })),
    );

  return (
    <div className="space-y-6">
      {podiumGroups.length > 0 ? (
        <Surface accent="gold" className="p-6 sm:p-8">
          <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end">
            {podiumGroups.map((group, index) => (
              <PodiumStep
                key={group.points}
                group={group}
                place={(index + 1) as 1 | 2 | 3}
                isMe={isMe}
              />
            ))}
          </div>
        </Surface>
      ) : null}

      {tableRows.length > 0 ? (
      <Surface accent="primary" className="overflow-hidden">
        <div className="divide-y divide-[var(--line)]">
          {tableRows.map((row) => {
            const league = getLeague(row.points);
            return (
              <div
                key={`${row.position}-${row.name}`}
                className={`flex items-center justify-between gap-4 px-6 py-4 sm:px-8 ${
                  isMe(row.name) ? "bg-[rgba(61,139,255,0.14)]" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="tabular-nums flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-soft)] text-sm font-semibold text-[var(--ink)]">
                    {row.position}
                  </div>
                  <LeagueBadge tier={league.tier} size="sm" />
                  <div>
                    <div
                      className={`font-semibold ${
                        isMe(row.name) ? "text-[var(--info)]" : "text-[var(--ink)]"
                      }`}
                    >
                      {row.name}
                    </div>
                    <div className="text-xs text-[var(--muted-ink)]">{league.label}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="text-xl leading-none">
                    {row.emoji}
                  </span>
                  <div className="text-right">
                    <div className="tabular-nums text-2xl font-semibold text-[var(--ink)]">
                      {row.points}
                    </div>
                    <div className="text-xs uppercase tracking-[0.22em] text-[var(--muted-ink)]">
                      puntos
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Surface>
      ) : null}
    </div>
  );
}
