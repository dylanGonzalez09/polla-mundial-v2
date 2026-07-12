"use client";

import { useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { MatchCard, type OfficialCell } from "@/components/bracket/match-card";
import { Flag } from "@/components/ui/flag";
import { ROUND_LABELS, ROUND_ORDER } from "@/lib/domain/rounds";
import { scoreMatch } from "@/lib/domain/scoring";
import type {
  BracketMatchView,
  PredictionPick,
  RoundKey,
  Team,
} from "@/lib/domain/types";

const NODE_W = 232;
const NODE_H = 120;
const GAP_X = 72;
const GAP_Y = 18;
const COL_W = NODE_W + GAP_X;
const ROW_H = NODE_H + GAP_Y;

type MatchNodeData = {
  match: BracketMatchView;
  homeTeam: Team | null;
  awayTeam: Team | null;
  pick: PredictionPick | undefined;
  official: OfficialCell | null;
  editable: boolean;
  selected: boolean;
};

type MatchFlowNode = Node<MatchNodeData, "match">;
type LabelFlowNode = Node<{ label: string }, "roundLabel">;

function matchPoints(data: MatchNodeData) {
  const { match, pick, official, homeTeam, awayTeam } = data;
  const hasOfficial =
    official != null && official.homeScore !== null && official.awayScore !== null;

  if (!hasOfficial) {
    return null;
  }

  const hasPick =
    pick != null &&
    (pick.predictedAdvancingTeamId != null ||
      (pick.homeScore != null && pick.awayScore != null));

  if (!hasPick) {
    return null;
  }

  const advancingCorrect =
    official.advancingTeamId != null &&
    pick?.predictedAdvancingTeamId === official.advancingTeamId;

  const matchupCorrect =
    official.realHomeTeamId != null &&
    official.realAwayTeamId != null &&
    homeTeam?.id === official.realHomeTeamId &&
    awayTeam?.id === official.realAwayTeamId;

  return scoreMatch(
    { homeScore: pick?.homeScore ?? null, awayScore: pick?.awayScore ?? null },
    official,
    advancingCorrect,
    matchupCorrect,
    match.round === "r32",
  );
}

function TeamRow({
  team,
  picked,
  score,
  mismatchName,
}: {
  team: Team | null;
  picked: boolean;
  score: number | null;
  mismatchName: string | null;
}) {
  return (
    <div
      className={`flex h-7 items-center gap-1.5 rounded-lg px-1.5 ${
        picked
          ? "bg-[rgba(0,168,89,0.14)] ring-1 ring-[var(--primary)]"
          : "bg-transparent"
      } ${mismatchName ? "ring-1 ring-inset ring-[var(--live)]" : ""}`}
      title={
        mismatchName
          ? `Tu pick: ${team?.name ?? "por definir"} · Avanzó: ${mismatchName}`
          : team?.name
      }
    >
      <Flag code={team?.code} className="text-sm" />
      <span
        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
          team ? "text-[var(--ink)]" : "text-[var(--muted-ink)]"
        }`}
      >
        {team?.name ?? "Por definir"}
      </span>
      {picked ? (
        <span aria-hidden className="text-[10px] font-bold text-[var(--primary)]">
          ▸
        </span>
      ) : null}
      <span className="tabular-nums w-5 shrink-0 rounded-md bg-[var(--surface-soft)] text-center text-xs font-bold text-[var(--ink)]">
        {score ?? "·"}
      </span>
    </div>
  );
}

function MatchNode({ data }: NodeProps<MatchFlowNode>) {
  const { match, homeTeam, awayTeam, pick, official, editable, selected } = data;
  const points = matchPoints(data);

  const homeMismatch =
    official?.realHomeTeamId != null &&
    official.realHomeTeamId !== homeTeam?.id &&
    official.realHomeTeamName != null
      ? official.realHomeTeamName
      : null;
  const awayMismatch =
    official?.realAwayTeamId != null &&
    official.realAwayTeamId !== awayTeam?.id &&
    official.realAwayTeamName != null
      ? official.realAwayTeamName
      : null;

  const hasOfficialScore =
    official != null && official.homeScore !== null && official.awayScore !== null;

  let footer: { text: string; tone: string };
  if (homeMismatch || awayMismatch) {
    footer = {
      text: `Avanzó: ${[homeMismatch, awayMismatch].filter(Boolean).join(" · ")}`,
      tone: "text-[var(--live)]",
    };
  } else if (hasOfficialScore) {
    footer = {
      text: `Oficial ${official.homeScore}-${official.awayScore}${
        official.advancingTeamName ? ` · ${official.advancingTeamName}` : ""
      }`,
      tone: "text-[var(--primary)]",
    };
  } else {
    footer = {
      text: new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Bogota",
      }).format(new Date(match.matchDate)),
      tone: "text-[var(--muted-ink)]",
    };
  }

  return (
    <div
      className={`flex cursor-pointer flex-col gap-1 rounded-2xl border bg-[#101f31] px-2.5 py-2 text-[#f2f5fa] shadow-[0_10px_30px_rgba(6,25,15,0.35)] transition ${
        selected
          ? "border-[var(--gold)] ring-2 ring-[var(--gold)]"
          : "border-white/20 hover:border-[var(--primary)]"
      }`}
      style={{ width: NODE_W, height: NODE_H }}
    >
      <Handle type="target" position={Position.Left} id="tl" isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="target" position={Position.Right} id="tr" isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Left} id="sl" isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <Handle type="source" position={Position.Right} id="sr" isConnectable={false} className="!h-1 !w-1 !border-0 !bg-transparent" />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          {match.round === "final" ? "🏆 " : match.round === "third" ? "🥉 " : ""}
          {match.code}
        </span>
        {points != null ? (
          <span
            className={`tabular-nums rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              points >= 2
                ? "bg-emerald-100 text-emerald-800"
                : points === 1
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {points > 0 ? `+${points}` : "0"} pts
          </span>
        ) : !editable ? (
          <span aria-hidden className="text-[10px] text-[var(--muted-ink)]">
            🔒
          </span>
        ) : (
          <span className="rounded-full bg-[rgba(0,168,89,0.12)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
            ✏️
          </span>
        )}
      </div>

      <TeamRow
        team={homeTeam}
        picked={pick?.predictedAdvancingTeamId != null && pick.predictedAdvancingTeamId === homeTeam?.id}
        score={pick?.homeScore ?? null}
        mismatchName={homeMismatch}
      />
      <TeamRow
        team={awayTeam}
        picked={pick?.predictedAdvancingTeamId != null && pick.predictedAdvancingTeamId === awayTeam?.id}
        score={pick?.awayScore ?? null}
        mismatchName={awayMismatch}
      />

      <div className={`truncate text-[10px] font-semibold ${footer.tone}`} suppressHydrationWarning>
        {footer.text}
      </div>
    </div>
  );
}

