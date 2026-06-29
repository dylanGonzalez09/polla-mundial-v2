"use client";

type ScoreInputProps = {
  value: number | null;
  disabled?: boolean;
  onChange: (value: number | null) => void;
  label?: string;
};

export function ScoreInput({ value, disabled, onChange, label }: ScoreInputProps) {
  return (
    <input
      className="h-10 w-full rounded-2xl border border-[var(--line)] bg-white px-3 text-center text-sm font-semibold text-[var(--ink)] outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)]"
      disabled={disabled}
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      type="text"
      aria-label={label ? `Marcador ${label}` : "Marcador"}
      placeholder="–"
      value={value === null ? "" : String(value)}
      onChange={(event) => {
        // Solo digitos: descarta signos, letras, "e", puntos, etc.
        const digits = event.target.value.replace(/\D/g, "");
        if (digits === "") {
          onChange(null);
          return;
        }

        // parseInt elimina ceros a la izquierda ("01" -> 1, "0" -> 0).
        onChange(Number.parseInt(digits, 10));
      }}
    />
  );
}
