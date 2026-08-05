// ============================================
// validation.ts - Módulo de Validação e Sanitização Robusta
// Protege contra XSS, injeção, e dados maliciosos
// Complementa sanitize.ts existente
// ============================================

// ============================================
// Constantes de Validação
// ============================================

export const VALIDATION_RULES = {
  // Limites de tamanho
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_CATEGORY_LENGTH: 50,

  // Limites de valores monetários
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 999999999.99,

  // Limites de transação
  MAX_TRANSACTIONS_PER_USER: 10000,

  // Patterns
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  CPF_PATTERN: /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/,
  SAFE_TEXT_PATTERN: /^[\w\sÀ-ÿ.,;:!?@#$%&*()\-_+=\[\]{}|\\\/<>"']+$/u,
} as const;

// ============================================
// Tipos
// ============================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SanitizedInput {
  value: string;
  sanitized: boolean;
  threats: string[];
}

// ============================================
// Sanitização Avançada
// ============================================

/**
 * Detecta ameaças conhecidas em uma string
 */
function detectThreats(input: string): string[] {
  const threats: string[] = [];
  const lower = input.toLowerCase();

  // Padrões de XSS
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /data:/i,
    /vbscript:/i,
  ];

  xssPatterns.forEach((pattern) => {
    if (pattern.test(input)) {
      threats.push("XSS_PATTERN");
    }
  });

  // Prototype Pollution
  if (lower.includes("__proto__") || lower.includes("constructor")) {
    threats.push("PROTOTYPE_POLLUTION");
  }

  // Null byte injection
  if (input.includes("\0")) {
    threats.push("NULL_BYTE_INJECTION");
  }

  // HTML entities suspeitas
  const entityPattern = /&[#\w]+;?/gi;
  if (entityPattern.test(input) && input.includes("<")) {
    threats.push("ENCODED_XSS");
  }

  // String vazia ou só espaços
  if (input.trim().length === 0) {
    threats.push("EMPTY_INPUT");
  }

  return threats;
}

/**
 * Remove caracteres de controle e Unicode problemático
 */
