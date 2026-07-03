"use client";

import { useState, useSyncExternalStore } from "react";

// Bump `id` (and update `text`) every time there's a new announcement.
// Changing `id` makes the banner reappear for everyone, even users who
// dismissed a previous update.
const LATEST_UPDATE = {
  id: "2026-07-02-map",
  text: "Nueva actualización ⚠️: Ahora tienes un mapa visual mas organizado para ver tu pronostico.",
};

const noopSubscribe = () => () => {};

function useBannerDismissed(storageKey: string) {
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

export function UpdateBanner() {
  const storageKey = `polla-update-seen:${LATEST_UPDATE.id}`;
  const seenFromStorage = useBannerDismissed(storageKey);
  const [dismissed, setDismissed] = useState(false);
  const visible = !seenFromStorage && !dismissed;

  if (!visible) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--accent)] bg-amber-50 px-5 py-3 text-sm text-[var(--ink)]">
      <p className="font-medium leading-5">{LATEST_UPDATE.text}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 rounded-full px-2 py-1 text-lg leading-none text-[var(--muted-ink)] transition hover:text-[var(--ink)]"
      >
        ×
      </button>
    </div>
  );
}
