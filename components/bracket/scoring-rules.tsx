import { Surface } from "@/components/ui/card";

const RULES = [
  {
    points: "+4",
    title: "Ganador + marcador exacto",
    detail:
      "Acertaste el equipo que avanzó en esa posición y además el marcador exacto a 90'.",
  },
  {
    points: "+2",
    title: "Solo marcador exacto",
    detail:
      "El marcador oficial coincide exactamente, pero no acertaste el equipo que avanzó.",
  },
  {
    points: "+1",
    title: "Solo ganador",
    detail:
      "Acertaste el equipo que avanzó en esa posición, aunque el marcador no sea exacto.",
  },
  {
    points: "0",
    title: "Sin aciertos",
    detail:
      "No acertaste ni el equipo que avanzó ni el marcador exacto de esa posición.",
  },
];

export function ScoringRules() {
  return (
    <Surface className="p-6 sm:p-8" data-tour="rules">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
            Reglas y puntos
          </p>
          <h3 className="mt-3 font-serif text-3xl text-[var(--ink)]">
            Como se puntua cada partido
          </h3>
        </div>

        <p className="max-w-3xl text-sm leading-6 text-[var(--muted-ink)]">
          Cada posicion del bracket se evalua con dos cosas: el equipo que
          oficialmente avanza y el marcador exacto a 90 minutos. El cruce real
          no da puntos extra, pero tampoco te quita el punto del ganador si
          igual acertaste quien paso.
        </p>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {RULES.map((rule) => (
          <div
            key={rule.points + rule.title}
            className="rounded-[24px] border border-[var(--line)] bg-[var(--surface-soft)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--ink)]">{rule.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-ink)]">
                  {rule.detail}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-bold text-[var(--ink)]">
                {rule.points}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] bg-[var(--surface-soft)] px-4 py-3 text-sm leading-6 text-[var(--muted-ink)]">
        Si el partido que tu imaginabas era distinto al real, igual puedes sumar
        +1 o +4 si acertaste el equipo que avanzaba en esa posicion. Y si no
        acertaste ese ganador, aun puedes sumar +2 por el marcador exacto de la
        posicion.
      </div>

      <div className="mt-3 rounded-[24px] border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6 text-[var(--muted-ink)]">
        Si pronosticas un empate a 90 minutos, igual debes marcar que equipo
        avanza. Lo mismo aplica cuando el administrador registra un resultado
        oficial empatado.
      </div>
    </Surface>
  );
}
