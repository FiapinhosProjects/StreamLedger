"use client";

import { useState, useEffect } from "react";

interface ExchangeData {
  rate: number | null;
  loading: boolean;
}

export function useExchangeRate(): ExchangeData {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch("https://economia.awesomeapi.com.br/last/USD-BRL");
        const data = await res.json();
        setRate(parseFloat(data.USDBRL.bid));
      } catch {
        setRate(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRate();
  }, []);

  return { rate, loading };
}
