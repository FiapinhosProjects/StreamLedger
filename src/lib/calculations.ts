import { Transaction } from "./storage";

// Calcula o total de um tipo (receita ou despesa)
// Exemplo: getTotalByType(transacoes, "income") → soma de todas as receitas
export function getTotalByType(transactions: Transaction[], type: string): number {
  // Filtra só as transações do tipo desejado
  const filtered = transactions.filter((t) => t.type === type);

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Calcula o total de uma categoria específica dentro de um tipo
// Exemplo: getTotalByCategory(transacoes, "income", "Twitch Subs") → soma dos subs
export function getTotalByCategory(transactions: Transaction[], type: string, category: string): number {
  // Filtra por tipo E categoria
  const filtered = transactions.filter((t) => t.type === type && t.category === category);

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Calcula o total de um tipo, EXCLUINDO algumas categorias
// Útil para calcular "Outros" (tudo que não é Setup nem Software)
export function getTotalExcludingCategories(
  transactions: Transaction[],
  type: string,
  excludeCategories: string[]
): number {
  // Filtra por tipo e remove as categorias que não queremos
  const filtered = transactions.filter(
    (t) => t.type === type && !excludeCategories.includes(t.category)
  );

  // Soma todos os valores
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);

  return total;
}

// Verifica se já existe uma transação igual (duplicada)
// Compara título, valor, tipo e categoria
export function isDuplicate(transactions: Transaction[], data: Omit<Transaction, "id" | "date">): boolean {
  return transactions.some(
    (t) =>
      t.title === data.title &&
      t.amount === data.amount &&
      t.type === data.type &&
      t.category === data.category
  );
}

// ============================================================
// DASHBOARD MATEMÁTICO — Modelagem de crescimento exponencial
// ============================================================
//
// Modelo utilizado:
//
//   R(t) = R0 * e^(k*t)
//
//   R(t) → faturamento estimado no mês "t"
//   R0   → faturamento inicial (mês 0), obtido pela regressão
//   k    → taxa de crescimento contínua (mês a mês)
//   t    → tempo em meses, a partir do primeiro mês da série
//
// Como R(t) é uma exponencial, aplicamos logaritmo natural para
// transformar o modelo em uma reta (linearização):
//
//   ln(R(t)) = ln(R0) + k*t   →   y = b + k*t
//
// Com essa forma linear, usamos regressão linear (mínimos quadrados)
// sobre os pontos (t, ln(R(t))) para estimar "k" (coeficiente angular)
// e "b = ln(R0)" (coeficiente linear).

export interface MonthlyTotal {
  month: string; // formato "MM/AAAA"
  total: number;
}

export interface ExponentialModel {
  r0: number; // faturamento inicial estimado (R0)
  k: number; // taxa de crescimento contínua por mês
  monthlyGrowthRate: number; // taxa equivalente em % ao mês: (e^k - 1) * 100
  doublingTime: number | null; // tempo (em meses) para o valor dobrar: ln(2)/k
  rSquared: number; // qualidade do ajuste (0 a 1) sobre os pontos linearizados
}

// Agrupa as transações de um tipo por mês (MM/AAAA), somando os valores.
// Datas são armazenadas como "DD/MM/AAAA".
// Exemplo: getMonthlyTotals(transacoes, "income") →
//   [{ month: "07/2026", total: 800 }, { month: "08/2026", total: 1200 }, ...]
export function getMonthlyTotals(transactions: Transaction[], type: string): MonthlyTotal[] {
  const totalsByMonth = new Map<string, number>();

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const parts = t.date.split("/"); // [DD, MM, AAAA]
      if (parts.length !== 3) return;
      const monthKey = `${parts[1]}/${parts[2]}`;
      totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + t.amount);
    });

  // Ordena cronologicamente (AAAA-MM) antes de retornar
  return Array.from(totalsByMonth.entries())
    .sort(([a], [b]) => {
      const [ma, ya] = a.split("/");
      const [mb, yb] = b.split("/");
      return `${ya}${ma}`.localeCompare(`${yb}${mb}`);
    })
    .map(([month, total]) => ({ month, total }));
}

// Ajusta uma curva exponencial R(t) = R0 * e^(k*t) a uma série de valores
// mensais, usando regressão linear sobre ln(valores) (mínimos quadrados).
//
// Exemplo: calculateExponentialGrowth([1000, 1150, 1380, 1600]) →
//   { r0: ≈985, k: ≈0.16, monthlyGrowthRate: ≈17.4%, doublingTime: ≈4.3, rSquared: ≈0.99 }
export function calculateExponentialGrowth(values: number[]): ExponentialModel {
  // Precisa de ao menos 1 ponto, e todos os valores devem ser positivos
  // (logaritmo não é definido para valores <= 0)
  const points = values
    .map((v, t) => ({ t, v }))
    .filter((p) => p.v > 0);

  // Com apenas 1 ponto, usa o valor como base sem crescimento definido
  if (points.length < 2) {
    const baseValue = values[0] ?? 0;
    return { r0: baseValue, k: 0, monthlyGrowthRate: 0, doublingTime: null, rSquared: 0 };
  }

  const n = points.length;

  // Linearização: y = ln(v)
  const xs = points.map((p) => p.t);
  const ys = points.map((p) => Math.log(p.v));

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  // Mínimos quadrados: k = Σ(x-x̄)(y-ȳ) / Σ(x-x̄)²
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i] - meanX) * (ys[i] - meanY);
    denominator += (xs[i] - meanX) ** 2;
  }

  const k = denominator === 0 ? 0 : numerator / denominator;
  const b = meanY - k * meanX; // b = ln(R0)
  const r0 = Math.exp(b);

  // R² sobre os pontos linearizados: mede o quão bem a reta explica os dados
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = b + k * xs[i];
    ssRes += (ys[i] - yPred) ** 2;
    ssTot += (ys[i] - meanY) ** 2;
  }
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  // Crescimento percentual equivalente por mês: R(t+1)/R(t) - 1 = e^k - 1
  const monthlyGrowthRate = (Math.exp(k) - 1) * 100;

  // Tempo de duplicação: R0 * e^(k*T) = 2*R0  →  T = ln(2)/k
  const doublingTime = k > 0 ? Math.log(2) / k : null;

  return { r0, k, monthlyGrowthRate, doublingTime, rSquared };
}

// Projeta o valor futuro no instante "t" (em meses) usando o modelo ajustado.
// Exemplo: projectExponentialValue({ r0: 1000, k: 0.15, ... }, 6) → R0 * e^(0.15*6)
export function projectExponentialValue(model: Pick<ExponentialModel, "r0" | "k">, t: number): number {
  return model.r0 * Math.exp(model.k * t);
}