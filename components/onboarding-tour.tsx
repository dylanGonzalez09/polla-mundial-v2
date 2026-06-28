"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";

type TourStep = {
  target?: string;
  eyebrow: string;
  title: string;
  body: string;
  highlights?: string[];
};

const STEPS: TourStep[] = [
  {
    eyebrow: "Bienvenido",
    title: "Asi funciona la Polla Mundial",
    body: "Vas a predecir el cuadro completo del torneo: que equipo avanza en cada cruce y el marcador de cada partido. Mientras mas aciertes, mas puntos sumas.",
  },
  {
    target: '[data-tour="nav-bracket"]',
    eyebrow: "Las 3 pestanas",
    title: "Bracket, Jugadores y Ranking",
    body: "Arriba tienes tres pestanas. En Bracket armas tu cuadro, en Jugadores comparas con los demas y en Ranking ves la tabla general.",
  },
  {
    eyebrow: "Bracket · Paso 1",
    title: "Elige quien avanza",
    body: "En cada partido toca el equipo que crees que pasa de ronda. Ese equipo aparece automaticamente en el siguiente cruce y asi armas todo el cuadro.",
    highlights: [
      "Debes elegir el equipo que avanza en todas las rondas, de 16avos a la final.",
    ],
  },
  {
    eyebrow: "Bracket · Paso 2",
    title: "Carga los marcadores de 16avos",
    body: "Debajo de cada partido escribes el marcador. Para confirmar tu cuadro inicial debes llenar los 16 marcadores de 16avos.",
  },
  {
    target: '[data-tour="confirm"]',
    eyebrow: "Bracket · Confirmar",
    title: "Confirma tu cuadro inicial",
    body: "Cuando tengas todos los equipos y los marcadores de 16avos, confirmas aqui una sola vez. Al confirmar, los equipos que elegiste quedan fijos.",
    highlights: ["Solo puedes confirmar mientras la ventana inicial este abierta."],
  },
  {
    target: '[data-tour="rules"]',
    eyebrow: "Reglas y puntos",
    title: "Asi se puntua cada partido",
    body: "En esta seccion tienes la regla completa. Cada posicion del bracket se evalua por el equipo que avanza y por el marcador exacto a 90 minutos.",
    highlights: [
      "Ganador + marcador exacto = 4 puntos.",
      "Empate exacto sin acertar quien avanza = 3 puntos.",
      "Solo marcador exacto = 2 puntos.",
      "Solo ganador = 1 punto.",
      "Sin aciertos = 0 puntos.",
      "Si el marcador queda empatado, igual debes marcar quien avanza.",
    ],
  },
  {
    eyebrow: "Puntaje · Ejemplo",
    title: "Cuando falla el cruce",
    body: "Si tu imaginabas un partido distinto al real, aun puedes sumar. Si acertaste quien avanzaba en esa posicion, te llevas el punto del ganador. Si ademas pegaste el marcador exacto, te llevas 4. Y si no acertaste el ganador pero si el marcador exacto, te llevas 2. Si el oficial termina empatado, ese exacto vale 3 aunque no hayas acertado quien avanzaba.",
  },
  {
    target: '[data-tour="phases"]',
    eyebrow: "Bracket · Enviar fases",
    title: "Como envias cada fase",
    body: "Despues de confirmar, el administrador va abriendo las fases. Cuando una este abierta, escribes los marcadores de esa ronda y la envias desde aqui. Una vez enviada, queda fija.",
  },
  {
    target: '[data-tour="nav-players"]',
    eyebrow: "Pestana · Jugadores",
    title: "Mira a los demas",
    body: "Aqui ves los cuadros del resto, pero solo lo que ya desbloqueaste. Cada fase que envias te deja ver esa misma fase de los demas.",
  },
  {
    target: '[data-tour="nav-ranking"]',
    eyebrow: "Pestana · Ranking",
    title: "La tabla general",
    body: "El Ranking suma tus aciertos y ordena a todos los participantes. Vuelve despues de cada fase para ver como te mueves.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;
const noopSubscribe = () => () => {};

function useTourSeen(storageKey: string) {
  return useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return window.localStorage.getItem(storageKey) != null;
      } catch {
        return true;
      }
    },
    () => true,
  );
}

