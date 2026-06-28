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
  /** Selector del elemento real a resaltar. Si no se encuentra, el paso se muestra centrado. */
  target?: string;
  eyebrow: string;
  title: string;
  body: string;
  highlights?: string[];
};

const STEPS: TourStep[] = [
  {
    eyebrow: "Bienvenido",
    title: "Así funciona la Polla Mundial",
    body: "Vas a predecir el cuadro del torneo: qué equipo avanza en cada cruce y los marcadores de cada partido. Mientras más aciertes, más puntos sumas. Te muestro dónde está cada cosa en menos de un minuto.",
  },
  {
    target: '[data-tour="nav-bracket"]',
    eyebrow: "Pestaña · Bracket",
    title: "Aquí armas tu cuadro",
    body: "En Bracket eliges el equipo que avanza en todas las rondas (de 16avos hasta la final) y cargas los marcadores de 16avos. Es el corazón del juego.",
  },
  {
    target: '[data-tour="confirm"]',
    eyebrow: "Bracket · Confirmar",
    title: "Confirma tu cuadro inicial",
    body: "Cuando completes equipos y marcadores de 16avos, confirmas aquí una sola vez. Al confirmar, los equipos quedan fijos para siempre, así que revísalo bien antes.",
    highlights: [
      "Solo puedes confirmar mientras la ventana inicial esté abierta.",
    ],
  },
  {
    target: '[data-tour="phases"]',
    eyebrow: "Bracket · Fases",
    title: "Marcadores por fase",
    body: "Después de confirmar, cada fase (octavos, cuartos, etc.) la abre el administrador. Cuando esté abierta, cargas los marcadores arriba en cada partido y envías la fase desde aquí. Una fase enviada queda fija.",
  },
  {
    eyebrow: "Puntaje",
    title: "Cómo se ganan los puntos",
    body: "Cada partido se compara con el resultado oficial:",
    highlights: [
      "3 puntos si aciertas el marcador exacto.",
      "1 punto si aciertas solo el resultado (local, empate o visitante).",
      "0 puntos si no coincide.",
    ],
  },
  {
    target: '[data-tour="nav-players"]',
    eyebrow: "Pestaña · Jugadores",
    title: "Mira a los demás",
    body: "Aquí ves los cuadros del resto, pero solo lo que tú ya desbloqueaste: cada fase que envías te deja ver esa misma fase de los demás. Nadie ve tus pronósticos antes de comprometer los suyos.",
  },
  {
    target: '[data-tour="nav-ranking"]',
    eyebrow: "Pestaña · Ranking",
    title: "La tabla general",
    body: "El Ranking suma tus aciertos y ordena a todos los participantes. Vuelve después de cada fase para ver cómo te mueves. ¡Listo, ya puedes empezar a armar tu cuadro!",
  },
];

type Rect = { top: number; left: number; width: number; height: number };

const PAD = 8;

// useSyncExternalStore: lee localStorage (valor solo-cliente) sin efectos ni
// warnings de hidratación. En el servidor devuelve "visto" para no renderizar.
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
  const storageKey = `polla-tour-seen:${userId}`;
  const seen = useTourSeen(storageKey);
  const [dismissed, setDismissed] = useState(false);
  const open = !seen && !dismissed;
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipSize, setTooltipSize] = useState({ width: 360, height: 240 });
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const current = STEPS[step];
  const selector = current?.target;

  // Mide el elemento objetivo y lo mantiene sincronizado durante scroll/resize.
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

    // La primera medición ocurre dentro del rAF (un callback, no el cuerpo del
    // efecto) y se repite mientras dura el scroll suave.
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
  }, [open, step, selector, measure]);

  // Mide el tamaño real del tooltip para posicionarlo.
  useLayoutEffect(() => {
    if (tooltipRef.current) {
      const { offsetWidth, offsetHeight } = tooltipRef.current;
      setTooltipSize((prev) =>
        prev.width === offsetWidth && prev.height === offsetHeight
          ? prev
          : { width: offsetWidth, height: offsetHeight },
      );
    }
  }, [step, rect, open]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // Ignorar errores de almacenamiento (modo privado, etc.).
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

  // Posición del tooltip: junto al elemento resaltado o centrado si no hay objetivo.
  let tipTop: number;
  let tipLeft: number;

  if (rect) {
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
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      {/* Capa oscura con recorte (spotlight) sobre el elemento resaltado. */}
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

      {/* Anillo alrededor del elemento resaltado. */}
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

      {/* Tarjeta con la explicación, posicionada junto al elemento. */}
      <div
        ref={tooltipRef}
        className="absolute w-[min(360px,calc(100vw-32px))] rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_60px_rgba(11,33,22,0.4)] transition-all duration-200"
        style={{ top: tipTop, left: tipLeft }}
      >
        <div className="flex flex-col gap-4 p-5 sm:p-6">
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
            <h2 id="onboarding-title" className="font-serif text-2xl leading-tight text-[var(--ink)]">
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
                      ●
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="mt-1 flex items-center justify-between gap-4">
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

            <div className="flex items-center gap-2">
              {!isFirst ? (
                <Button type="button" tone="secondary" onClick={() => setStep((v) => v - 1)}>
                  Atrás
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
