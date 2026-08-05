// ============================================
// secureStorage.ts - Storage Criptografado
// Wrapper sobre localStorage com criptografia AES-GCM
// Backwards compatible com storage.ts original
// ============================================

import {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  isCryptoAvailable,
  type EncryptedData,
} from "./crypto";

// ============================================
// Constantes (mesmas do storage.ts original)
// ============================================

const STORAGE_KEY = "streamLedger_transactions";
const GOAL_KEY = "streamLedger_goal";
const USER_KEY = "streamLedger_user";
const PARENT_KEY = "streamLedger_parent";
const PARENTAL_LINKS_KEY = "streamLedger_parental_links";
const AUDIT_KEY = "streamLedger_audit";

// ============================================
// Tipos (mesmos do storage.ts original)
// ============================================

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

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

export interface StoredAuditEntry {
  id: string;
  timestamp: string;
  cpf: string;
  userType: "minor" | "adult" | "parent";
  action: string;
  details: Record<string, unknown>;
  parentalLinkId?: string;
}

// ============================================
// Funções de Storage Criptografado
// ============================================

/**
 * Salva dados criptografados no localStorage
 * Fallback para dados não criptografados se crypto não disponível
 */
async function secureSet(key: string, data: unknown): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    if (isCryptoAvailable()) {
      const encrypted = await encryptObject(data);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } else {
      // Fallback: salva sem criptografia (não recomendado)
      console.warn("Crypto não disponível, salvando sem criptografia");
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error(`Erro ao salvar dados seguros em ${key}:`, error);
    // Tenta salvar sem criptografia como fallback
    localStorage.setItem(key, JSON.stringify(data));
  }
}

/**
 * Recupera dados descriptografados do localStorage
 * Suporta tanto dados novos (criptografados) quanto antigos (plain JSON)
 */
async function secureGet<T>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  const data = localStorage.getItem(key);
  if (!data) return null;

  try {
    // Tenta primeiro como dados criptografados
    const parsed = JSON.parse(data);

    if (parsed && typeof parsed === "object" && "iv" in parsed && "data" in parsed) {
      // É formato criptografado
      if (isCryptoAvailable()) {
        return await decryptObject<T>(parsed as EncryptedData);
      } else {
        console.warn("Crypto não disponível para descriptografar");
        return null;
      }
    }

    // É formato antigo (plain JSON) - retorna diretamente
    return parsed as T;
  } catch {
    return null;
  }
}

// ============================================
// Transações (mantém interface original)
// ============================================

export async function getTransactions(): Promise<Transaction[]> {
  return (await secureGet<Transaction[]>(STORAGE_KEY)) || [];
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await secureSet(STORAGE_KEY, transactions);
}

// ============================================
// Meta Financeira
// ============================================

export async function getGoal(): Promise<string> {
  const value = await secureGet<string>(GOAL_KEY);
  return value || "";
}

export async function saveGoal(value: string): Promise<void> {
  await secureSet(GOAL_KEY, value);
}

// ============================================
// Usuário Atual
// ============================================

export async function getCurrentUser(): Promise<StoredUser | null> {
  return await secureGet<StoredUser>(USER_KEY);
}

export async function saveCurrentUser(user: StoredUser): Promise<void> {
  await secureSet(USER_KEY, user);
}

export async function clearCurrentUser(): Promise<void> {
  localStorage.removeItem(USER_KEY);
}

// ============================================
// Responsável Legal
// ============================================

export async function getParentAccount(): Promise<StoredParent | null> {
  return await secureGet<StoredParent>(PARENT_KEY);
}

export async function saveParentAccount(parent: StoredParent): Promise<void> {
  await secureSet(PARENT_KEY, parent);
}

export async function clearParentAccount(): Promise<void> {
  localStorage.removeItem(PARENT_KEY);
}

// ============================================
// Vínculos Parentais
// ============================================

export async function getParentalLinks(): Promise<StoredParentalLink[]> {
  return (await secureGet<StoredParentalLink[]>(PARENTAL_LINKS_KEY)) || [];
}

export async function saveParentalLinks(links: StoredParentalLink[]): Promise<void> {
  await secureSet(PARENTAL_LINKS_KEY, links);
}

export async function addParentalLink(link: StoredParentalLink): Promise<void> {
  const links = await getParentalLinks();
  links.push(link);
  await saveParentalLinks(links);
}

export async function updateParentalLink(
  id: string,
  updates: Partial<StoredParentalLink>
): Promise<void> {
  const links = await getParentalLinks();
  const index = links.findIndex((l) => l.id === id);
  if (index !== -1) {
    links[index] = { ...links[index], ...updates };
    await saveParentalLinks(links);
  }
}

// ============================================
// Auditoria
// ============================================

export async function getAuditLog(): Promise<StoredAuditEntry[]> {
  return (await secureGet<StoredAuditEntry[]>(AUDIT_KEY)) || [];
}

export async function addAuditEntry(
  entry: Omit<StoredAuditEntry, "id" | "timestamp">
): Promise<void> {
  const entries = await getAuditLog();
  entries.push({
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  });
  await secureSet(AUDIT_KEY, entries);
}

// ============================================
// Migração de dados existentes
// ============================================

/**
 * Migra dados do storage antigo (não criptografado) para o novo (criptografado)
 * Deve ser chamado uma única vez na inicialização da aplicação
 */
export async function migrateExistingData(): Promise<void> {
  if (typeof window === "undefined") return;

  // Migra transações
  const oldTxData = localStorage.getItem(STORAGE_KEY);
  if (oldTxData) {
    try {
      const parsed = JSON.parse(oldTxData);
      // Verifica se não está no formato novo
      if (!(parsed && typeof parsed === "object" && "iv" in parsed)) {
        await saveTransactions(parsed);
      }
    } catch {
      // Ignora erros de parse
    }
  }

  // Migra meta
  const oldGoal = localStorage.getItem(GOAL_KEY);
  if (oldGoal) {
    try {
      const parsed = JSON.parse(oldGoal);
      if (typeof parsed === "string") {
        await saveGoal(parsed);
      }
    } catch {
      // Ignora
    }
  }
}
