import { describe, it, expect } from "vitest";
import {
  getTotalByType,
  getTotalByCategory,
  getTotalExcludingCategories,
  isDuplicate,
  getMonthlyTotals,
  calculateExponentialGrowth,
  projectExponentialValue,
} from "../calculations";
import type { Transaction } from "../storage";

const mockTransactions: Transaction[] = [
  { id: 1, title: "Sub Twitch", amount: 80, type: "income", category: "Twitch Subs", date: "03/09/2026" },
  { id: 2, title: "Doação Viewer", amount: 50, type: "income", category: "Donates", date: "02/09/2026" },
  { id: 3, title: "Headset", amount: 200, type: "expense", category: "Setup", date: "01/09/2026" },
  { id: 4, title: "VPN", amount: 30, type: "expense", category: "Software", date: "01/09/2026" },
  { id: 5, title: "Sub Twitch 2", amount: 80, type: "income", category: "Twitch Subs", date: "03/09/2026" },
];

describe("calculations", () => {
  describe("getTotalByType", () => {
    it("soma todas as receitas", () => {
      expect(getTotalByType(mockTransactions, "income")).toBe(210); // 80 + 50 + 80
    });

    it("soma todas as despesas", () => {
      expect(getTotalByType(mockTransactions, "expense")).toBe(230); // 200 + 30
    });

    it("retorna 0 para tipo inexistente", () => {
      expect(getTotalByType(mockTransactions, "invalid")).toBe(0);
    });

    it("retorna 0 para array vazio", () => {
      expect(getTotalByType([], "income")).toBe(0);
    });
  });

  describe("getTotalByCategory", () => {
    it("soma receitas de Twitch Subs", () => {
      expect(getTotalByCategory(mockTransactions, "income", "Twitch Subs")).toBe(160); // 80 + 80
    });

    it("soma receitas de Doações", () => {
      expect(getTotalByCategory(mockTransactions, "income", "Donates")).toBe(50);
    });

    it("soma despesas de Setup", () => {
      expect(getTotalByCategory(mockTransactions, "expense", "Setup")).toBe(200);
    });

    it("soma despesas de Software", () => {
      expect(getTotalByCategory(mockTransactions, "expense", "Software")).toBe(30);
    });

    it("retorna 0 para categoria inexistente", () => {
      expect(getTotalByCategory(mockTransactions, "income", "Patrocínio")).toBe(0);
    });
  });

  describe("getTotalExcludingCategories", () => {
    it("exclui categorias e soma o resto (despesas)", () => {
      // Setup + Software = 200 + 30 = 230
      // Excluindo Setup → остается 30
      expect(getTotalExcludingCategories(mockTransactions, "expense", ["Setup"])).toBe(30);
    });

    it("exclui múltiplas categorias", () => {
      expect(getTotalExcludingCategories(mockTransactions, "expense", ["Setup", "Software"])).toBe(0);
    });

    it("retorna 0 se todas forem excluídas", () => {
      expect(getTotalExcludingCategories(mockTransactions, "income", ["Twitch Subs", "Donates"])).toBe(0);
    });

    it("funciona com array vazio", () => {
      expect(getTotalExcludingCategories([], "income", [])).toBe(0);
    });
  });

  describe("isDuplicate", () => {
    it("retorna true para transação duplicada", () => {
      const duplicate = {
        title: "Sub Twitch",
        amount: 80,
        type: "income" as const,
        category: "Twitch Subs",
      };
      expect(isDuplicate(mockTransactions, duplicate)).toBe(true);
    });

    it("retorna false para transação diferente", () => {
      const different = {
        title: "Patrocínio Novo",
        amount: 500,
        type: "income" as const,
        category: "Patrocínio",
      };
      expect(isDuplicate(mockTransactions, different)).toBe(false);
    });

    it("detecta diferença apenas no valor", () => {
      const diffValue = {
        title: "Sub Twitch",
        amount: 90, // diferente do original (80)
        type: "income" as const,
        category: "Twitch Subs",
      };
      expect(isDuplicate(mockTransactions, diffValue)).toBe(false);
    });

    it("detecta diferença apenas na categoria", () => {
      const diffCategory = {
        title: "Sub Twitch",
        amount: 80,
        type: "income" as const,
        category: "Donates", // diferente do original (Twitch Subs)
      };
      expect(isDuplicate(mockTransactions, diffCategory)).toBe(false);
    });

    it("funciona com array vazio", () => {
      const data = {
        title: "Teste",
        amount: 10,
        type: "income" as const,
        category: "Geral",
      };
      expect(isDuplicate([], data)).toBe(false);
    });
  });
    describe("getMonthlyTotals", () => {
    const monthlyTx: Transaction[] = [
      { id: 1, title: "Sub Twitch", amount: 500, type: "income", category: "Twitch Subs", date: "05/06/2026" },
      { id: 2, title: "Donate", amount: 300, type: "income", category: "Donates", date: "20/06/2026" },
      { id: 3, title: "Sub Twitch", amount: 900, type: "income", category: "Twitch Subs", date: "10/07/2026" },
      { id: 4, title: "Headset", amount: 200, type: "expense", category: "Setup", date: "01/07/2026" },
    ];

    it("agrupa receitas por mês (MM/AAAA)", () => {
      expect(getMonthlyTotals(monthlyTx, "income")).toEqual([
        { month: "06/2026", total: 800 },
        { month: "07/2026", total: 900 },
      ]);
    });

    it("agrupa despesas por mês", () => {
      expect(getMonthlyTotals(monthlyTx, "expense")).toEqual([{ month: "07/2026", total: 200 }]);
    });

    it("retorna array vazio quando não há transações do tipo", () => {
      expect(getMonthlyTotals([], "income")).toEqual([]);
    });
  });

  describe("calculateExponentialGrowth", () => {
    it("ajusta um modelo próximo do exato para uma série exponencial perfeita", () => {
      // Gerada com R0 = 1000 e k = ln(1.2) (crescimento de 20% ao mês)
      const k = Math.log(1.2);
      const r0 = 1000;
      const series = [0, 1, 2, 3, 4].map((t) => r0 * Math.exp(k * t));

      const model = calculateExponentialGrowth(series);

      expect(model.r0).toBeCloseTo(r0, 3);
      expect(model.k).toBeCloseTo(k, 6);
      expect(model.monthlyGrowthRate).toBeCloseTo(20, 3);
      expect(model.rSquared).toBeCloseTo(1, 6);
      expect(model.doublingTime).toBeCloseTo(Math.log(2) / k, 6);
    });

    it("retorna k=0 e rSquared=0 quando há menos de 2 pontos válidos", () => {
      expect(calculateExponentialGrowth([500])).toEqual({
        r0: 500,
        k: 0,
        monthlyGrowthRate: 0,
        doublingTime: null,
        rSquared: 0,
      });
    });

    it("doublingTime é null quando a taxa de crescimento não é positiva", () => {
      // Série decrescente → k negativo → duplicação não se aplica
      const model = calculateExponentialGrowth([1000, 800, 640, 512]);
      expect(model.k).toBeLessThan(0);
      expect(model.doublingTime).toBeNull();
    });

    it("ignora valores não positivos antes de aplicar o logaritmo", () => {
      const model = calculateExponentialGrowth([0, 1000, 1200, 1440]);
      expect(model.r0).toBeGreaterThan(0);
      expect(Number.isFinite(model.k)).toBe(true);
    });
  });

  describe("projectExponentialValue", () => {
    it("projeta corretamente R(t) = R0 * e^(k*t)", () => {
      const model = { r0: 1000, k: Math.log(1.1) }; // 10% ao mês
      expect(projectExponentialValue(model, 0)).toBeCloseTo(1000, 6);
      expect(projectExponentialValue(model, 1)).toBeCloseTo(1100, 6);
      expect(projectExponentialValue(model, 2)).toBeCloseTo(1210, 6);
    });
  });
});
