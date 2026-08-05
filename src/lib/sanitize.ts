// ============================================
// sanitize.ts - Funções de segurança para inputs
// Protege contra ataques XSS (injeção de código)
// Agora usa o módulo validation.ts para validação robusta
// ============================================

import { sanitizeForStorage, sanitizeForDisplay } from "./validation";

// Escapa caracteres perigosos que poderiam executar código malicioso
// Exemplo: "<script>" → "&lt;script&gt;"
// Para exibição segura, usa validação avançada
export function sanitize(input: string): string {
  return sanitizeForDisplay(input);
}

// Remove qualquer tag HTML de uma string
// Exemplo: "<b>texto</b>" → "texto"
export function stripTags(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input.replace(/<[^>]*>/g, "").replace(/&[#\w]+;/g, "");
}

// Limpa o texto do input antes de salvar
// Remove tags HTML e espaços extras no início/fim
export function sanitizeInput(input: string): string {
  return sanitizeForStorage(input);
}
