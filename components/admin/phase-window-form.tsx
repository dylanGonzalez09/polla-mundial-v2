"use client";

import { useActionState } from "react";

import { setManualOverride, setPhaseWindow } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { DateTimeField, SelectField } from "@/components/ui/field";
import { idleActionState } from "@/lib/domain/validation";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import type { AppSettings, MatchPhaseWindow } from "@/lib/domain/types";

export function PhaseWindowForm({
  settings,
  phases,
}: {
  settings: AppSettings;
  phases: MatchPhaseWindow[];
}) {
  const [windowState, windowAction] = useActionState(setPhaseWindow, idleActionState);
  const [overrideState, overrideAction] = useActionState(
    setManualOverride,
    idleActionState,
  );

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Surface accent="gold" className="p-6">
        <h2 className="font-display text-xl text-[var(--ink)]">Ventana inicial</h2>
        <form action={windowAction} className="mt-5 space-y-4">
          <input name="scope" type="hidden" value="initial" />
          <DateTimeField
            id="initial-opens-at"
            label="Apertura"
            name="opensAt"
            hint="Hora local"
            utcValue={settings.initialOpensAt}
          />
          <DateTimeField
            id="initial-deadline"
            label="Deadline"
            name="closesAt"
            hint="Hora local"
            utcValue={settings.initialDeadline}
          />
          {windowState.message ? (
            <p className="text-sm text-[var(--muted-ink)]">{windowState.message}</p>
          ) : null}
          <SubmitButton>Guardar ventana inicial</SubmitButton>
        </form>

        <form action={overrideAction} className="mt-5 space-y-4">
          <input name="scope" type="hidden" value="initial" />
          <SelectField
            id="initial-override"
            label="Override manual"
            name="manualOverride"
            defaultValue={settings.initialOverride ?? ""}
            options={[
              { label: "Modo automatico", value: "" },
              { label: "Forzar abierto", value: "open" },
              { label: "Forzar cerrado", value: "closed" },
            ]}
          />
          {overrideState.message ? (
            <p className="text-sm text-[var(--muted-ink)]">{overrideState.message}</p>
          ) : null}
          <SubmitButton tone="secondary">Guardar override inicial</SubmitButton>
        </form>
      </Surface>

      <div className="space-y-5">
        {phases.map((phase) => (
          <Surface key={phase.round} accent="info" className="p-6">
            <h3 className="font-display text-xl text-[var(--ink)]">
              {ROUND_LABELS[phase.round]}
            </h3>
            <p className="mt-1 text-sm text-[var(--muted-ink)]">
              Estado actual: {phase.effectiveStatus}
            </p>

            <form action={windowAction} className="mt-5 space-y-4">
              <input name="scope" type="hidden" value="round" />
              <input name="round" type="hidden" value={phase.round} />
              <DateTimeField
                id={`${phase.round}-opensAt`}
                label="Apertura"
                name="opensAt"
                hint="Hora local"
                utcValue={phase.opensAt}
              />
              <DateTimeField
                id={`${phase.round}-closesAt`}
                label="Cierre"
                name="closesAt"
                hint="Hora local"
                utcValue={phase.closesAt}
              />
              <SubmitButton>Guardar ventana</SubmitButton>
            </form>

            <form action={overrideAction} className="mt-5 space-y-4">
              <input name="scope" type="hidden" value="round" />
              <input name="round" type="hidden" value={phase.round} />
              <SelectField
                id={`${phase.round}-override`}
                label="Override manual"
                name="manualOverride"
                defaultValue={phase.manualOverride ?? ""}
                options={[
                  { label: "Modo automatico", value: "" },
                  { label: "Forzar abierto", value: "open" },
                  { label: "Forzar cerrado", value: "closed" },
                ]}
              />
              <SubmitButton tone="secondary">Guardar override</SubmitButton>
            </form>
          </Surface>
        ))}
      </div>
    </div>
  );
}