function RoundLabelNode({ data }: NodeProps<LabelFlowNode>) {
  return (
    <div
      className="pointer-events-none text-center text-sm font-bold uppercase tracking-[0.28em] text-white/85"
      style={{ width: NODE_W }}
    >
      {data.label}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  match: MatchNode,
  roundLabel: RoundLabelNode,
};

type Positioned = { x: number; y: number; side: "left" | "right" | "center" };

// Layout espejo estilo FIFA: la mitad que alimenta el slot local de la final
// crece de izquierda a derecha, la otra mitad en espejo, y la final + tercer
// puesto quedan al centro. Todo se deriva del encadenamiento home/away
// SourceMatchId, sin depender de slotOrder.
function buildMirrorLayout(matches: BracketMatchView[]) {
  const byId = new Map(matches.map((match) => [match.id, match]));
  const positions = new Map<number, Positioned>();
  const finalMatch = matches.find((match) => match.round === "final");
  const thirdMatch = matches.find((match) => match.round === "third");

  if (!finalMatch) {
    return positions;
  }

  const depthOf = (id: number | null): number => {
    if (id == null) {
      return -1;
    }
    const match = byId.get(id);
    if (!match) {
      return -1;
    }
    return (
      1 + Math.max(depthOf(match.homeSourceMatchId), depthOf(match.awaySourceMatchId))
    );
  };

  const halfDepth = Math.max(
    depthOf(finalMatch.homeSourceMatchId),
    depthOf(finalMatch.awaySourceMatchId),
  );
  const centerCol = halfDepth + 1;

  let leafIndex = 0;
  const place = (id: number | null, depth: number, side: "left" | "right"): number => {
    if (id == null) {
      return 0;
    }
    const match = byId.get(id);
    if (!match || match.round === "third") {
      return 0;
    }

    const col = side === "left" ? halfDepth - depth : centerCol + 1 + depth;
    const hasFeeders =
      match.homeSourceMatchId != null || match.awaySourceMatchId != null;

    let y: number;
    if (!hasFeeders) {
      y = leafIndex * ROW_H;
      leafIndex += 1;
    } else {
      const homeY = place(match.homeSourceMatchId, depth + 1, side);
      const awayY = place(match.awaySourceMatchId, depth + 1, side);
      y = (homeY + awayY) / 2;
    }

    positions.set(id, { x: col * COL_W, y, side });
    return y;
  };

  const leftY = place(finalMatch.homeSourceMatchId, 0, "left");
  leafIndex = 0;
  const rightY = place(finalMatch.awaySourceMatchId, 0, "right");

  const centerY = (leftY + rightY) / 2;
  positions.set(finalMatch.id, {
    x: centerCol * COL_W,
    y: centerY - ROW_H * 0.65,
    side: "center",
  });
  if (thirdMatch) {
    positions.set(thirdMatch.id, {
      x: centerCol * COL_W,
      y: centerY + ROW_H * 0.65,
      side: "center",
    });
  }

  // Cualquier partido fuera del arbol (no deberia pasar) se apila abajo para
  // que al menos sea visible.
  let orphanRow = 0;
  for (const match of matches) {
    if (!positions.has(match.id)) {
      positions.set(match.id, {
        x: centerCol * COL_W,
        y: (leafIndex + 2 + orphanRow) * ROW_H,
        side: "center",
      });
      orphanRow += 1;
    }
  }

  return positions;
}

type BracketFlowProps = {
  matches: Record<RoundKey, BracketMatchView[]>;
  picks: Map<number, PredictionPick>;
  canEditTeams: (match: BracketMatchView) => boolean;
  canEditScores: (match: BracketMatchView) => boolean;
  onPickWinner: (matchId: number, teamId: number) => void;
  onChangeScore: (
    matchId: number,
    side: "home" | "away",
    value: number | null,
  ) => void;
  resolveTeams: (match: BracketMatchView) => {
    homeTeam: Team | null;
    awayTeam: Team | null;
  };
  officialResults?: Map<number, OfficialCell>;
  readOnly?: boolean;
};

export function BracketFlow({
  matches,
  picks,
  canEditTeams,
  canEditScores,
  onPickWinner,
  onChangeScore,
  resolveTeams,
  officialResults,
  readOnly = false,
}: BracketFlowProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);

  const allMatches = useMemo(
    () => ROUND_ORDER.flatMap((round) => matches[round] ?? []),
    [matches],
  );

  const positions = useMemo(() => buildMirrorLayout(allMatches), [allMatches]);

  const nodes = useMemo<(MatchFlowNode | LabelFlowNode)[]>(() => {
    const matchNodes = allMatches.map<MatchFlowNode>((match) => {
      const { homeTeam, awayTeam } = resolveTeams(match);
      const position = positions.get(match.id) ?? { x: 0, y: 0, side: "center" as const };
      return {
        id: String(match.id),
        type: "match",
        position: { x: position.x, y: position.y },
        draggable: false,
        data: {
          match,
          homeTeam,
          awayTeam,
          pick: picks.get(match.id),
          official: officialResults?.get(match.id) ?? null,
          editable: !readOnly && (canEditTeams(match) || canEditScores(match)),
          selected: match.id === selectedMatchId,
        },
      };
    });

    const halfRounds = ROUND_ORDER.filter(
      (round) => round !== "final" && round !== "third",
    );
    const halfDepth = halfRounds.length - 1;
    const centerCol = halfDepth + 1;
    const labelNodes: LabelFlowNode[] = [];
    halfRounds.forEach((round, index) => {
      const label = ROUND_LABELS[round];
      labelNodes.push({
        id: `label-left-${round}`,
        type: "roundLabel",
        position: { x: index * COL_W, y: -72 },
        draggable: false,
        selectable: false,
        data: { label },
      });
      labelNodes.push({
        id: `label-right-${round}`,
        type: "roundLabel",
        position: { x: (2 * centerCol - index) * COL_W, y: -72 },
        draggable: false,
        selectable: false,
        data: { label },
      });
    });
    labelNodes.push({
      id: "label-final",
      type: "roundLabel",
      position: { x: centerCol * COL_W, y: -72 },
      draggable: false,
      selectable: false,
      data: { label: ROUND_LABELS.final },
    });

    return [...labelNodes, ...matchNodes];
  }, [
    allMatches,
    positions,
    picks,
    officialResults,
    canEditTeams,
    canEditScores,
    readOnly,
    resolveTeams,
    selectedMatchId,
  ]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];
    for (const match of allMatches) {
      const targetPos = positions.get(match.id);
      const sides: Array<{
        sourceId: number | null;
        sourceType: BracketMatchView["homeSourceType"];
        slot: "h" | "a";
      }> = [
        { sourceId: match.homeSourceMatchId, sourceType: match.homeSourceType, slot: "h" },
        { sourceId: match.awaySourceMatchId, sourceType: match.awaySourceType, slot: "a" },
      ];

      for (const { sourceId, sourceType, slot } of sides) {
        if (sourceId == null || !targetPos) {
          continue;
        }
        const sourcePos = positions.get(sourceId);
        if (!sourcePos) {
          continue;
        }

        const leftToRight = sourcePos.x <= targetPos.x;
        const isLoserEdge = sourceType === "loser";
        const feederPicked =
          !isLoserEdge && picks.get(sourceId)?.predictedAdvancingTeamId != null;

        result.push({
          id: `e-${sourceId}-${match.id}-${slot}`,
          source: String(sourceId),
          target: String(match.id),
          sourceHandle: leftToRight ? "sr" : "sl",
          targetHandle: leftToRight ? "tl" : "tr",
          type: "smoothstep",
          style: isLoserEdge
            ? {
                stroke: "rgba(255,255,255,0.3)",
                strokeWidth: 1.2,
                strokeDasharray: "5 5",
              }
            : {
                stroke: feederPicked ? "#f5b301" : "rgba(255,255,255,0.32)",
                strokeWidth: feederPicked ? 2.2 : 1.4,
              },
        });
      }
    }
    return result;
  }, [allMatches, positions, picks]);

  const selectedMatch = useMemo(
    () => allMatches.find((match) => match.id === selectedMatchId) ?? null,
    [allMatches, selectedMatchId],
  );
  const selectedTeams = selectedMatch ? resolveTeams(selectedMatch) : null;

  return (
    <div className="relative h-[70vh] min-h-[480px] overflow-hidden rounded-[24px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.08 }}
        minZoom={0.12}
        maxZoom={1.75}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnScroll={false}
        preventScrolling={false}
        zoomOnDoubleClick
        onNodeClick={(_, node) => {
          if (node.type === "match") {
            setSelectedMatchId(Number(node.id));
          }
        }}
        onPaneClick={() => setSelectedMatchId(null)}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="rgba(255,255,255,0.14)"
        />
        <Controls
          showInteractive={false}
          className="!rounded-xl !border !border-white/10 !bg-[#14263a] !text-white !shadow-lg"
        />
        <MiniMap
          pannable
          zoomable
          className="!hidden sm:!block !h-28 !w-44 !rounded-xl !border !border-white/10 !bg-[#14263a]"
          maskColor="rgba(10,30,20,0.55)"
          nodeColor={() => "rgba(255,255,255,0.75)"}
          nodeStrokeWidth={0}
        />
      </ReactFlow>

      {selectedMatch ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Detalle del partido ${selectedMatch.code}`}
          className="fixed inset-0 z-50 flex items-end bg-black/70 p-2 backdrop-blur-sm sm:absolute sm:items-stretch sm:justify-end sm:bg-black/30 sm:p-3"
          onClick={() => setSelectedMatchId(null)}
        >
          <div
            className="flex max-h-[calc(100dvh-1rem)] w-full min-w-0 flex-col overflow-hidden rounded-[24px] border border-white/15 bg-[#0e1d2e] shadow-[0_24px_70px_rgba(0,0,0,0.65)] sm:h-full sm:max-h-none sm:w-[360px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMatchId(null)}
                className="m-2 rounded-full bg-[#22344b] px-3 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-[#2d4460]"
              >
                Cerrar ✕
              </button>
            </div>
            <div className="min-h-0 overflow-x-hidden overflow-y-auto p-2 pt-0">
              <MatchCard
                match={selectedMatch}
                pick={picks.get(selectedMatch.id)}
                readOnly={readOnly}
                homeTeam={selectedTeams?.homeTeam ?? null}
                awayTeam={selectedTeams?.awayTeam ?? null}
                canEditTeams={canEditTeams(selectedMatch)}
                canEditScores={canEditScores(selectedMatch)}
                officialResult={officialResults?.get(selectedMatch.id) ?? null}
                onPickWinner={(teamId) => onPickWinner(selectedMatch.id, teamId)}
                onChangeScore={(side, value) =>
                  onChangeScore(selectedMatch.id, side, value)
                }
              />
            </div>
          </div>
        </div>
      ) : null}

      <p className="pointer-events-none absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white/85 sm:bottom-3">
        Toca un partido para {readOnly ? "ver el detalle" : "editarlo"} · arrastra para moverte
      </p>
    </div>
  );
}
