
const RATE_LIMIT_STORAGE = "streamLedger_rate_limits";

// Janelas de tempo em milissegundos
const WINDOWS = {
  MINUTE: 60 * 1000,      // 1 minuto
  HOUR: 60 * 60 * 1000,   // 1 hora
  DAY: 24 * 60 * 60 * 1000, // 1 dia
} as const;

// Limites por tipo de ação
export const LIMITS = {
  LOGIN_ATTEMPT: { window: WINDOWS.MINUTE, max: 5, blockDuration: WINDOWS.MINUTE },
  TRANSACTION_CREATE: { window: WINDOWS.MINUTE, max: 10, blockDuration: WINDOWS.MINUTE },
  API_REQUEST: { window: WINDOWS.MINUTE, max: 60, blockDuration: WINDOWS.MINUTE * 5 },
  PASSWORD_RESET: { window: WINDOWS.HOUR, max: 3, blockDuration: WINDOWS.HOUR },
  CPF_VALIDATION: { window: WINDOWS.MINUTE, max: 10, blockDuration: WINDOWS.MINUTE },
} as const;


export type RateLimitAction = keyof typeof LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms até reset
  blockedUntil?: number; // ms até bloquear expirar
}

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  blockedUntil: number;
}


// Para Next.js API routes - usa Map em memória
const serverRateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Limpa entradas expiradas do Map em memória
 */
function cleanExpiredServerEntries(): void {
  const now = Date.now();
  for (const [key, value] of serverRateLimits.entries()) {
    if (value.resetTime < now) {
      serverRateLimits.delete(key);
    }
  }
}

/**
 * Rate limiting para API routes (server-side)
 * @param identifier - Identificador único (IP, userId, etc)
 * @param action - Tipo de ação
 * @param customLimit - Limite customizado (opcional)
 */
export function checkServerRateLimit(
  identifier: string,
  action: RateLimitAction,
  customLimit?: { window: number; max: number }
): RateLimitResult {
  const limit = customLimit || LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();

  // Limpa entradas expiradas
  cleanExpiredServerEntries();

  let entry = serverRateLimits.get(key);

  // Se não existe ou expirou, cria novo
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + limit.window,
    };
  }

  // Verifica se está bloqueado
  if (entry.count >= limit.max) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
      blockedUntil: entry.resetTime,
    };
  }

  // Incrementa contador
  entry.count++;
  serverRateLimits.set(key, entry);

  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetIn: entry.resetTime - now,
  };
}


interface StoredRateLimits {
  [key: string]: RateLimitEntry;
}

/**
 * Obtém os rate limits do localStorage
 */
function getStoredLimits(): StoredRateLimits {
  if (typeof window === "undefined") return {};

  try {
    const data = localStorage.getItem(RATE_LIMIT_STORAGE);
    if (!data) return {};

    const parsed = JSON.parse(data) as StoredRateLimits;
    const now = Date.now();

    // Limpa entradas expiradas
    const cleaned: StoredRateLimits = {};
    for (const [key, entry] of Object.entries(parsed)) {
      if (entry.blockedUntil > now || entry.firstAttempt + WINDOWS.DAY > now) {
        cleaned[key] = entry;
      }
    }

    // Salva versão limpa se mudou
    if (Object.keys(cleaned).length !== Object.keys(parsed).length) {
      localStorage.setItem(RATE_LIMIT_STORAGE, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return {};
  }
}

/**
 * Salva os rate limits no localStorage
 */
function saveStoredLimits(limits: StoredRateLimits): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RATE_LIMIT_STORAGE, JSON.stringify(limits));
}

/**
 * Rate limiting para client-side
 * @param action - Tipo de ação
 * @param customKey - Chave customizada (opcional, ex: CPF)
 */
export function checkClientRateLimit(
  action: RateLimitAction,
  customKey?: string
): RateLimitResult {
  const identifier = customKey || "default";
  const key = `${action}:${identifier}`;
  const limit = LIMITS[action];
  const now = Date.now();

  const stored = getStoredLimits();
  let entry = stored[key];

  // Se não existe, cria novo
  if (!entry) {
    entry = {
      count: 0,
      firstAttempt: now,
      blockedUntil: 0,
    };
  }

  // Verifica se está bloqueado
  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.blockedUntil - now,
      blockedUntil: entry.blockedUntil,
    };
  }

  // Verifica se precisa resetar (janela expirou)
  if (entry.firstAttempt + limit.window < now) {
    entry = {
      count: 0,
      firstAttempt: now,
      blockedUntil: 0,
    };
  }

  // Verifica limite
  if (entry.count >= limit.max) {
    // Bloqueia
    entry.blockedUntil = now + limit.blockDuration;
    stored[key] = entry;
    saveStoredLimits(stored);

    return {
      allowed: false,
      remaining: 0,
      resetIn: limit.blockDuration,
      blockedUntil: entry.blockedUntil,
    };
  }

  // Incrementa
  entry.count++;
  stored[key] = entry;
  saveStoredLimits(stored);

  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetIn: entry.firstAttempt + limit.window - now,
  };
}

/**
 * Registra uma tentativa (usado após ação bem-sucedida)
 */
export function recordAttempt(action: RateLimitAction, customKey?: string): void {
  checkClientRateLimit(action, customKey);
}

/**
 * Reseta o rate limit para uma ação específica
 */
export function resetRateLimit(action: RateLimitAction, customKey?: string): void {
  if (typeof window === "undefined") return;

  const identifier = customKey || "default";
  const key = `${action}:${identifier}`;

  const stored = getStoredLimits();
  delete stored[key];
  saveStoredLimits(stored);
}

/**
 * Reseta todos os rate limits
 */
export function resetAllRateLimits(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(RATE_LIMIT_STORAGE);
}

/**
 * Retorna informações sobre todos os rate limits ativos
 */
export function getRateLimitStatus(): Record<string, RateLimitResult> {
  const stored = getStoredLimits();
  const status: Record<string, RateLimitResult> = {};
  const now = Date.now();

  for (const [key, entry] of Object.entries(stored)) {
    const [action] = key.split(":") as [RateLimitAction];
    const limit = LIMITS[action];

    status[key] = {
      allowed: entry.blockedUntil <= now && entry.count < limit.max,
      remaining: Math.max(0, limit.max - entry.count),
      resetIn: entry.firstAttempt + limit.window - now,
      blockedUntil: entry.blockedUntil > now ? entry.blockedUntil : undefined,
    };
  }

  return status;
}


/**
 * Gera headers de rate limit para responses HTTP
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetIn / 1000).toString(),
    ...(result.blockedUntil
      ? {
          "Retry-After": Math.ceil((result.blockedUntil - Date.now()) / 1000).toString(),
        }
      : {}),
  };
}
