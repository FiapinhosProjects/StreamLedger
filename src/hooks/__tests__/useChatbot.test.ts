import { describe, it, expect } from "vitest";
import { parseTransaction, type ParsedTransaction } from "../useChatbot";

// Testa o caminho exato: IA devolve JSON, parseTransaction decide a categoria.
// Casos cobertos baseados no cenário reportado pelo usuário:
// "youtube adsense" sendo jogado em "Geral".

function tx(overrides: Partial<ParsedTransaction>): ParsedTransaction {
  return {
    tipo: "entrada",
    descricao: "YouTube AdSense",
    valor: 100,
    categoria: "YouTube AdSense",
    data: "2026-10-07",
    ...overrides,
  };
}

describe("parseTransaction (chatbot → storage)", () => {
  describe("categoria YouTube AdSense", () => {
    it("mantém YouTube AdSense quando a IA devolve exato e tipo é entrada", () => {
      const result = parseTransaction(tx({ categoria: "YouTube AdSense", tipo: "entrada" }));
      expect(result).not.toBeNull();
      expect(result!.category).toBe("YouTube AdSense");
      expect(result!.type).toBe("income");
    });

    it("normaliza para YouTube AdSense mesmo em variações de casing", () => {
      const result1 = parseTransaction(tx({ categoria: "youtube adsense" }));
      const result2 = parseTransaction(tx({ categoria: "YOUTUBE ADSENSE" }));
      const result3 = parseTransaction(tx({ categoria: "Youtube AdSense" }));
      expect(result1!.category).toBe("YouTube AdSense");
      expect(result2!.category).toBe("YouTube AdSense");
      expect(result3!.category).toBe("YouTube AdSense");
    });

    it("normaliza 'youtube' sozinho para YouTube AdSense", () => {
      const result = parseTransaction(tx({ categoria: "youtube" }));
      expect(result!.category).toBe("YouTube AdSense");
    });

    it("normaliza 'adsense' sozinho para YouTube AdSense", () => {
      const result = parseTransaction(tx({ categoria: "adsense" }));
      expect(result!.category).toBe("YouTube AdSense");
    });
  });

  describe("categoria inválida / genérica nunca vira Geral em receita", () => {
    it("IA devolve 'Outros' como receita → fallback Donates, não Geral", () => {
      const result = parseTransaction(tx({ categoria: "Outros", tipo: "entrada" }));
      expect(result).not.toBeNull();
      expect(result!.category).toBe("Donates");
      expect(result!.category).not.toBe("Geral");
      expect(result!.type).toBe("income");
    });

    it("IA devolve string vazia como receita → fallback Donates", () => {
      const result = parseTransaction(tx({ categoria: "", tipo: "entrada" }));
      expect(result!.category).toBe("Donates");
    });

    it("IA devolve categoria desconhecida como receita → fallback Donates", () => {
      const result = parseTransaction(tx({ categoria: "Lorem Ipsum", tipo: "entrada" }));
      expect(result!.category).toBe("Donates");
    });
  });

  describe("categoria YouTube AdSense quando tipo é saida (inconsistência da IA)", () => {
    it("cai em Geral (correto: YouTube AdSense não é despesa válida)", () => {
      const result = parseTransaction(tx({ categoria: "YouTube AdSense", tipo: "saida" }));
      expect(result!.category).toBe("Geral");
      expect(result!.type).toBe("expense");
    });
  });

  describe("demais categorias válidas", () => {
    it("Sub → Twitch Subs", () => {
      const result = parseTransaction(tx({ categoria: "Sub", tipo: "entrada" }));
      expect(result!.category).toBe("Twitch Subs");
    });

    it("Doação → Donates", () => {
      const result = parseTransaction(tx({ categoria: "Doação", tipo: "entrada" }));
      expect(result!.category).toBe("Donates");
    });

    it("Equipamento como saida → Setup", () => {
      const result = parseTransaction(tx({ tipo: "saida", categoria: "Equipamento" }));
      expect(result!.category).toBe("Setup");
      expect(result!.type).toBe("expense");
    });

    it("Software como saida → Software", () => {
      const result = parseTransaction(tx({ tipo: "saida", categoria: "Software" }));
      expect(result!.category).toBe("Software");
    });
  });

  describe("invariantes críticos", () => {
    it("NUNCA salva Geral em uma receita (regra de negócio)", () => {
      // Varre todas as categorias possíveis que a IA pode devolver
      const inputs = [
        "YouTube AdSense", "youtube", "adsense", "YOUTUBE",
        "Sub", "Doação", "Patrocínio", "Lorem", "Outros", "",
        null, undefined, "Twitch Subs", "Donates", "Twitch", "AdSense",
      ];
      for (const cat of inputs) {
        const result = parseTransaction(tx({ tipo: "entrada", categoria: cat as string }));
        if (result && result.type === "income") {
          expect(result.category).not.toBe("Geral");
        }
      }
    });
  });
});