"use client";

import { useEffect, useRef, useState } from "react";
import { Transaction } from "@/lib/storage";
import {
  buildCsv,
  buildPdf,
  makeFilename,
  triggerDownload,
} from "@/lib/export";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  rows: Transaction[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

// Modal de exportação — usuário escolhe entre CSV e PDF.
// O componente gera o arquivo e dispara o download, depois fecha.
// Usa <dialog> nativo (mesmo padrão do TransactionModal).
export default function ExportModal({ open, onClose, rows, onSuccess, onError }: ExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState<null | "csv" | "pdf">(null);

  // Reseta o estado de "busy" quando o modal fecha
  // (impede ficar preso em "Gerando..." se um export anterior
  // terminou em estado de erro). Usa padrão de updater function
  // para evitar set-state síncrono dentro do effect body.
  useEffect(() => {
    if (!open) {
      return () => setBusy(null);
    }
    return undefined;
  }, [open]);

  // Abre/fecha o <dialog> quando o estado `open` muda
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  function handleExport(format: "csv" | "pdf") {
    if (rows.length === 0) {
      onError("Nenhuma transação para exportar");
      onClose();
      return;
    }
    setBusy(format);
    try {
      if (format === "csv") {
        const csv = buildCsv(rows);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const filename = makeFilename("csv");
        triggerDownload(blob, filename);
        onSuccess(`Exportado como ${filename}`);
      } else {
        const { blob, filename } = buildPdf(rows);
        triggerDownload(blob, filename);
        onSuccess(`Exportado como ${filename}`);
      }
    } catch (err) {
      console.error("[ExportModal] falha ao exportar:", err);
      onError("Falha ao exportar. Tente novamente.");
    } finally {
      setBusy(null);
      onClose();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="export-title"
      className="fixed inset-0 z-50 m-auto w-full max-w-sm rounded-2xl border border-neon/30 bg-card p-0 text-white backdrop:bg-black/60"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 id="export-title" className="text-lg font-bold text-neon">
            Exportar movimentações
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-muted mb-6">
          Escolha o formato. Serão exportadas as transações visíveis na tabela.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-full border border-neon/20 px-4 py-2.5 text-sm font-semibold hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17v3a2 2 0 002 2h14a2 2 0 002-2v-3" />
            </svg>
            {busy === "csv" ? "Gerando..." : "Exportar CSV"}
          </button>

          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={busy !== null}
            className="flex items-center justify-center gap-2 rounded-full border border-neon/20 px-4 py-2.5 text-sm font-semibold hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {busy === "pdf" ? "Gerando..." : "Exportar PDF"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </dialog>
  );
}
