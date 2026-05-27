// ============================================
// calculations.ts - Funções de cálculo financeiro
// Soma valores por tipo, categoria, etc.
// ============================================

import { Transaction } from "./storage";

// Calcula o total de um tipo (receita ou despesa)
// Exemplo: getTotalByType(transacoes, "income") → soma de todas as receitas
export function getTotalByType(transactions: Transaction[], type: string): number {
  // Filtra só as transações do tipo desejado
  const filtered = transactions.filter((t) => t.type === type);

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Calcula o total de uma categoria específica dentro de um tipo
// Exemplo: getTotalByCategory(transacoes, "income", "Twitch Subs") → soma dos subs
export function getTotalByCategory(transactions: Transaction[], type: string, category: string): number {
  // Filtra por tipo E categoria
  const filtered = transactions.filter((t) => t.type === type && t.category === category);

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Calcula o total de um tipo, EXCLUINDO algumas categorias
// Útil para calcular "Outros" (tudo que não é Setup nem Software)
export function getTotalExcludingCategories(
  transactions: Transaction[],
  type: string,
  excludeCategories: string[]
): number {
  // Filtra por tipo e remove as categorias que não queremos
  const filtered = transactions.filter(
    (t) => t.type === type && !excludeCategories.includes(t.category)
  );

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Verifica se já existe uma transação igual (duplicada)
// Compara título, valor, tipo e categoria
export function isDuplicate(transactions: Transaction[], data: Omit<Transaction, "id" | "date">): boolean {
  return transactions.some(
    (t) =>
      t.title === data.title &&
      t.amount === data.amount &&
      t.type === data.type &&
      t.category === data.category
  );
}
