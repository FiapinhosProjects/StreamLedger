// ============================================
// sanitize.ts - Funções de segurança para inputs
// Protege contra ataques XSS (injeção de código)
// ============================================

// Escapa caracteres perigosos que poderiam executar código malicioso
// Exemplo: "<script>" → "&lt;script&gt;"
export function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// Remove qualquer tag HTML de uma string
// Exemplo: "<b>texto</b>" → "texto"
export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

// Limpa o texto do input antes de salvar
// Remove tags HTML e espaços extras no início/fim
export function sanitizeInput(input: string): string {
  return stripTags(input).trim();
}
