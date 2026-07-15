// ============================================
// cpfValidation.ts - Validação de CPF e cálculo de idade
// Algoritmo público para verificação conforme Lei Felca
// ============================================

import type { AgeGroup, CPFValidationResult } from "./user-types";

/**
 * Valida o formato e dígitos verificadores do CPF
 * Retorna true se o CPF é válido matematicamente
 */
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, "");

  // CPF deve ter 11 dígitos
  if (numbers.length !== 11) return false;

  // Não pode ter todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1+$/.test(numbers)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  const firstDigit = (sum * 10) % 11;
  const expectedFirst = firstDigit === 10 ? 0 : firstDigit;
  if (expectedFirst !== parseInt(numbers[9])) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  const secondDigit = (sum * 10) % 11;
  const expectedSecond = secondDigit === 10 ? 0 : secondDigit;
  if (expectedSecond !== parseInt(numbers[10])) return false;

  return true;
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const numbers = cpf.replace(/\D/g, "");
  if (numbers.length !== 11) return cpf;
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Calcula a idade a partir da data de nascimento
 * @param birthDate - Data no formato DD/MM/YYYY
 * @returns Idade em anos
 */
export function calculateAge(birthDate: string): number {
  const [day, month, year] = birthDate.split("/").map(Number);
  const today = new Date();

  // Se a data é inválida, retorna 0
  if (isNaN(day) || isNaN(month) || isNaN(year)) return 0;

  let age = today.getFullYear() - year;

  // Ajusta se ainda não fez aniversário este ano
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  if (todayMonth < month - 1 || (todayMonth === month - 1 && todayDay < day)) {
    age--;
  }

  return age < 0 ? 0 : age;
}

/**
 * Classifica o usuário por faixa etária
 * @param age - Idade em anos
 * @returns Classificação: adulto (18+), menor 16-17, menor <16
 */
export function classifyUser(age: number): AgeGroup {
  if (age >= 18) return "adult";
  if (age >= 16) return "minor_16_17";
  return "minor_under_16";
}

/**
 * Valida CPF e retorna detalhes (mock para protótipo)
 * Em produção, isso chamaria API da Receita Federal
 */
export function validateCPFWithData(cpf: string): CPFValidationResult {
  if (!validateCPF(cpf)) {
    return {
      valid: false,
      errorCode: cpf.replace(/\D/g, "").length !== 11 ? "INVALID_FORMAT" : "INVALID_CHECKSUM",
    };
  }

  // Mock: Em produção, buscaria dados reais na Receita Federal
  // Por ora, retornamos que é válido mas sem dados extras
  return {
    valid: true,
    data: {
      nome: "", // Preenchido pelo usuário
      dataNascimento: "", // Extraído do formulário
      situacao: "regular",
    },
  };
}

/**
 * Gera data de nascimento aleatória para testes
 * Usada apenas no mock Gov.br
 */
export function generateRandomBirthDate(ageGroup: AgeGroup): string {
  const today = new Date();
  let age: number;

  switch (ageGroup) {
    case "adult":
      age = Math.floor(Math.random() * 40) + 25; // 25-64 anos
      break;
    case "minor_16_17":
      age = 16 + Math.floor(Math.random() * 2); // 16-17
      break;
    case "minor_under_16":
      age = Math.floor(Math.random() * 15) + 1; // 1-15
      break;
  }

  const year = today.getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;

  return `${day.toString().padStart(2, "0")}/${month.toString().padStart(2, "0")}/${year}`;
}

/**
 * Gera código de 6 dígitos para vínculo parental
 */
export function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verifica se um link de convite expirou
 */
export function isLinkExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Gera data de expiração (7 dias a partir de agora)
 */
export function generateExpirationDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString();
}
