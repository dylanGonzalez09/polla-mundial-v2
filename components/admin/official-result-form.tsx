"use client";

import { useActionState } from "react";

import { recordOfficialResult } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { idleActionState } from "@/lib/domain/validation";
import type { BracketMatchView, OfficialResult } from "@/lib/domain/types";

export function OfficialResultForm({
  match,
  result,
}: {
  match: BracketMatchView;
  result: OfficialResult | null;
}) {
  const [state, formAction] = useActionState(recordOfficialResult, idleActionState);

  // Solo los 2 equipos que disputan este partido (derivados de la cascada
  // oficial). Si aún no están definidos, no hay opciones de avance.
  const contenders = [match.homeTeam, match.awayTeam].filter(
    (team): team is NonNullable<typeof team> => team !== null,
  );

  return (
    <Surface className="p-5">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
          {match.code}
        </div>
        <h3 className="mt-2 font-serif text-2xl text-[var(--ink)]">
          {match.homeTeam?.name ?? "Por definir"} vs {match.awayTeam?.name ?? "Por definir"}
        </h3>
      </div>

      <form
        key={`${result?.homeScore ?? ""}-${result?.awayScore ?? ""}-${result?.advancingTeamId ?? ""}`}
        action={formAction}
        className="grid gap-4"
      >
        <input name="matchId" type="hidden" value={match.id} />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            id={`home-score-${match.id}`}
            label="Marcador local"
            name="homeScore"
            type="number"
            min={0}
            defaultValue={String(result?.homeScore ?? "")}
            required
          />
          <TextField
            id={`away-score-${match.id}`}
            label="Marcador visitante"
            name="awayScore"
            type="number"
            min={0}
            defaultValue={String(result?.awayScore ?? "")}
            required
          />
        </div>
        <SelectField
          id={`advancing-team-${match.id}`}
          label="Equipo que avanza"
          name="advancingTeamId"
          defaultValue={result?.advancingTeamId ? String(result.advancingTeamId) : ""}
          disabled={contenders.length === 0}
          hint={
            contenders.length === 0
              ? "Se definen al cargar los resultados de la ronda anterior"
              : "Si el marcador queda empatado a 90', debes elegir igual que equipo avanza."
          }
          options={[
            { label: "No registrar", value: "" },
            ...contenders.map((team) => ({
              label: team.name,
              value: String(team.id),
            })),
          ]}
        />
        {state.message ? (
          <p className="text-sm text-[var(--muted-ink)]">{state.message}</p>
        ) : null}
        <SubmitButton>Guardar resultado</SubmitButton>
      </form>
    </Surface>
  );
}
