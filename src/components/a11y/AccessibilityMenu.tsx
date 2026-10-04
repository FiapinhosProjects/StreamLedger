"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useAccessibility } from "@/components/providers/AccessibilityProvider";
import {
  FONT_SCALES,
  FONT_SCALE_MULTIPLIER,
  THEMES,
  type FontScale,
  type Theme,
} from "@/lib/accessibility-storage";

const THEME_LABELS: Record<Theme, string> = {
  "neon": "Neon (padrão)",
  "high-contrast": "Alto Contraste",
};

const FONT_SCALE_LABEL: Record<FontScale, string> = {
  xs: "XS",
  m: "M",
  g: "G",
  xl: "XL",
};

// Alt+1 = Neon (padrão), Alt+2 = Alto Contraste.
const THEME_HOTKEY: Record<number, Theme> = {
  1: "neon",
  2: "high-contrast",
};

/**
 * Floating Action Button (FAB) + painel com preferências de acessibilidade.
 *
 * Posição: bottom-right (z-40), acima do Toast mas abaixo do modal
 * de instalação (z-99999).
 *
 * Atalhos de teclado (só disparam fora de inputs/textareas):
 *   Alt+1..4 — troca tema
 *   Alt+0   — cicla font-scale
 *   Escape  — fecha painel e devolve foco ao FAB
 */
export default function AccessibilityMenu() {
  const { theme, fontScale, setTheme, cycleFontScale, resetAll } =
    useAccessibility();
  const [open, setOpen] = useState(false);

  const fabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const panelId = useId();

  // Atalhos globais (Alt+1..4 = tema, Alt+0 = ciclar font-scale)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
        return;
      }
      if (e.key === "0") {
        e.preventDefault();
        cycleFontScale();
      } else {
        const nextTheme = THEME_HOTKEY[Number(e.key)];
        if (nextTheme) {
          e.preventDefault();
          setTheme(nextTheme);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTheme, cycleFontScale]);

  // Escape fecha painel e devolve foco ao FAB
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click outside fecha painel
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        fabRef.current &&
        !fabRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const toggleOpen = useCallback(() => {
    setOpen((v) => !v);
  }, []);

  const closePanel = useCallback(() => {
    setOpen(false);
    fabRef.current?.focus();
  }, []);

  const currentFontScaleMult = FONT_SCALE_MULTIPLIER[fontScale];

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        aria-label="Abrir menu de acessibilidade"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
        className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-card border border-neon/30 text-neon shadow-lg hover:bg-neon/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background flex items-center justify-center transition-colors"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* Ícone universal de acessibilidade */}
        <svg
          viewBox="0 0 24 24"
          className="w-7 h-7"
          fill="currentColor"
          aria-hidden="true"
        >
          <circle cx="12" cy="4.5" r="2" />
          <path d="M5 8h14v2h-5l1 11h-2l-1-7-1 7H9l1-11H5z" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={headingId}
          className="fixed bottom-24 left-6 z-40 w-[min(92vw,360px)] max-h-[min(80vh,600px)] overflow-y-auto bg-card border border-neon/30 rounded-2xl shadow-xl p-5 text-foreground"
        >
          <div className="flex items-center justify-between mb-3 gap-2">
            <h2
              id={headingId}
              className="text-base font-bold"
            >
              Preferências de acessibilidade
            </h2>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Fechar menu de acessibilidade"
              className="text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon rounded p-1"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          <fieldset className="mb-4">
            <legend className="text-sm font-semibold mb-2">
              Tema
            </legend>
            <div role="radiogroup" aria-label="Tema de cor" className="flex flex-col gap-1">
              {THEMES.map((t, idx) => {
                const isChecked = theme === t;
                const hotkey = idx + 1;
                return (
                  <label
                    key={t}
                    className="flex items-center justify-between gap-2 cursor-pointer rounded px-2 py-1.5 hover:bg-neon/5 focus-within:bg-neon/5"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="a11y-theme"
                        value={t}
                        checked={isChecked}
                        onChange={() => setTheme(t)}
                        className="accent-[color:var(--color-neon)] cursor-pointer"
                      />
                      <span className="text-sm">{THEME_LABELS[t]}</span>
                    </span>
                    <kbd className="text-xs text-muted bg-background/50 border border-border rounded px-1.5 py-0.5 font-mono">
                      Alt+{hotkey}
                    </kbd>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="text-sm font-semibold mb-2">
              Tamanho do texto
            </legend>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={cycleFontScale}
                aria-label={`Tamanho do texto atual: ${FONT_SCALE_LABEL[fontScale]}, ${Math.round(currentFontScaleMult * 100)}%. Pressione para ciclar.`}
                className="px-3 py-1.5 text-sm rounded-lg border border-neon/20 hover:bg-neon/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon transition-colors"
              >
                {FONT_SCALE_LABEL[fontScale]} ·{" "}
                {Math.round(currentFontScaleMult * 100)}%
              </button>
              <kbd className="text-xs text-muted bg-background/50 border border-border rounded px-1.5 py-0.5 font-mono">
                Alt+0
              </kbd>
            </div>
            <p className="text-xs text-muted mt-2">
              {FONT_SCALES.length} níveis (XS a XL)
            </p>
          </fieldset>

          <button
            type="button"
            onClick={resetAll}
            className="w-full px-3 py-2 text-sm rounded-lg bg-neon text-background font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-opacity"
          >
            Restaurar padrões
          </button>
        </div>
      )}
    </>
  );
}