const ENCRYPTION_KEY_STORAGE = "streamLedger_encryption_key";
const SALT_STORAGE = "streamLedger_salt";

// Tipos exportados
export interface EncryptedData {
  iv: string;      // Initialization Vector (base64)
  data: string;    // Dados cifrados (base64)
  version: number;  // Versão do esquema de criptografia
}

export interface CryptoConfig {
  algorithm: "AES-GCM";
  keyLength: 256;
  ivLength: 12;    // 96 bits recomendado para AES-GCM
}

/**
 * Configuração do algoritmo de criptografia
 */
export const CRYPTO_CONFIG: CryptoConfig = {
  algorithm: "AES-GCM",
  keyLength: 256,
  ivLength: 12,
};

/**
 * Gera um vetor de inicialização (IV) aleatório
 * Cada operação de criptografia deve usar um IV único
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.ivLength));
}

/**
 * Deriva uma chave de criptografia a partir de uma senha usando PBKDF2
 * @param password - Senha base para derivar a chave
 * @param salt - Salt aleatório
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  // Cria nova cópia do ArrayBuffer para garantir tipo correto
  const saltCopy = new Uint8Array(salt).buffer;

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltCopy as ArrayBuffer,
      iterations: 100000, // NIST recomenda mínimo de 10.000, usamos 100.000
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: CRYPTO_CONFIG.keyLength },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Obtém ou cria a chave de criptografia
 * A chave é derivada de um identificador único do dispositivo
 */
async function getOrCreateKey(): Promise<CryptoKey> {
  // Tenta recuperar salt existente
  const storedSalt = localStorage.getItem(SALT_STORAGE);
  let salt: Uint8Array;

  if (storedSalt) {
    // Converte base64 para Uint8Array
    const saltBinary = atob(storedSalt);
    salt = new Uint8Array(saltBinary.length);
    for (let i = 0; i < saltBinary.length; i++) {
      salt[i] = saltBinary.charCodeAt(i);
    }
  } else {
    // Gera novo salt
    salt = crypto.getRandomValues(new Uint8Array(16));
    // Armazena salt (base64)
    localStorage.setItem(SALT_STORAGE, btoa(String.fromCharCode(...salt)));
  }

  // Identificador único do dispositivo
  // Combina características do navegador + salt para criar uma "senha" base
  const deviceId = await generateDeviceId();
  const password = deviceId + "_streamledger_secure";

  return deriveKey(password, salt);
}

/**
 * Gera um identificador único para o dispositivo
 * Usa múltiplas fontes para aumentar a entropia
 */
async function generateDeviceId(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
  ];

  const data = components.join("|");
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));

  // Converte para hex
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Criptografa dados usando AES-GCM
 * @param plainText - Texto plano para criptografar
 * @returns Dados criptografados com IV
 */
export async function encrypt(plainText: string): Promise<EncryptedData> {
  if (!plainText) {
    return { iv: "", data: "", version: 1 };
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const iv = generateIV();
    const key = await getOrCreateKey();

    // Cria nova cópia do ArrayBuffer para garantir tipo correto
    const ivCopy = new Uint8Array(iv).buffer;

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: ivCopy as ArrayBuffer },
      key,
      data
    );

    // Converte para base64
    const encryptedArray = new Uint8Array(encryptedBuffer);

    return {
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...encryptedArray)),
      version: 1,
    };
  } catch (error) {
    console.error("Erro ao criptografar:", error);
    throw new Error("Falha na criptografia dos dados");
  }
}

/**
 * Descriptografa dados usando AES-GCM
 * @param encryptedData - Dados criptografados
 * @returns Texto plano original
 */
export async function decrypt(encryptedData: EncryptedData): Promise<string> {
  if (!encryptedData.data || !encryptedData.iv) {
    return "";
  }

  try {
    // Converte de base64
    const iv = new Uint8Array(
      atob(encryptedData.iv).split("").map(c => c.charCodeAt(0))
    );
    const encryptedArray = new Uint8Array(
      atob(encryptedData.data).split("").map(c => c.charCodeAt(0))
    );

    // Cria nova cópia do ArrayBuffer para garantir tipo correto
    const ivCopy = new Uint8Array(iv).buffer;
    const encryptedBufferCopy = new Uint8Array(encryptedArray).buffer;

    const key = await getOrCreateKey();

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivCopy as ArrayBuffer },
      key,
      encryptedBufferCopy as ArrayBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Erro ao descriptografar:", error);
    throw new Error("Falha na descriptografia dos dados");
  }
}

/**
 * Criptografa um objeto JSON
 * @param obj - Objeto para criptografar
 * @returns Dados criptografados
 */
export async function encryptObject<T>(obj: T): Promise<EncryptedData> {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Descriptografa para um objeto
 * @param encryptedData - Dados criptografados
 * @returns Objeto original
 */
export async function decryptObject<T>(encryptedData: EncryptedData): Promise<T> {
  const json = await decrypt(encryptedData);
  return JSON.parse(json);
}

/**
 * Verifica se a criptografia está disponível no navegador
 */
export function isCryptoAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    window.crypto &&
    window.crypto.subtle &&
    typeof crypto.getRandomValues === "function"
  );
}

/**
 * Limpa todos os dados de criptografia (útil para logout completo)
 */
export function clearCryptoData(): void {
  localStorage.removeItem(ENCRYPTION_KEY_STORAGE);
  localStorage.removeItem(SALT_STORAGE);
}

/**
 * Migra dados antigos (sem criptografia) para o novo formato
 * Usado para manter compatibilidade com dados existentes
 */
export async function migrateToEncrypted<T>(
  oldData: T,
  storageKey: string
): Promise<T> {
  // Se já está no formato novo, retorna
  const currentData = localStorage.getItem(storageKey);
  if (currentData) {
    try {
      const parsed = JSON.parse(currentData);
      if (parsed.iv !== undefined && parsed.data !== undefined) {
        return oldData; // Já está criptografado
      }
    } catch {
      // Não é JSON válido, continua com migração
    }
  }

  // Criptografa e salva no novo formato
  const encrypted = await encryptObject(oldData);
  localStorage.setItem(storageKey, JSON.stringify(encrypted));
  return oldData;
}