export function OnboardingTour({ userId }: { userId: string }) {
  const storageKey = `polla-tour-seen:v3:${userId}`;
  const seen = useTourSeen(storageKey);
  const [dismissed, setDismissed] = useState(false);
  const open = !seen && !dismissed;
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 240 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const current = STEPS[step];
  const selector = current?.target;

  const measure = useCallback(() => {
    if (!selector) {
      setRect(null);
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      setRect(null);
      return;
    }

    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [selector]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const el = selector ? document.querySelector(selector) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    }

    let frame = 0;
    const start = performance.now();
    const follow = (now: number) => {
      measure();
      if (now - start < 700) {
        frame = requestAnimationFrame(follow);
      }
    };

    frame = requestAnimationFrame(follow);

    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, selector, step, measure]);

  useLayoutEffect(() => {
    if (!tooltipRef.current) {
      return;
    }

    const { offsetWidth, offsetHeight } = tooltipRef.current;
    setTooltipSize((prev) =>
      prev.width === offsetWidth && prev.height === offsetHeight
        ? prev
        : { width: offsetWidth, height: offsetHeight },
    );
  }, [step, rect, open]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignore storage issues.
    }
    setDismissed(true);
  }, [storageKey]);

  if (!open || !current) {
    return null;
  }

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const margin = 16;
  const gap = 14;
  const compactViewport = vw < 640 || vh < 760;

  let tipTop: number;
  let tipLeft: number;

  if (!compactViewport && rect) {
    const hole = {
      top: rect.top - PAD,
      left: rect.left - PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2,
    };

    const spaceBelow = vh - (hole.top + hole.height);
    const spaceAbove = hole.top;

    if (spaceBelow >= tooltipSize.height + gap || spaceBelow >= spaceAbove) {
      tipTop = hole.top + hole.height + gap;
    } else {
      tipTop = hole.top - gap - tooltipSize.height;
    }

    tipLeft = hole.left + hole.width / 2 - tooltipSize.width / 2;
    tipTop = Math.max(margin, Math.min(tipTop, vh - tooltipSize.height - margin));
    tipLeft = Math.max(margin, Math.min(tipLeft, vw - tooltipSize.width - margin));
  } else {
    tipTop = vh / 2 - tooltipSize.height / 2;
    tipLeft = vw / 2 - tooltipSize.width / 2;
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <svg className="pointer-events-auto absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <mask id="onboarding-hole">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect ? (
              <rect
                x={rect.left - PAD}
                y={rect.top - PAD}
                width={rect.width + PAD * 2}
                height={rect.height + PAD * 2}
                rx="16"
                fill="black"
              />
            ) : null}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(11,22,33,0.62)"
          mask="url(#onboarding-hole)"
        />
      </svg>

      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-transparent transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0)",
          }}
        />
      ) : null}

      <div
        ref={tooltipRef}
        className={`absolute rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(11,33,22,0.4)] transition-all duration-200 ${
          compactViewport
            ? "inset-x-4 bottom-4 max-h-[calc(100vh-32px)]"
            : "w-[min(360px,calc(100vw-32px))]"
        }`}
        style={compactViewport ? undefined : { top: tipTop, left: tipLeft }}
      >
        <div className="flex max-h-[calc(100vh-32px)] flex-col gap-4 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">
              {current.eyebrow}
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-semibold text-[var(--muted-ink)] transition hover:text-[var(--ink)]"
            >
              Saltar
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <h2
              id="onboarding-title"
              className="font-serif text-2xl leading-tight text-[var(--ink)]"
            >
              {current.title}
            </h2>
            <p className="text-sm leading-6 text-[var(--muted-ink)]">{current.body}</p>

            {current.highlights ? (
              <ul className="mt-1 flex flex-col gap-2">
                {current.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 rounded-2xl bg-[var(--surface-soft)] px-3 py-2 text-sm leading-6 text-[var(--ink)]"
                  >
                    <span aria-hidden className="text-[var(--accent)]">
                      *
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5" aria-hidden>
              {STEPS.map((_, index) => (
                <span
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === step ? "w-5 bg-[var(--accent)]" : "w-2 bg-[var(--line)]"
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
              {!isFirst ? (
                <Button type="button" tone="secondary" onClick={() => setStep((v) => v - 1)}>
                  Atras
                </Button>
              ) : null}

              {isLast ? (
                <Button type="button" onClick={dismiss}>
                  Empezar
                </Button>
              ) : (
                <Button type="button" onClick={() => setStep((v) => v + 1)}>
                  Siguiente
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