function removeControlCharacters(input: string): string {
  // Remove caracteres de controle (exceto tab, newline, carriage return)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Normaliza Unicode (NFC normalization)
 */
function normalizeUnicode(input: string): string {
  // Usa NFC para normalizar caracteres Unicode
  return input.normalize("NFC");
}

/**
 * Escapa caracteres HTML de forma completa
 */
function escapeHtml(input: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  return input.replace(/[&<>"'`=/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Remove tags HTML completamente
 */
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove tags
    .replace(/&[#\w]+;/g, ""); // Remove entidades HTML
}

// ============================================
// Funções Exportadas
// ============================================

/**
 * Sanitiza entrada de texto para exibição segura
 * Remove XSS, normaliza, e limpa caracteresproblemáticos
 */
export function sanitizeForDisplay(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // 1. Remove caracteres de controle
  sanitized = removeControlCharacters(sanitized);

  // 2. Normaliza Unicode
  sanitized = normalizeUnicode(sanitized);

  // 3. Remove tags HTML
  sanitized = stripHtml(sanitized);

  // 4. Escapa caracteres HTML residuais
  sanitized = escapeHtml(sanitized);

  // 5. Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Sanitiza entrada para armazenamento (menos agressivo)
 * Remove apenas código ativo, mantém formatação básica
 */
export function sanitizeForStorage(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  let sanitized = input;

  // 1. Remove caracteres de controle
  sanitized = removeControlCharacters(sanitized);

  // 2. Normaliza Unicode
  sanitized = normalizeUnicode(sanitized);

  // 3. Remove tags HTML
  sanitized = stripHtml(sanitized);

  // 4. Remove padrões XSS conhecidos
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+\s*=\s*["']?[^"']*["']?/gi, "") // Remove event handlers
    .replace(/javascript\s*:/gi, "")
    .replace(/data\s*:\s*text\/html/gi, "");

  // 5. Trim
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Valida e sanitiza título de transação
 */
export function validateAndSanitizeTitle(title: string): ValidationResult {
  const errors: string[] = [];

  if (!title || typeof title !== "string") {
    return { valid: false, errors: ["Título é obrigatório"] };
  }

  const sanitized = sanitizeForStorage(title);

  if (sanitized.length < 2) {
    errors.push("Título deve ter pelo menos 2 caracteres");
  }

  if (sanitized.length > VALIDATION_RULES.MAX_TITLE_LENGTH) {
    errors.push(`Título deve ter no máximo ${VALIDATION_RULES.MAX_TITLE_LENGTH} caracteres`);
  }

  // Verifica se contém threats
  const threats = detectThreats(sanitized);
  if (threats.length > 0) {
    errors.push("Título contém caracteres inválidos");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida e sanitiza valor monetário
 * IMPORTANTE: Não aceita valores negativos ou zero
 */
export function validateAmount(amount: number | string): ValidationResult {
  const errors: string[] = [];

  let numericAmount: number;

  if (typeof amount === "string") {
    numericAmount = parseCurrencyValue(amount);
  } else {
    numericAmount = amount;
  }

  if (isNaN(numericAmount)) {
    return { valid: false, errors: ["Valor inválido"] };
  }

  // CRÍTICO: Não aceita valores negativos ou zero
  if (numericAmount <= 0) {
    errors.push("Valor deve ser maior que zero");
  }

  // Limites de segurança
  if (numericAmount < VALIDATION_RULES.MIN_AMOUNT) {
    errors.push(`Valor mínimo é R$ ${VALIDATION_RULES.MIN_AMOUNT.toFixed(2)}`);
  }

  if (numericAmount > VALIDATION_RULES.MAX_AMOUNT) {
    errors.push(`Valor máximo é R$ ${VALIDATION_RULES.MAX_AMOUNT.toLocaleString("pt-BR")}`);
  }

  // Verifica se tem muitas casas decimais
  const decimalPlaces = (numericAmount.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2) {
    errors.push("Valor não pode ter mais de 2 casas decimais");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Converte string de moeda brasileira para número
 * Ex: "R$ 1.500,00" → 1500.00
 */
export function parseCurrencyValue(value: string): number {
  if (!value || typeof value !== "string") {
    return 0;
  }

  // Remove R$, espaços, e normaliza
  let cleaned = value
    .replace(/R\$\s*/g, "")
    .replace(/\s/g, "")
    .trim();

  // No formato brasileiro: 1.500,00 → 1500.00
  // Remove pontos de milhar
  cleaned = cleaned.replace(/\./g, "");
  // Substitui vírgula por ponto
  cleaned = cleaned.replace(",", ".");

  const result = parseFloat(cleaned);

  return isNaN(result) ? 0 : result;
}

/**
 * Valida categoria
 */
export function validateCategory(category: string): ValidationResult {
  const errors: string[] = [];

  if (!category || typeof category !== "string") {
    return { valid: false, errors: ["Categoria é obrigatória"] };
  }

  const sanitized = sanitizeForStorage(category);

  if (sanitized.length < 1) {
    errors.push("Categoria é obrigatória");
  }

  if (sanitized.length > VALIDATION_RULES.MAX_CATEGORY_LENGTH) {
    errors.push(`Categoria deve ter no máximo ${VALIDATION_RULES.MAX_CATEGORY_LENGTH} caracteres`);
  }

  // Lista de categorias válidas
  const validCategories = [
    "Twitch Subs",
    "YouTube AdSense",
    "Donates",
    "Setup",
    "Software",
    "Geral",
  ];

  // Apenas verifica se é uma das categorias válidas
  // (para outros valores, ainda é válido mas pode não ser reconhecido)
  const isKnownCategory = validCategories.some(
    (c) => c.toLowerCase() === sanitized.toLowerCase()
  );

  if (!isKnownCategory && sanitized.length > 0) {
    // Não é erro, mas pode não ser reconhecido pelo sistema
    // Aceita categorias customizadas desde que seguras
    const threats = detectThreats(sanitized);
    if (threats.length > 0) {
      errors.push("Categoria contém caracteres inválidos");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== "string") {
    return { valid: false, errors: ["Email é obrigatório"] };
  }

  const sanitized = email.trim().toLowerCase();

  if (!VALIDATION_RULES.EMAIL_PATTERN.test(sanitized)) {
    errors.push("Email inválido");
  }

  if (sanitized.length > 254) {
    errors.push("Email muito longo");
  }

  // Verifica threats
  const threats = detectThreats(sanitized);
  if (threats.length > 0) {
    errors.push("Email contém caracteres inválidos");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida data no formato brasileiro
 */
export function validateDate(dateStr: string): ValidationResult {
  const errors: string[] = [];

  if (!dateStr || typeof dateStr !== "string") {
    return { valid: false, errors: ["Data é obrigatória"] };
  }

  const pattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(pattern);

  if (!match) {
    return { valid: false, errors: ["Data deve estar no formato DD/MM/AAAA"] };
  }

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    errors.push("Mês inválido");
  }

  if (day < 1 || day > 31) {
    errors.push("Dia inválido");
  }

  const currentYear = new Date().getFullYear();
  if (year < 1900 || year > currentYear) {
    errors.push(`Ano deve estar entre 1900 e ${currentYear}`);
  }

  // Verifica data válida (ex: 31/02 não existe)
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    errors.push("Data inválida");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida objeto de transação completo
 */
export function validateTransaction(data: {
  title?: string;
  amount?: number | string;
  type?: string;
  category?: string;
}): ValidationResult {
  const allErrors: string[] = [];

  // Valida título
  if (data.title !== undefined) {
    const titleResult = validateAndSanitizeTitle(data.title);
    allErrors.push(...titleResult.errors.map((e) => `Título: ${e}`));
  }

  // Valida valor
  if (data.amount !== undefined) {
    const amountResult = validateAmount(data.amount);
    allErrors.push(...amountResult.errors.map((e) => `Valor: ${e}`));
  }

  // Valida tipo
  if (data.type !== undefined) {
    if (data.type !== "income" && data.type !== "expense") {
      allErrors.push("Tipo deve ser 'income' ou 'expense'");
    }
  }

  // Valida categoria
  if (data.category !== undefined) {
    const categoryResult = validateCategory(data.category);
    allErrors.push(...categoryResult.errors.map((e) => `Categoria: ${e}`));
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Escapa string para uso em SQL (se aplicável no futuro)
 * Mesmo sendo client-side, boa prática
 */
export function escapeForSql(input: string): string {
  if (!input) return "";

  return input
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x1a/g, "\\Z");
}

/**
 * Verifica se uma string contém apenas caracteres seguros
 */
export function isSafeText(input: string): boolean {
  if (!input) return false;

  const sanitized = sanitizeForStorage(input);
  return sanitized.length > 0 && detectThreats(sanitized).length === 0;
}

/**
 * Limita string a um tamanho máximo
 */
export function truncate(input: string, maxLength: number): string {
  if (!input) return "";
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + "...";
}
