// ============================================
// storage.ts - Gerenciamento do localStorage
// Salva e recupera transações e metas do usuário
// ============================================

// Chave usada para guardar as transações no navegador
const STORAGE_KEY = "streamLedger_transactions";

// Chave usada para guardar a meta financeira
const GOAL_KEY = "streamLedger_goal";

// Tipo que define a estrutura de uma transação
export interface Transaction {
  id: number;        // Identificador único (gerado com Date.now)
  title: string;     // Descrição da transação (ex: "Doação Twitch")
  amount: number;    // Valor em reais
  type: "income" | "expense"; // Tipo: receita ou despesa
  category: string;  // Categoria (ex: "Setup", "Twitch Subs")
  date: string;      // Data formatada (ex: "26/05/2026")
}

// Busca todas as transações salvas no localStorage
// Os dados são salvos em base64 para proteção básica
export function getTransactions(): Transaction[] {
  // Se estiver no servidor (SSR), retorna vazio
  if (typeof window === "undefined") return [];

  const data = localStorage.getItem(STORAGE_KEY);

  // Se não tem nada salvo, retorna lista vazia
  if (!data) return [];

  try {
    // Tenta decodificar de base64 primeiro
    const decoded = decodeURIComponent(escape(atob(data)));
    return JSON.parse(decoded);
  } catch {
    // Se não for base64, tenta ler como JSON normal (compatibilidade)
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }
}

// Salva a lista de transações no localStorage (codificada em base64)
export function saveTransactions(transactions: Transaction[]) {
  const json = JSON.stringify(transactions);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  localStorage.setItem(STORAGE_KEY, encoded);
}

// Busca a meta financeira salva no localStorage
export function getGoal(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GOAL_KEY) || "";
}

// Salva a meta financeira no localStorage
export function saveGoal(value: string) {
  localStorage.setItem(GOAL_KEY, value);
}
