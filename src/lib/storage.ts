// ============================================
// storage.ts - Gerenciamento do localStorage com criptografia AES-GCM
// Protege dados sensíveis (transações, dados pessoais, CPFs) com criptografia
// Compatível com dados legados (base64) via migração automática
// ============================================

import {
  encrypt,
  decrypt,
  isCryptoAvailable,
  type EncryptedData,
} from "./crypto";

// Chave usada para guardar as transações no navegador
const STORAGE_KEY = "streamLedger_transactions";
const GOAL_KEY = "streamLedger_goal";

// Chave usada para guardar a meta financeira
const MIGRATION_KEY = "streamLedger_migrated_v2";

// ============================================
// Tipos
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

// ====================================
// Constantes de storage
// ====================================

const USER_KEY = "streamLedger_user";
const PARENT_KEY = "streamLedger_parent";
const PARENTAL_LINKS_KEY = "streamLedger_parental_links";
const AUDIT_KEY = "streamLedger_audit";

// ====================================
// Leitor universal com suporte a legado
// ====================================

/**
 * Lê e descriptografa dados do localStorage.
 * Suporta três formatos:
 * 1. { iv, data } — formato novo criptografado (AES-GCM)
 * 2. string base64 — formato antigo legado
 * 3. string JSON — formato plain (meta)
 */
async function readSecure<T>(key: string, fallback: T): Promise<T> {
  if (typeof window === "undefined") return fallback;

  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);

    // Formato novo criptografado: { iv, data, version }
    if (parsed && typeof parsed === "object" && "iv" in parsed && "data" in parsed) {
      if (isCryptoAvailable()) {
        const decrypted = await decrypt(parsed as EncryptedData);
        return JSON.parse(decrypted) as T;
      }
      return fallback;
    }

    // String base64 legado — tenta decodificar
    if (typeof parsed === "string") {
      try {
        const decoded = decodeURIComponent(escape(atob(parsed)));
        return JSON.parse(decoded) as T;
      } catch {
        return fallback;
      }
    }

    // JSON plain (meta, strings simples)
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * Salva dados com criptografia AES-GCM.
 * Cada escrita usa um IV único, garantindo segurança.
 */
async function writeSecure<T>(key: string, data: T): Promise<void> {
  if (typeof window === "undefined") return;

  if (!isCryptoAvailable()) {
    // Fallback: salva sem criptografia apenas se crypto falhar
    console.warn("[storage] Web Crypto indisponível — salvando sem criptografia");
    localStorage.setItem(key, JSON.stringify(data));
    return;
  }

  try {
    const encrypted = await encrypt(JSON.stringify(data));
    localStorage.setItem(key, JSON.stringify(encrypted));
  } catch (err) {
    console.error("[storage] Falha ao criptografar dados:", err);
    // Fallback: tenta salvar plain em caso de erro na crypto
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ====================================
// Migração de dados legados
// ====================================

/**
 * Migra dados do formato antigo (base64 ou plain) para o novo (AES-GCM).
 * Chamada uma única vez na inicialização da aplicação.
 * Marca os dados como migrados para evitar re-migração.
 */
export async function migrateToSecureStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isCryptoAvailable()) return;

  const alreadyMigrated = localStorage.getItem(MIGRATION_KEY);
  if (alreadyMigrated === "true") return;

  const migrationItems = [
    STORAGE_KEY,
    USER_KEY,
    PARENT_KEY,
    PARENTAL_LINKS_KEY,
    AUDIT_KEY,
    GOAL_KEY,
  ];

  for (const key of migrationItems) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      // Se já está no formato novo, pular
      if (parsed && typeof parsed === "object" && "iv" in parsed) continue;

      // Formato legado: base64 ou plain JSON — re-cryptografar
      let legacyJson: string;
      if (typeof parsed === "string") {
        try {
          legacyJson = decodeURIComponent(escape(atob(parsed)));
        } catch {
          legacyJson = parsed;
        }
      } else {
        legacyJson = JSON.stringify(parsed);
      }

      // Criptografa e salva no novo formato
      const encrypted = await encrypt(legacyJson);
      localStorage.setItem(key, JSON.stringify(encrypted));
    } catch {
      // Falha na migração de um item — ignora e mantém dado original
    }
  }

  localStorage.setItem(MIGRATION_KEY, "true");
}

// ====================================
// Transações
// ====================================

export async function getTransactions(): Promise<Transaction[]> {
  return readSecure<Transaction[]>(STORAGE_KEY, []);
}

export async function saveTransactions(transactions: Transaction[]): Promise<void> {
  await writeSecure(STORAGE_KEY, transactions);
}

// ====================================
// Meta Financeira
// ====================================

export async function getGoal(): Promise<string> {
  if (typeof window === "undefined") return "";

  const raw = localStorage.getItem(GOAL_KEY);
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);

    // Formato novo criptografado
    if (parsed && typeof parsed === "object" && "iv" in parsed) {
      if (isCryptoAvailable()) {
        const decrypted = await decrypt(parsed as EncryptedData);
        return decrypted.replace(/^"|"$/g, "");
      }
      return "";
    }

    // Formato antigo plain
    if (typeof parsed === "string") return parsed;
    return "";
  } catch {
    return "";
  }
}

export async function saveGoal(value: string): Promise<void> {
  await writeSecure(GOAL_KEY, value);
}

// ====================================
// Usuário Atual
// ====================================

export async function getCurrentUser(): Promise<StoredUser | null> {
  return readSecure<StoredUser | null>(USER_KEY, null);
}

export async function saveCurrentUser(user: StoredUser): Promise<void> {
  await writeSecure(USER_KEY, user);
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_KEY);
}

// ====================================
// Responsável Legal
// ====================================

export async function getParentAccount(): Promise<StoredParent | null> {
  return readSecure<StoredParent | null>(PARENT_KEY, null);
}

export async function saveParentAccount(parent: StoredParent): Promise<void> {
  await writeSecure(PARENT_KEY, parent);
}

export function clearParentAccount(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PARENT_KEY);
}

// ====================================
// Vínculos Parentais
// ====================================

export async function getParentalLinks(): Promise<StoredParentalLink[]> {
  return readSecure<StoredParentalLink[]>(PARENTAL_LINKS_KEY, []);
}

export async function saveParentalLinks(links: StoredParentalLink[]): Promise<void> {
  await writeSecure(PARENTAL_LINKS_KEY, links);
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

// ====================================
// Auditoria
// ====================================

export async function getAuditLog(): Promise<StoredAuditEntry[]> {
  return readSecure<StoredAuditEntry[]>(AUDIT_KEY, []);
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
  await writeSecure(AUDIT_KEY, entries);
}
