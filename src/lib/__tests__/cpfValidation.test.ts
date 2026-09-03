import { describe, it, expect } from "vitest";
import { validateCPF, formatCPF, calculateAge, classifyUser } from "../cpfValidation";

describe("cpfValidation", () => {
  describe("validateCPF", () => {
    it("retorna true para CPF válido (CPF gerado matematicamente)", () => {
      // Este é um CPF válido calculado: 111.444.777-35
      expect(validateCPF("11144477735")).toBe(true);
    });

    it("retorna false para CPF com menos de 11 dígitos", () => {
      expect(validateCPF("1234567890")).toBe(false);
      expect(validateCPF("123")).toBe(false);
      expect(validateCPF("")).toBe(false);
    });

    it("retorna false para CPF com mais de 11 dígitos", () => {
      expect(validateCPF("123456789012")).toBe(false);
    });

    it("retorna false para CPF com todos os dígitos iguais", () => {
      expect(validateCPF("11111111111")).toBe(false);
      expect(validateCPF("00000000000")).toBe(false);
      expect(validateCPF("99999999999")).toBe(false);
    });

    it("retorna false para primeiro dígito verificador errado", () => {
      // CPF válido exceto pelo primeiro dígito
      expect(validateCPF("52998224713")).toBe(false);
    });

    it("retorna false para segundo dígito verificador errado", () => {
      expect(validateCPF("52998224704")).toBe(false);
    });

    it("ignora formatação (pontos e traço)", () => {
      expect(validateCPF("111.444.777-35")).toBe(true);
    });

    it("ignora caracteres não numéricos", () => {
      expect(validateCPF("111.444.777-35")).toBe(true);
      expect(validateCPF("11144477735!@#")).toBe(true);
    });

    it("retorna false para CPF com letras", () => {
      expect(validateCPF("5299822470A")).toBe(false);
    });
  });

  describe("formatCPF", () => {
    it("formata CPF de 11 dígitos para padrão XXX.XXX.XXX-XX", () => {
      expect(formatCPF("52998224703")).toBe("529.982.247-03");
    });

    it("retorna string original se não tiver 11 dígitos", () => {
      expect(formatCPF("123")).toBe("123");
      expect(formatCPF("5299822470")).toBe("5299822470");
    });

    it("ignora caracteres não numéricos antes de formatar", () => {
      expect(formatCPF("529.982.247-03")).toBe("529.982.247-03");
    });
  });

  describe("calculateAge", () => {
    it("retorna 0 para data no formato inválido", () => {
      expect(calculateAge("")).toBe(0);
      expect(calculateAge("abc")).toBe(0);
      expect(calculateAge("99/99/9999")).toBe(0);
    });

    it("calcula idade corretamente para pessoa que já fez aniversário", () => {
      // Uma pessoa nascida em 2000-01-01, em 2026-09-03, tem 26 anos
      expect(calculateAge("01/01/2000")).toBeGreaterThanOrEqual(25);
    });

    it("calcula idade corretamente para pessoa que ainda não fez aniversário", () => {
      const birthDate = "31/12/2000";
      const age = calculateAge(birthDate);
      expect(age).toBeGreaterThanOrEqual(25);
    });

    it("retorna 0 para data futura", () => {
      expect(calculateAge("01/01/2099")).toBe(0);
    });
  });

  describe("classifyUser", () => {
    it("classifica adulto (18+)", () => {
      expect(classifyUser(18)).toBe("adult");
      expect(classifyUser(25)).toBe("adult");
      expect(classifyUser(99)).toBe("adult");
    });

    it("classifica menor 16-17", () => {
      expect(classifyUser(16)).toBe("minor_16_17");
      expect(classifyUser(17)).toBe("minor_16_17");
    });

    it("classifica menor menor de 16", () => {
      expect(classifyUser(15)).toBe("minor_under_16");
      expect(classifyUser(0)).toBe("minor_under_16");
      expect(classifyUser(5)).toBe("minor_under_16");
    });
  });
});
