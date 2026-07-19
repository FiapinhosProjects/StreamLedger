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

// ============================================
// Autenticação e Verificação de Idade
// Conforme Lei Felca
// ============================================

// Chaves de storage para autenticação
const USER_KEY = "streamLedger_user";
const PARENT_KEY = "streamLedger_parent";
const PARENTAL_LINKS_KEY = "streamLedger_parental_links";
const AUDIT_KEY = "streamLedger_audit";

// Usuário atual verificado
export interface StoredUser {
  cpf: string;
  nome: string;
  email: string;
  birthDate: string;
  ageGroup: "adult" | "minor_16_17" | "minor_under_16";
  govBrLevel: "bronze" | "prata" | "ouro";
  consentGiven: boolean;
  consentTimestamp?: string;
  linkedParentId?: string;
  verified: boolean;
  verifiedAt: string;
}

export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: StoredUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
}

// Responsável legal
export interface StoredParent {
  id: string;
  cpf: string;
  nome: string;
  email: string;
  govBrLevel: "bronze" | "prata" | "ouro";
  linkedMinors: string[];
  notificationPrefs?: {
    alertAllTransactions: boolean;
    threshold: number;
    emailEnabled: boolean;
  };
  createdAt: string;
}

export function getParentAccount(): StoredParent | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(PARENT_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveParentAccount(parent: StoredParent) {
  localStorage.setItem(PARENT_KEY, JSON.stringify(parent));
}

export function clearParentAccount() {
  localStorage.removeItem(PARENT_KEY);
}

// Vínculos parentais
export interface StoredParentalLink {
  id: string;
  parentId: string;
  minorCpf: string;
  minorName: string;
  minorEmail: string;
  minorAge: number;
  minorBirthDate: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  linkCode: string;
  createdAt: string;
  acceptedAt?: string;
  expiresAt: string;
}

export function getParentalLinks(): StoredParentalLink[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PARENTAL_LINKS_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveParentalLinks(links: StoredParentalLink[]) {
  localStorage.setItem(PARENTAL_LINKS_KEY, JSON.stringify(links));
}

export function addParentalLink(link: StoredParentalLink) {
  const links = getParentalLinks();
  links.push(link);
  saveParentalLinks(links);
}

export function updateParentalLink(id: string, updates: Partial<StoredParentalLink>) {
  const links = getParentalLinks();
  const index = links.findIndex((l) => l.id === id);
  if (index !== -1) {
    links[index] = { ...links[index], ...updates };
    saveParentalLinks(links);
  }
}

// Auditoria
export interface StoredAuditEntry {
  id: string;
  timestamp: string;
  cpf: string;
  userType: "minor" | "adult" | "parent";
  action: string;
  details: Record<string, unknown>;
  parentalLinkId?: string;
}

export function getAuditLog(): StoredAuditEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(AUDIT_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addAuditEntry(entry: Omit<StoredAuditEntry, "id" | "timestamp">) {
  const entries = getAuditLog();
  entries.push({
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
}
