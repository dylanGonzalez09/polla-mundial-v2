"use client";

import { useActionState } from "react";

import { correctPredictionPick } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { idleActionState } from "@/lib/domain/validation";
import type { RoundKey } from "@/lib/domain/types";

export type PredictionCorrectionMatch = {
  predictionId: string;
  matchId: number;
  round: RoundKey;
  code: string;
  roundLabel: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  points: number;
  predictedAdvancingTeamId: number | null;
  contenders: Array<{ id: number; name: string }>;
};

export function PredictionCorrectionForm({
  playerName,
  match,
}: {
  playerName: string;
  match: PredictionCorrectionMatch;
}) {
  const [state, formAction] = useActionState(correctPredictionPick, idleActionState);

  return (
    <Surface accent="live" className="p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--live)]">
            {match.roundLabel} / {match.code}
          </div>
          <h3 className="font-display mt-1 text-lg text-[var(--ink)]">
            {match.homeTeamName} vs {match.awayTeamName}
          </h3>
          <p className="mt-1 text-xs text-[var(--muted-ink)]">
            Correccion para {playerName}
          </p>
        </div>
        <span className="tabular-nums shrink-0 rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-3 py-1 text-sm font-semibold text-[var(--ink)]">
          {match.points} pts
        </span>
      </div>

      <form
        key={`${match.homeScore ?? ""}-${match.awayScore ?? ""}-${match.predictedAdvancingTeamId ?? ""}`}
        action={formAction}
        className="grid gap-3"
      >
        <input name="predictionId" type="hidden" value={match.predictionId} />
        <input name="matchId" type="hidden" value={match.matchId} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`correction-home-score-${match.predictionId}-${match.matchId}`}
            label="Marcador local"
            name="homeScore"
            type="number"
            min={0}
            defaultValue={match.homeScore === null ? "" : String(match.homeScore)}
          />
          <TextField
            id={`correction-away-score-${match.predictionId}-${match.matchId}`}
            label="Marcador visitante"
            name="awayScore"
            type="number"
            min={0}
            defaultValue={match.awayScore === null ? "" : String(match.awayScore)}
          />
        </div>
        <SelectField
          id={`correction-advancing-team-${match.predictionId}-${match.matchId}`}
          label="Equipo que avanza"
          name="advancingTeamId"
          defaultValue={
            match.predictedAdvancingTeamId ? String(match.predictedAdvancingTeamId) : ""
          }
          hint="Para rondas posteriores, estos equipos salen del cuadro predicho por el jugador."
          options={[
            { label: "No registrar", value: "" },
            ...match.contenders.map((team) => ({
              label: team.name,
              value: String(team.id),
            })),
          ]}
        />
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-[var(--primary)]" : "text-[var(--danger)]"}`}>
            {state.message}
          </p>
        ) : null}
        <SubmitButton tone="danger" size="sm">
          Guardar correccion
        </SubmitButton>
      </form>
    </Surface>
  );
}
