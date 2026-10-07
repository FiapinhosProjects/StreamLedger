import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Transaction } from "../storage";
import {
  escapeCsvCell,
  buildCsv,
  buildPdf,
  computeTotals,
  makeFilename,
  CSV_HEADER,
  CSV_DELIMITER,
  CSV_LINE_ENDING,
  CSV_BOM,
  triggerDownload,
} from "../export";

// Mock do jspdf-autotable para inspecionar os args do buildPdf
vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(() => ({
      setFontSize: vi.fn(),
      text: vi.fn(),
      output: vi.fn().mockReturnValue(new Blob(["mock-pdf-content"], { type: "application/pdf" })),
    })),
  };
});

vi.mock("jspdf-autotable", () => {
  return {
    default: vi.fn(),
  };
});

// Mock do @/lib/format para que os testes não dependam do locale do ambiente
vi.mock("../format", () => ({
  formatCurrency: (value: number) =>
    `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
}));

// Fixture padrão de transações para os testes
const mockTransactions: Transaction[] = [
  { id: 1, title: "Sub Twitch", amount: 100, type: "income", category: "Twitch Subs", date: "01/10/2026" },
  { id: 2, title: "Doação", amount: 50.5, type: "income", category: "Donates", date: "02/10/2026" },
  { id: 3, title: "Microfone", amount: 200, type: "expense", category: "Setup", date: "03/10/2026" },
];

describe("export", () => {
  describe("escapeCsvCell", () => {
    it("não cita valores simples", () => {
      expect(escapeCsvCell("abc")).toBe("abc");
    });

    it("escapa ponto-e-vírgula", () => {
      expect(escapeCsvCell("a;b")).toBe('"a;b"');
    });

    it("dobra aspas internas", () => {
      expect(escapeCsvCell('he said "hi"')).toBe('"he said ""hi"""');
    });

    it("escapa quebra de linha LF", () => {
      expect(escapeCsvCell("linha1\nlinha2")).toBe('"linha1\nlinha2"');
    });

    it("escapa carriage return", () => {
      expect(escapeCsvCell("linha1\rlinha2")).toBe('"linha1\rlinha2"');
    });

    it("converte números para string sem quoting", () => {
      expect(escapeCsvCell(42)).toBe("42");
      expect(escapeCsvCell(42.5)).toBe("42.5");
    });

    it("lida com string vazia", () => {
      expect(escapeCsvCell("")).toBe("");
    });
  });

  describe("buildCsv", () => {
    it("inclui BOM no início", () => {
      const csv = buildCsv([]);
      expect(csv.startsWith(CSV_BOM)).toBe(true);
    });

    it("usa ; como delimitador", () => {
      const csv = buildCsv([]);
      const headerLine = csv.replace(CSV_BOM, "").split(CSV_LINE_ENDING)[0];
      expect(headerLine).toBe(CSV_HEADER.join(CSV_DELIMITER));
    });

    it("termina cada linha com CRLF", () => {
      const csv = buildCsv(mockTransactions);
      // Verifica que o arquivo termina com CRLF
      expect(csv.endsWith(CSV_LINE_ENDING)).toBe(true);
      // E que contém múltiplos CRLFs (1 por linha)
      const crlfCount = (csv.match(/\r\n/g) ?? []).length;
      // 1 header + 3 transações + 3 totais = 7 CRLFs
      expect(crlfCount).toBe(7);
    });

    it("emite header com nomes em pt-BR", () => {
      const csv = buildCsv([]);
      const firstLine = csv.replace(CSV_BOM, "").split(CSV_LINE_ENDING)[0];
      expect(firstLine).toBe("Data;Descricao;Categoria;Tipo;Valor (BRL)");
    });

    it("formata data, descrição, categoria, tipo, valor por linha", () => {
      const csv = buildCsv([mockTransactions[0]]);
      const lines = csv.replace(CSV_BOM, "").split(CSV_LINE_ENDING);
      // linha 0 = header, linha 1 = primeira transação, linha 2 = vazia (CRLF final)
      expect(lines[1]).toBe("01/10/2026;Sub Twitch;Twitch Subs;Receita;100.00");
    });

    it("preserva sinal de tipo (Receita/Despesa)", () => {
      const csv = buildCsv(mockTransactions);
      expect(csv).toContain(";Receita;");
      expect(csv).toContain(";Despesa;");
    });

    it("escapa título com ponto-e-vírgula (delimitador do CSV)", () => {
      // Com delimitador ;, a vírgula é segura; o ; precisa de quoting
      const csv = buildCsv([
        { id: 1, title: "Item; especial", amount: 100, type: "income", category: "Donates", date: "01/10/2026" },
      ]);
      expect(csv).toContain('"Item; especial"');
    });

    it("escapa título com aspas", () => {
      const csv = buildCsv([
        { id: 1, title: 'Compra "especial"', amount: 100, type: "expense", category: "Setup", date: "01/10/2026" },
      ]);
      expect(csv).toContain('"Compra ""especial"""');
    });

    it("escapa título com quebra de linha", () => {
      const csv = buildCsv([
        { id: 1, title: "linha1\nlinha2", amount: 100, type: "income", category: "Donates", date: "01/10/2026" },
      ]);
      expect(csv).toContain('"linha1\nlinha2"');
    });

    it("inclui linhas de totais no rodapé", () => {
      const csv = buildCsv(mockTransactions);
      expect(csv).toContain(";Total Receitas;");
      expect(csv).toContain(";Total Despesas;");
      expect(csv).toContain(";Saldo;");
    });

    it("linha de saldo usa formatCurrency (R$)", () => {
      // Total: income 150.5, expense 200, balance -49.5
      const csv = buildCsv(mockTransactions);
      expect(csv).toContain("R$");
    });

    it("retorna só header + 3 totais zerados para array vazio", () => {
      const csv = buildCsv([]);
      const lines = csv.replace(CSV_BOM, "").split(CSV_LINE_ENDING).filter(Boolean);
      // 1 header + 3 totais = 4 linhas
      expect(lines).toHaveLength(4);
      expect(lines[1]).toContain("Total Receitas");
      expect(lines[2]).toContain("Total Despesas");
      expect(lines[3]).toContain("Saldo");
    });
  });

  describe("computeTotals", () => {
    it("soma receitas, despesas e saldo", () => {
      const t = computeTotals(mockTransactions);
      expect(t.income).toBe(150.5);
      expect(t.expense).toBe(200);
      expect(t.balance).toBe(-49.5);
    });

    it("retorna zeros para array vazio", () => {
      const t = computeTotals([]);
      expect(t.income).toBe(0);
      expect(t.expense).toBe(0);
      expect(t.balance).toBe(0);
    });
  });

  describe("makeFilename", () => {
    it("gera nome no padrão streamledger-transacoes-YYYY-MM-DD.<ext>", () => {
      // Mock da data para resultado determinístico
      const fakeDate = new Date(2026, 9, 7); // 7 de outubro de 2026 (mês 9 = outubro)
      vi.useFakeTimers();
      vi.setSystemTime(fakeDate);
      try {
        expect(makeFilename("csv")).toBe("streamledger-transacoes-2026-10-07.csv");
        expect(makeFilename("pdf")).toBe("streamledger-transacoes-2026-10-07.pdf");
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("buildPdf", () => {
    beforeEach(async () => {
      const { jsPDF } = await import("jspdf");
      const autoTableMod = await import("jspdf-autotable");
      vi.mocked(jsPDF).mockClear();
      vi.mocked(autoTableMod.default).mockClear();
    });

    it("retorna blob e filename", () => {
      const result = buildPdf(mockTransactions);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toMatch(/^streamledger-transacoes-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it("configura jsPDF em a4 pt", async () => {
      const { jsPDF } = await import("jspdf");
      buildPdf([]);
      expect(vi.mocked(jsPDF)).toHaveBeenCalledWith({ unit: "pt", format: "a4" });
    });

    it("chama autoTable com cabeçalho e linhas", async () => {
      const autoTableMod = await import("jspdf-autotable");
      buildPdf(mockTransactions);
      const autoTableMock = vi.mocked(autoTableMod.default);
      expect(autoTableMock).toHaveBeenCalledTimes(1);
      const call = autoTableMock.mock.calls[0];
      const opts = call[1] as { head: string[][]; body: unknown[][] };
      expect(opts.head[0]).toEqual(["Data", "Descrição", "Categoria", "Tipo", "Valor (BRL)"]);
      expect(opts.body).toHaveLength(3);
    });

    it("inclui string de timestamp em pt-BR", async () => {
      const { jsPDF } = await import("jspdf");
      const jsPDFMock = vi.mocked(jsPDF);
      const textFn = vi.fn();
      jsPDFMock.mockImplementation(() => ({
        setFontSize: vi.fn(),
        text: textFn,
        output: vi.fn().mockReturnValue(new Blob(["x"])),
      }) as unknown as InstanceType<typeof jsPDF>);

      buildPdf([]);
      // Procura a chamada que contém "Gerado em"
      const calls = textFn.mock.calls.map((c) => c[0] as string);
      const found = calls.some((c) => c.includes("Gerado em"));
      expect(found).toBe(true);
    });
  });

  describe("triggerDownload", () => {
    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    it("cria link, dispara click e revoga URL", () => {
      // useFakeTimers ANTES de triggerDownload para que o setTimeout
      // interno seja capturado pelo fake clock
      vi.useFakeTimers();

      const blob = new Blob(["data"]);
      const filename = "test.csv";

      const createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      const revokeObjectURL = vi.fn();

      const originalCreate = URL.createObjectURL;
      const originalRevoke = URL.revokeObjectURL;
      URL.createObjectURL = createObjectURL;
      URL.revokeObjectURL = revokeObjectURL;

      // Cria um <a> real para satisfazer o type-check do appendChild
      const realAnchor = document.createElement("a");
      const clickSpy = vi.spyOn(realAnchor, "click").mockImplementation(() => {});
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation(((tag: string) => {
          if (tag === "a") return realAnchor;
          return document.createElement(tag);
        }) as typeof document.createElement);

      triggerDownload(blob, filename);

      expect(createObjectURL).toHaveBeenCalledWith(blob);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(realAnchor.href).toBe("blob:mock-url");
      expect(realAnchor.download).toBe(filename);

      // Avança o setTimeout(1000) para revogar
      vi.advanceTimersByTime(1100);
      expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");

      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      createElementSpy.mockRestore();
    });

    it("não faz nada quando window é undefined (SSR)", () => {
      const origWindow = globalThis.window;
      // Simula ambiente SSR sem window
      (globalThis as { window: Window | undefined }).window = undefined;
      try {
        // Não deve lançar
        expect(() => triggerDownload(new Blob(["x"]), "x.csv")).not.toThrow();
      } finally {
        (globalThis as { window: Window }).window = origWindow;
      }
    });
  });
});
