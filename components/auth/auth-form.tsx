"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/ui/button";
import { Surface } from "@/components/ui/card";
import { TextField } from "@/components/ui/field";
import { idleActionState, type ActionState } from "@/lib/domain/validation";

type AuthFormProps = {
  title: string;
  subtitle: string;
  fields: Array<{
    id: string;
    label: string;
    type: string;
    autoComplete?: string;
  }>;
  submitLabel: string;
  action: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  footer: React.ReactNode;
};

export function AuthForm({
  title,
  subtitle,
  fields,
  submitLabel,
  action,
  footer,
}: AuthFormProps) {
  const [state, formAction] = useActionState(action, idleActionState);

  return (
    <Surface className="w-full max-w-md p-8 sm:p-10">
      <div className="mb-8 flex flex-col gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
          Polla Mundial
        </div>
        <h1 className="font-serif text-4xl leading-tight text-[var(--ink)]">{title}</h1>
        <p className="text-sm leading-6 text-[var(--muted-ink)]">{subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {fields.map((field) => (
          <TextField
            key={field.id}
            id={field.id}
            name={field.id}
            type={field.type}
            label={field.label}
            autoComplete={field.autoComplete}
            error={state.fieldErrors?.[field.id]?.[0]}
            defaultValue={
              field.type === "password" ? undefined : state.values?.[field.id]
            }
            required
          />
        ))}

        {state.message ? (
          <p className="rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--muted-ink)]">
            {state.message}
          </p>
        ) : null}

        <div className="mt-2 flex flex-col gap-3">
          <SubmitButton block>{submitLabel}</SubmitButton>
          <div className="text-sm text-[var(--muted-ink)]">{footer}</div>
        </div>
      </form>
    </Surface>
  );
}
