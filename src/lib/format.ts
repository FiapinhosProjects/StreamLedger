// ============================================
// format.ts - Funções de formatação de moeda
// Converte números para formato brasileiro (R$)
// ============================================

// Formata um número para o formato de moeda brasileira
// Exemplo: 1500.5 → "R$ 1.500,50"
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Converte o texto digitado no input para um número
// Exemplo: "1.500,00" → 1500.00
export function parseCurrencyInput(value: string): number {
  // Remove os pontos de milhar e troca vírgula por ponto
  const cleaned = value.replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

// Aplica a máscara de moeda enquanto o usuário digita
// Exemplo: "150000" → "1.500,00"
export function maskCurrency(value: string): string {
  // Remove tudo que não é número
  let digits = value.replace(/\D/g, "");

  if (!digits) return "";

  // Divide por 100 para ter as casas decimais
  const num = parseInt(digits, 10) / 100;

  // Formata no padrão brasileiro
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
