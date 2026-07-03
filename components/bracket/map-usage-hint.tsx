export function MapUsageHint({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <p className="mb-3 rounded-2xl bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted-ink)]">
      <strong className="text-[var(--ink)]">🧭 Nuevo: cuadro tipo mapa.</strong>{" "}
      Arrastra para moverte, usa scroll/pellizca para hacer zoom (o los botones{" "}
      <strong>+ / −</strong> de la esquina) y toca un partido para{" "}
      {readOnly ? "ver su detalle" : "elegir el equipo, poner el marcador y ver tus puntos"}.
    </p>
  );
}
