import { describe, it, expect } from "vitest";
import {
  validateAndSanitizeTitle,
  validateAmount,
  validateCategory,
  validateEmail,
  validateDate,
  validateTransaction,
  sanitizeForDisplay,
  sanitizeForStorage,
  parseCurrencyValue,
  escapeForSql,
  isSafeText,
  truncate,
} from "../validation";

describe("validation", () => {
  describe("validateAndSanitizeTitle", () => {
    it("retorna válido para título correto", () => {
      const result = validateAndSanitizeTitle("Sub Twitch");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("retorna inválido para título vazio", () => {
      const result = validateAndSanitizeTitle("");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("retorna inválido para título muito curto", () => {
      const result = validateAndSanitizeTitle("A");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para título longo demais", () => {
      const longTitle = "A".repeat(101);
      const result = validateAndSanitizeTitle(longTitle);
      expect(result.valid).toBe(false);
    });

    it("detecta XSS em título", () => {
      const result = validateAndSanitizeTitle("<script>alert('xss')</script>");
      expect(result.valid).toBe(false);
    });

    it("detecta event handler em título", () => {
      const result = validateAndSanitizeTitle("Teste onclick=alert(1)");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateAmount", () => {
    it("retorna válido para valor correto", () => {
      const result = validateAmount(100);
      expect(result.valid).toBe(true);
    });

    it("retorna válido para string numérica", () => {
      const result = validateAmount("1500,50");
      expect(result.valid).toBe(true);
    });

    it("retorna inválido para zero", () => {
      const result = validateAmount(0);
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para valor negativo", () => {
      const result = validateAmount(-50);
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para string vazia", () => {
      const result = validateAmount("");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para valor inválido (NaN)", () => {
      const result = validateAmount("abc");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para valor mínimo não atingido", () => {
      const result = validateAmount(0.001);
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para valor máximo excedido", () => {
      const result = validateAmount(9999999999.99);
      expect(result.valid).toBe(false);
    });
  });

  describe("validateCategory", () => {
    it("retorna válido para categoria Twitch Subs", () => {
      const result = validateCategory("Twitch Subs");
      expect(result.valid).toBe(true);
    });

    it("retorna válido para categoria customizada segura", () => {
      const result = validateCategory("Minha Categoria");
      expect(result.valid).toBe(true);
    });

    it("retorna inválido para categoria vazia", () => {
      const result = validateCategory("");
      expect(result.valid).toBe(false);
    });

    it("detecta ameaça em categoria", () => {
      const result = validateCategory("<img src=x onerror=alert(1)>");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateEmail", () => {
    it("retorna válido para email correto", () => {
      const result = validateEmail("usuario@exemplo.com");
      expect(result.valid).toBe(true);
    });

    it("retorna válido para email com subdomínio", () => {
      const result = validateEmail("user@mail.exemplo.com");
      expect(result.valid).toBe(true);
    });

    it("retorna inválido para email sem @", () => {
      const result = validateEmail("usuarioexemplo.com");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para email sem domínio", () => {
      const result = validateEmail("usuario@");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para email vazio", () => {
      const result = validateEmail("");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para email com XSS", () => {
      const result = validateEmail("user@<script>alert(1)</script>.com");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateDate", () => {
    it("retorna válido para data no formato correto", () => {
      const result = validateDate("01/01/2000");
      expect(result.valid).toBe(true);
    });

    it("retorna inválido para data vazia", () => {
      const result = validateDate("");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para formato incorreto", () => {
      const result = validateDate("01-01-2000");
      expect(result.valid).toBe(false);
      const result2 = validateDate("01/01/00");
      expect(result2.valid).toBe(false);
    });

    it("retorna inválido para mês inválido", () => {
      const result = validateDate("01/13/2000");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para dia inválido", () => {
      const result = validateDate("32/01/2000");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para data inexistente (31/02)", () => {
      const result = validateDate("31/02/2020");
      expect(result.valid).toBe(false);
    });

    it("retorna inválido para ano muito antigo", () => {
      const result = validateDate("01/01/1800");
      expect(result.valid).toBe(false);
    });
  });

  describe("validateTransaction", () => {
    it("retorna válido para transação completa", () => {
      const result = validateTransaction({
        title: "Sub Twitch",
        amount: 80,
        type: "income",
        category: "Twitch Subs",
      });
      expect(result.valid).toBe(true);
    });

    it("retorna inválido para tipo inválido", () => {
      const result = validateTransaction({
        title: "Teste",
        amount: 10,
        type: "invalid",
        category: "Geral",
      });
      expect(result.valid).toBe(false);
    });

    it("agrega erros de múltiplos campos", () => {
      const result = validateTransaction({
        title: "",
        amount: -10,
        type: "invalid",
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("sanitizeForDisplay", () => {
    it("remove tags HTML", () => {
      const result = sanitizeForDisplay("<b>Texto</b>");
      expect(result).not.toContain("<b>");
      expect(result).toContain("Texto");
    });

    it("escapes caracteres HTML residuais", () => {
      const result = sanitizeForDisplay("5 > 3");
      expect(result).toContain("&gt;");
    });

    it("trim whitespace", () => {
      const result = sanitizeForDisplay("  Texto  ");
      expect(result).toBe("Texto");
    });

    it("retorna string vazia para null/undefined", () => {
      expect(sanitizeForDisplay("")).toBe("");
      expect(sanitizeForDisplay(null as unknown as string)).toBe("");
    });
  });

  describe("sanitizeForStorage", () => {
    it("remove tags HTML", () => {
      const result = sanitizeForStorage("<script>alert(1)</script>");
      expect(result).not.toContain("<script>");
    });

    it("remove event handlers", () => {
      const result = sanitizeForStorage("img onclick=alert(1)");
      expect(result).not.toContain("onclick");
    });

    it("remove javascript protocol", () => {
      const result = sanitizeForStorage("javascript:alert(1)");
      expect(result).not.toContain("javascript:");
    });

    it("preserva texto normal", () => {
      const result = sanitizeForStorage("Sub Twitch de 80 reais");
      expect(result).toBe("Sub Twitch de 80 reais");
    });
  });

  describe("parseCurrencyValue", () => {
    it("converte formato brasileiro", () => {
      expect(parseCurrencyValue("1.500,50")).toBeCloseTo(1500.5);
    });

    it("converte com símbolo R$", () => {
      expect(parseCurrencyValue("R$ 1.500,50")).toBeCloseTo(1500.5);
    });

    it("retorna 0 para entrada inválida", () => {
      expect(parseCurrencyValue("abc")).toBe(0);
      expect(parseCurrencyValue("")).toBe(0);
    });
  });

  describe("escapeForSql", () => {
    it("escapa aspas simples", () => {
      const result = escapeForSql("usuario's");
      expect(result).toBe("usuario\\'s");
    });

    it("escapa aspas duplas", () => {
      const result = escapeForSql('usuario"teste');
      expect(result).toBe("usuario\\\"teste");
    });

    it("escapa barras invertidas", () => {
      const result = escapeForSql("caminho\\arquivo");
      expect(result).toBe("caminho\\\\arquivo");
    });

    it("retorna string vazia para entrada vazia", () => {
      expect(escapeForSql("")).toBe("");
    });
  });

  describe("isSafeText", () => {
    it("retorna true para texto seguro", () => {
      expect(isSafeText("Sub Twitch")).toBe(true);
    });

    it("retorna false para texto com XSS", () => {
      expect(isSafeText("<script>alert(1)</script>")).toBe(false);
    });

    it("retorna false para texto vazio", () => {
      expect(isSafeText("")).toBe(false);
    });
  });

  describe("truncate", () => {
    it("retorna texto original se menor que maxLength", () => {
      expect(truncate("Texto", 10)).toBe("Texto");
    });

    it("trunca texto longo e adiciona reticências", () => {
      // maxLength=10, trunca para 7 chars + "..." = "Texto m..."
      expect(truncate("Texto muito longo", 10)).toBe("Texto m...");
    });

    it("retorna string vazia para entrada vazia", () => {
      expect(truncate("", 10)).toBe("");
    });
  });
});
