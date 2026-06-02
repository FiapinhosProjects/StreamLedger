// ============================================
// GoalTracker.tsx - Componente de meta financeira
// O usuário define uma meta e vê o progresso com base no lucro
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Transaction, getGoal, saveGoal } from "@/lib/storage";
import { getTotalByType } from "@/lib/calculations";
import { formatCurrency, maskCurrency, parseCurrencyInput } from "@/lib/format";

// Props do componente
// transactions: lista de transações para calcular o saldo
export default function GoalTracker({ transactions }: any) {
  // Valor digitado no input da meta
  const [goalInput, setGoalInput] = useState("");

  // Controla se mostra o resultado do cálculo
  const [showResult, setShowResult] = useState(false);

  // Quando o componente carrega, busca a meta salva no localStorage
  useEffect(() => {
    const saved = getGoal();
    if (saved) {
      setGoalInput(saved);
      setShowResult(true);
    }
  }, []);

  // Salva a meta e mostra o resultado
  const handleCalc = () => {
    saveGoal(goalInput);
    setShowResult(true);
  };

  // Calcula receitas, custos e saldo (lucro)
  const revenue = getTotalByType(transactions, "income");
  const costs = getTotalByType(transactions, "expense");
  const balance = revenue - costs;

  // Converte o texto da meta para número
  const goal = parseCurrencyInput(goalInput);

  // Monta o conteúdo do resultado baseado na situação
  let resultContent = null;

  if (showResult && goalInput) {
    if (!goal || goal <= 0) {
      // Meta inválida
      resultContent = <p className="text-yellow text-sm">Informe um valor de meta válido.</p>;
    } else if (transactions.length === 0) {
      // Sem transações registradas
      resultContent = <p className="text-muted text-sm">Registre transações para calcular o progresso.</p>;
    } else if (balance <= 0) {
      // Saldo negativo
      resultContent = (
        <p className="text-red text-sm">
          Seu saldo atual é {formatCurrency(balance)}. Você precisa de um lucro positivo para avançar em direção à meta.
        </p>
      );
    } else if (balance >= goal) {
      // Meta atingida!
      resultContent = <p className="text-neon text-sm">Meta atingida! Saldo atual: {formatCurrency(balance)}</p>;
    } else {
      // Em progresso - calcula porcentagem
      const progress = Math.round((balance / goal) * 100);
      const remaining = goal - balance;

      resultContent = (
        <div className="text-sm">
          <p className="mb-2">
            <strong className="text-neon">{progress}%</strong> da meta atingida
          </p>
          <p className="text-muted mb-2">
            Acumulado: {formatCurrency(balance)} | Faltam: {formatCurrency(remaining)}
          </p>
          {/* Barra de progresso */}
          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-neon rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      );
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="text-lg font-semibold mb-1">Meta Financeira</h3>
      <p className="text-sm text-muted mb-4">Defina uma meta e acompanhe seu progresso com base no lucro acumulado.</p>

      {/* Input da meta e botão calcular */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
        <div>
          <label htmlFor="goal-input" className="block text-sm text-muted mb-1">Meta (R$)</label>
          <input
            id="goal-input"
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(maskCurrency(e.target.value))}
            placeholder="0,00"
            className="w-48 rounded-lg border border-neon/20 bg-header px-3 py-2 text-sm outline-none focus:border-neon/50"
          />
        </div>
        <button
          onClick={handleCalc}
          className="px-4 py-2 text-sm rounded-lg bg-neon text-background font-semibold hover:opacity-80 active:scale-95 transition-all duration-200"
        >
          Calcular
        </button>
      </div>

      {/* Resultado do cálculo */}
      {resultContent && <div className="mt-4">{resultContent}</div>}
    </div>
  );
}
