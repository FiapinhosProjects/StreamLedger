// ============================================
// useRateLimit.ts - Hook React para Rate Limiting
// Use este hook em componentes React client-side
// ============================================

"use client";

import { useState, useCallback } from "react";
import {
  checkClientRateLimit,
  resetRateLimit as resetLimit,
  type RateLimitAction,
  type RateLimitResult,
  LIMITS,
} from "./rateLimit";

/**
 * Hook para usar rate limiting em componentes React
 */
export function useRateLimit(action: RateLimitAction, customKey?: string) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number>(LIMITS[action].max);

  const check = useCallback(() => {
    const result = checkClientRateLimit(action, customKey);
    setIsBlocked(!result.allowed);
    setRemaining(result.remaining);
    setBlockedUntil(result.blockedUntil || null);
    return result.allowed;
  }, [action, customKey]);

  const reset = useCallback(() => {
    resetLimit(action, customKey);
    setIsBlocked(false);
    setBlockedUntil(null);
    setRemaining(LIMITS[action].max);
  }, [action, customKey]);

  return {
    check,
    isBlocked,
    blockedUntil,
    remaining,
    reset,
    limit: LIMITS[action],
  };
}

export type { RateLimitAction, RateLimitResult };
