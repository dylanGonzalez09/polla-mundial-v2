"use client";

import { useActionState } from "react";

import { setManualOverride, setPhaseWindow } from "@/actions/admin";
import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { DateTimeField, SelectField } from "@/components/ui/field";
import { idleActionState } from "@/lib/domain/validation";
import { ROUND_LABELS } from "@/lib/domain/rounds";
import type { AppSettings, MatchPhaseWindow } from "@/lib/domain/types";

const STATUS_BADGE_CLASS: Record<string, string> = {
  open: "bg-[rgba(0,168,89,0.12)] text-[var(--primary)]",
  closed: "bg-[var(--surface-soft)] text-[var(--muted-ink)]",
  locked: "bg-[rgba(224,16,47,0.1)] text-[var(--live)]",
};

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
    <div className="space-y-4">
      <Surface accent="gold" className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg text-[var(--ink)]">Ventana inicial</h2>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              STATUS_BADGE_CLASS[settings.initialEffectiveStatus] ?? STATUS_BADGE_CLASS.closed
            }`}
          >
            {settings.initialEffectiveStatus}
          </span>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <form action={windowAction} className="space-y-2">
            <input name="scope" type="hidden" value="initial" />
            <div className="grid grid-cols-2 gap-2">
              <DateTimeField
                id="initial-opens-at"
                label="Apertura"
                name="opensAt"
                utcValue={settings.initialOpensAt}
              />
              <DateTimeField
                id="initial-deadline"
                label="Deadline"
                name="closesAt"
                utcValue={settings.initialDeadline}
              />
            </div>
            {windowState.message ? (
              <p className="text-xs text-[var(--muted-ink)]">{windowState.message}</p>
            ) : null}
            <SubmitButton size="sm">Guardar ventana</SubmitButton>
          </form>

          <form action={overrideAction} className="space-y-2">
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
              <p className="text-xs text-[var(--muted-ink)]">{overrideState.message}</p>
            ) : null}
            <SubmitButton tone="secondary" size="sm">
              Guardar override
            </SubmitButton>
          </form>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        {phases.map((phase) => (
          <Surface key={phase.round} accent="info" className="p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-lg text-[var(--ink)]">
                {ROUND_LABELS[phase.round]}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  STATUS_BADGE_CLASS[phase.effectiveStatus] ?? STATUS_BADGE_CLASS.closed
                }`}
              >
                {phase.effectiveStatus}
              </span>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <form action={windowAction} className="space-y-2">
                <input name="scope" type="hidden" value="round" />
                <input name="round" type="hidden" value={phase.round} />
                <div className="grid grid-cols-2 gap-2">
                  <DateTimeField
                    id={`${phase.round}-opensAt`}
                    label="Apertura"
                    name="opensAt"
                    utcValue={phase.opensAt}
                  />
                  <DateTimeField
                    id={`${phase.round}-closesAt`}
                    label="Cierre"
                    name="closesAt"
                    utcValue={phase.closesAt}
                  />
                </div>
                <SubmitButton size="sm">Guardar ventana</SubmitButton>
              </form>

              <form action={overrideAction} className="space-y-2">
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
                <SubmitButton tone="secondary" size="sm">
                  Guardar override
                </SubmitButton>
              </form>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
