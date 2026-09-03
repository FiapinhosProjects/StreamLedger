import { describe, it, expect } from "vitest";
import {
  getTotalByType,
  getTotalByCategory,
  getTotalExcludingCategories,
  isDuplicate,
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
});
