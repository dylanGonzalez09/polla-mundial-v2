"use client";

import { useEffect, useState } from "react";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

type BaseFieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
};

type TextFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    textarea?: false;
  };

type SelectFieldProps = BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    options: Array<{ label: string; value: string }>;
  };

function FieldFrame({
  label,
  id,
  hint,
  error,
  children,
}: BaseFieldProps & { children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2" htmlFor={id}>
      <span className="text-sm font-medium text-[var(--ink)]">{label}</span>
      {children}
      {hint ? <span className="text-xs text-[var(--muted-ink)]">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}

export function TextField({ label, id, hint, error, className = "", ...props }: TextFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        className={`h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] ${className}`}
        {...props}
      />
    </FieldFrame>
  );
}

export function SelectField({
  label,
  id,
  hint,
  error,
  className = "",
  options,
  ...props
}: SelectFieldProps) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <select
        id={id}
        className={`h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldFrame>
  );
}

type DateTimeFieldProps = BaseFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange" | "type"> & {
    // Valor almacenado en UTC (ISO). Se convierte a la hora local del navegador.
    utcValue?: string | null;
  };

// Convierte un ISO en UTC a "YYYY-MM-DDTHH:mm" en la hora local del navegador.
function toLocalInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function DateTimeField({
  label,
  id,
  hint,
  error,
  className = "",
  utcValue,
  ...props
}: DateTimeFieldProps) {
  // Se inicializa vacío y se completa tras montar para evitar mismatch de
  // hidratación (la conversión depende de la zona horaria del navegador).
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(toLocalInputValue(utcValue));
  }, [utcValue]);

  return (
    <FieldFrame id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className={`h-11 rounded-2xl border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] ${className}`}
        {...props}
      />
    </FieldFrame>
  );
}
