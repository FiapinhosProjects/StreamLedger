import { describe, it, expect } from "vitest";
import { formatCurrency, maskCurrency, parseCurrencyInput } from "../format";

describe("format", () => {
  describe("formatCurrency", () => {
    it("formata número para moeda brasileira", () => {
      expect(formatCurrency(1500.5)).toContain("1.500,50");
    });

    it("formata número inteiro", () => {
      expect(formatCurrency(100)).toContain("100,00");
    });

    it("formata zero", () => {
      expect(formatCurrency(0)).toContain("0,00");
    });

    it("formata número grande", () => {
      expect(formatCurrency(999999.99)).toContain("999.999,99");
    });

    it("formata valor com decimais quebrados", () => {
      expect(formatCurrency(33.33)).toContain("33,33");
    });
  });

  describe("maskCurrency", () => {
    it("retorna string vazia para entrada vazia", () => {
      expect(maskCurrency("")).toBe("");
    });

    it("retorna string vazia para entrada só com não-dígitos", () => {
      expect(maskCurrency("abc")).toBe("");
    });

    it("formata valor em reais corretamente (centavos)", () => {
      expect(maskCurrency("1500")).toBe("15,00");
    });

    it("formata valor com decimais", () => {
      expect(maskCurrency("150050")).toBe("1.500,50");
    });

    it("arredonda decimais para 2 casas", () => {
      expect(maskCurrency("100999")).toBe("1.009,99");
    });

    it("trata valor mínimo", () => {
      expect(maskCurrency("1")).toBe("0,01");
    });
  });

  describe("parseCurrencyInput", () => {
    it("converte string formatada em número", () => {
      expect(parseCurrencyInput("1.500,50")).toBeCloseTo(1500.5);
    });

    it("converte string com R$", () => {
      expect(parseCurrencyInput("R$ 1.500,50")).toBeCloseTo(1500.5);
    });

    it("converte string simples", () => {
      expect(parseCurrencyInput("1500,50")).toBeCloseTo(1500.5);
    });

    it("retorna 0 para string vazia", () => {
      expect(parseCurrencyInput("")).toBe(0);
    });

    it("retorna 0 para string inválida", () => {
      expect(parseCurrencyInput("abc")).toBe(0);
    });
  });
});
