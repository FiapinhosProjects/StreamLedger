"use client";

import { useState, useEffect } from "react";

interface ExchangeData {
  rate: number | null;
  loading: boolean;
  error?: string;
}

export function useExchangeRate(): ExchangeData {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    async function fetchRate() {
      try {
        const res = await fetch(
          "https://economia.awesomeapi.com.br/last/USD-BRL",
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        // Validação defensiva da estrutura da resposta
        if (
          !data ||
          typeof data !== "object" ||
          !data.USDBRL ||
          typeof data.USDBRL !== "object"
        ) {
          throw new Error("Estrutura de resposta inválida");
        }

        const bid = parseFloat(data.USDBRL.bid);
        if (!Number.isFinite(bid) || bid <= 0) {
          throw new Error(`Valor de cotação inválido: ${data.USDBRL.bid}`);
        }

        setRate(bid);
        setError(undefined);
      } catch (err) {
        clearTimeout(timeoutId);
        const message =
          err instanceof Error
            ? err.name === "AbortError"
              ? "Tempo esgotado ao buscar cotação."
              : "Não foi possível obter a cotação."
            : "Erro desconhecido ao buscar cotação.";
        setRate(null);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchRate();

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return { rate, loading, error };
}
