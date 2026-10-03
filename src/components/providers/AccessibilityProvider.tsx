"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  DEFAULT_PREFS,
  FONT_SCALES,
  FONT_SCALE_MULTIPLIER,
  loadA11y,
  saveA11y,
  type A11yPrefs,
  type FontScale,
  type Theme,
} from "@/lib/accessibility-storage";

interface A11yContextValue extends A11yPrefs {
  setTheme: (theme: Theme) => void;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: () => void;
  resetAll: () => void;
}

const A11yContext = createContext<A11yContextValue | null>(null);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

/**
 * Provider que mantém tema + escala de fonte sincronizados entre
 * React state, localStorage e atributos do <html>.
 *
 * O atributo data-theme e a variável --sl-app-font-scale são setados:
 * - ANTES do React montar: pelo script inline no <head> do layout raiz
 *   (anti-FOUC; lê localStorage síncrono).
 * - DEPOIS da hidratação: por este useEffect, sempre que prefs muda.
 */
export default function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  // Lazy initializer: lê do localStorage já no primeiro render (síncrono).
  // O script inline anti-FOUC no <head> já aplicou o estado correto ao DOM;
  // aqui só garantimos que o state do React está alinhado. loadA11y() é
  // seguro em SSR (retorna DEFAULT_PREFS quando window é undefined).
  const [prefs, setPrefs] = useState<A11yPrefs>(() => loadA11y());

  // Aplica prefs ao <html> sempre que mudar. Idempotente.
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
    document.documentElement.style.setProperty(
      "--sl-app-font-scale",
      String(FONT_SCALE_MULTIPLIER[prefs.fontScale])
    );
  }, [prefs]);

  const setTheme = useCallback((theme: Theme) => {
    setPrefs((prev) => {
      const next: A11yPrefs = { ...prev, theme };
      saveA11y(next);
      return next;
    });
  }, []);

  const setFontScale = useCallback((fontScale: FontScale) => {
    setPrefs((prev) => {
      const next: A11yPrefs = { ...prev, fontScale };
      saveA11y(next);
      return next;
    });
  }, []);

  const cycleFontScale = useCallback(() => {
    setPrefs((prev) => {
      const idx = FONT_SCALES.indexOf(prev.fontScale);
      const nextScale = FONT_SCALES[(idx + 1) % FONT_SCALES.length];
      const next: A11yPrefs = { ...prev, fontScale: nextScale };
      saveA11y(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    saveA11y(DEFAULT_PREFS);
    setPrefs(DEFAULT_PREFS);
  }, []);

  const value: A11yContextValue = {
    ...prefs,
    setTheme,
    setFontScale,
    cycleFontScale,
    resetAll,
  };

  return (
    <A11yContext.Provider value={value}>{children}</A11yContext.Provider>
  );
}

/**
 * Hook para acessar as preferências de acessibilidade e seus controles.
 * Deve ser usado dentro de um <AccessibilityProvider>.
 */
export function useAccessibility(): A11yContextValue {
  const ctx = useContext(A11yContext);
  if (!ctx) {
    throw new Error(
      "useAccessibility must be used inside <AccessibilityProvider>"
    );
  }
  return ctx;
}