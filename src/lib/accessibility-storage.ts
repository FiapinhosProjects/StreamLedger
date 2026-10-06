/**
 * Storage de preferências de acessibilidade (tema + escala de fonte).
 *
 * Por que este arquivo existe separado de src/lib/storage.ts:
 * - storage.ts usa AES-GCM via Web Crypto, que é assíncrono. O anti-FOUC
 *   precisa de leitura SÍNCRONA de localStorage antes do React montar.
 * - A11y prefs não são sensíveis (sem PII, sem segredos), não justificam
 *   o overhead de criptografia.
 *
 * Versionamento: se VERSION mudar, loadA11y() cai pro DEFAULT.
 * Migrações reais devem ser feitas via increment de versão + script único.
 */

export const STORAGE_KEY = "streamledger_a11y";
export const VERSION = 1;

export const THEMES = ["neon", "high-contrast"] as const;
export type Theme = (typeof THEMES)[number];

export const FONT_SCALES = ["xs", "m", "g", "xl"] as const;
export type FontScale = (typeof FONT_SCALES)[number];

export interface A11yPrefs {
  theme: Theme;
  fontScale: FontScale;
}

export const FONT_SCALE_MULTIPLIER: Record<FontScale, number> = {
  xs: 0.85,
  m: 1.0,
  g: 1.15,
  xl: 1.3,
};

export const DEFAULT_PREFS: A11yPrefs = {
  theme: "neon",
  fontScale: "m",
};

function isTheme(v: unknown): v is Theme {
  return typeof v === "string" && (THEMES as readonly string[]).includes(v);
}

function isFontScale(v: unknown): v is FontScale {
  return typeof v === "string" && (FONT_SCALES as readonly string[]).includes(v);
}

/**
 * Lê as preferências de a11y do localStorage de forma síncrona.
 * Retorna DEFAULT_PREFS em qualquer falha (SSR, JSON inválido, versão errada,
 * valor fora do enum). Nunca lança.
 */
export function loadA11y(): A11yPrefs {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return DEFAULT_PREFS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFS;
    const obj = parsed as Record<string, unknown>;
    if (obj.version !== VERSION) return DEFAULT_PREFS;
    if (!isTheme(obj.theme)) return DEFAULT_PREFS;
    if (!isFontScale(obj.fontScale)) return DEFAULT_PREFS;
    return {
      theme: obj.theme,
      fontScale: obj.fontScale,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Salva as preferências de a11y no localStorage de forma síncrona.
 * Ignora silenciosamente em SSR ou em caso de quota cheia / modo privado.
 */
export function saveA11y(prefs: A11yPrefs): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: VERSION, ...prefs })
    );
  } catch {
    // quota excedida ou localStorage desabilitado — falha silenciosa
  }
}
