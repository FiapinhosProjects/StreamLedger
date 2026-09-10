"use client";

import Image from "next/image";
import ExponentialGrowthChart from "@/components/ui/ExponentialGrowthChart";
import { useTransactions } from "@/hooks/useTransactions";
import { getTotalByType } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { useExchangeRate } from "@/hooks/useExchangeRate";

export default function Tendencia() {
  const { transactions } = useTransactions();
  const { rate } = useExchangeRate();

  const revenue = getTotalByType(transactions, "income");
  const profit = revenue;

  return (
    <>
      {/* Cabeçalho */}
      <div className="mb-8 text-center pt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neon/10 border border-neon/30 mb-4">
          <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Tendência de Crescimento</h1>
        <p className="text-sm text-muted">Projeções baseadas no seu histórico financeiro</p>
      </div>

      {/* Cards de resumo rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card border border-neon/20 rounded-2xl p-5">
          <p className="text-xs text-muted mb-1">Faturamento Total</p>
          <p className="text-xl font-bold text-neon">{formatCurrency(revenue)}</p>
        </div>
        <div className="bg-card border border-neon/20 rounded-2xl p-5">
          <p className="text-xs text-muted mb-1">Ganhos Estimados</p>
          <p className="text-xl font-bold text-neon">{formatCurrency(profit)}</p>
          {rate && (
            <p className="text-xs text-muted mt-1">≈ $ {(profit / rate).toFixed(2)} USD</p>
          )}
        </div>
        <div className="bg-card border border-neon/20 rounded-2xl p-5">
          <p className="text-xs text-muted mb-1">Meses Registrados</p>
          <p className="text-xl font-bold text-neon">{transactions.filter(t => t.type === "income").length > 0 ? "—" : "0"}</p>
        </div>
      </div>

      {/* Dashboard Matemático */}
      <ExponentialGrowthChart transactions={transactions} />

      {/* Info adicional */}
      <div className="mt-6 bg-card/50 border border-neon/10 rounded-xl p-4">
        <p className="text-sm text-muted">
          <span className="text-neon font-medium">💡 Dica:</span> O modelo matemático usa seus dados históricos para projetar tendências futuras.
          Quanto mais meses você registrar, mais precisa será a análise.
        </p>
      </div>
    </>
  );
}
