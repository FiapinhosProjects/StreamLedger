import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { Transaction } from "./storage";
import { formatCurrency } from "./format";

// ============================================================
// EXPORTAÇÃO — CSV e PDF
// ============================================================
// Helpers puros, sem dependência de DOM ou React.
// As funções que escrevem string/Blob são testáveis; o
// `triggerDownload` (única função com DOM) é isolado e
// coberto pelo E2E manual.

// --- CSV: constantes e escaper ---

// Cabeçalho em pt-BR, ordem fixa de colunas
export const CSV_HEADER = [
  "Data",
  "Descricao",
  "Categoria",
  "Tipo",
  "Valor (BRL)",
] as const;

// Delimitador `;` é o default pt-BR do Excel — evita quebra
// de coluna em títulos com vírgula, sem precisar quoting.
export const CSV_DELIMITER = ";";

// CRLF por RFC 4180
export const CSV_LINE_ENDING = "\r\n";

// BOM UTF-8 faz o Excel pt-BR detectar encoding corretamente
// em títulos com acentos.
export const CSV_BOM = "﻿";

// Escapa uma célula CSV. Citamos se ela contém o delimitador,
// aspas ou quebra de linha; aspas internas são duplicadas.
export function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (/[";\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// --- Totais compartilhados entre CSV e PDF ---

export interface ExportTotals {
  income: number;
  expense: number;
  balance: number;
}

// Soma receitas, despesas e saldo. Aceita Transaction[] filtrada
// ou vazia — o caller decide o escopo.
export function computeTotals(rows: Transaction[]): ExportTotals {
  let income = 0;
  let expense = 0;
  for (const tx of rows) {
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, balance: income - expense };
}

// --- CSV: builder ---

// Monta a string CSV completa: BOM + header + linhas + totais.
// O Valor (BRL) do corpo sai como número raw (ex.: 80.00) para
// o Excel pt-BR parsear como número. Os totais saem formatados
// via `formatCurrency` (R$ X,XX) — humanos leem, Excel não faz math.
export function buildCsv(rows: Transaction[]): string {
  const totals = computeTotals(rows);
  const lines: string[] = [];

  // Cabeçalho
  lines.push(CSV_HEADER.map(escapeCsvCell).join(CSV_DELIMITER));

  // Linhas
  for (const tx of rows) {
    const cells = [
      tx.date,
      tx.title,
      tx.category,
      tx.type === "income" ? "Receita" : "Despesa",
      // Raw number com 2 casas — Excel pt-BR interpreta
      // corretamente em CSV com delimitador `;`.
      tx.amount.toFixed(2),
    ];
    lines.push(cells.map(escapeCsvCell).join(CSV_DELIMITER));
  }

  // Rodapé de totais — uma linha por métrica, com label à direita
  lines.push(
    ["", "", "", "Total Receitas", formatCurrency(totals.income)]
      .map(escapeCsvCell)
      .join(CSV_DELIMITER)
  );
  lines.push(
    ["", "", "", "Total Despesas", formatCurrency(totals.expense)]
      .map(escapeCsvCell)
      .join(CSV_DELIMITER)
  );
  lines.push(
    ["", "", "", "Saldo", formatCurrency(totals.balance)]
      .map(escapeCsvCell)
      .join(CSV_DELIMITER)
  );

  return CSV_BOM + lines.join(CSV_LINE_ENDING) + CSV_LINE_ENDING;
}

// --- PDF: builder ---

export interface PdfBuildResult {
  blob: Blob;
  filename: string;
}

// Gera o PDF a partir das transações. Retorna o blob e o nome
// sugerido; quem chama decide se dispara o download.
export function buildPdf(rows: Transaction[]): PdfBuildResult {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const totals = computeTotals(rows);

  // Cabeçalho do documento
  doc.setFontSize(14);
  doc.text("StreamLedger - Movimentações", 40, 40);
  doc.setFontSize(9);
  doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 40, 56);

  // Tabela
  autoTable(doc, {
    startY: 72,
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor (BRL)"]],
    body: rows.map((tx) => [
      tx.date,
      tx.title,
      tx.category,
      tx.type === "income" ? "Receita" : "Despesa",
      formatCurrency(tx.amount),
    ]),
    foot: [
      [
        { content: "Totais", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
        { content: `Receitas: ${formatCurrency(totals.income)}`, colSpan: 2, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "", colSpan: 3 },
        { content: `Despesas: ${formatCurrency(totals.expense)}`, colSpan: 2, styles: { fontStyle: "bold" } },
      ],
      [
        { content: "", colSpan: 3 },
        { content: `Saldo: ${formatCurrency(totals.balance)}`, colSpan: 2, styles: { fontStyle: "bold" } },
      ],
    ],
    // Cores neon combinando com o app: head verde menta, foot cinza claro
    headStyles: { fillColor: [93, 255, 155], textColor: [10, 10, 10] },
    footStyles: { fillColor: [240, 240, 240], textColor: [20, 20, 20] },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 4: { halign: "right" } },
  });

  const blob = doc.output("blob");
  return { blob, filename: makeFilename("pdf") };
}

// --- Nome de arquivo e download ---

// Gera nome padronizado: streamledger-transacoes-YYYY-MM-DD.<ext>
export function makeFilename(ext: "csv" | "pdf"): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `streamledger-transacoes-${yyyy}-${mm}-${dd}.${ext}`;
}

// Dispara o download no browser via Blob + <a download>.
// Guard SSR-safe. Revogação do objectURL adiada (1s) para
// o Safari concluir o download antes de invalidar a URL.
export function triggerDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
