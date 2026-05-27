// ============================================
// TransactionModal.tsx - Modal para criar/editar transação
// Formulário com descrição, valor, tipo e categoria
// ============================================

"use client";

import { useState, useEffect, useRef } from "react";
import { Transaction } from "@/lib/storage";
import { maskCurrency, parseCurrencyInput } from "@/lib/format";
import { sanitizeInput } from "@/lib/sanitize";

// Categorias de receita (quando tipo = "income")
const incomeCategories = [
  { value: "Twitch Subs", label: "Twitch Subs" },
  { value: "YouTube AdSense", label: "YouTube AdSense" },
  { value: "Donates", label: "Donates" },
];

// Categorias de despesa (quando tipo = "expense")
const expenseCategories = [
  { value: "Setup", label: "Setup (Hardware)" },
  { value: "Software", label: "Software" },
  { value: "Geral", label: "Outros" },
];

// Props do modal
// open: se está aberto
// onClose: função para fechar
// onSave: função chamada ao salvar (recebe os dados)
// editingTransaction: transação sendo editada (null se for nova)
export default function TransactionModal({ open, onClose, onSave, editingTransaction }: any) {
  // Estados do formulário
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Twitch Subs");

  // Referência ao elemento <dialog> do HTML
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Seleciona as categorias baseado no tipo escolhido
  const categories = type === "expense" ? expenseCategories : incomeCategories;

  // Quando abre o modal, preenche os campos (edição) ou limpa (novo)
  useEffect(() => {
    if (editingTransaction) {
      // Modo edição: preenche com os dados existentes
      setTitle(editingTransaction.title);
      setAmount(editingTransaction.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
    } else {
      // Modo novo: limpa tudo
      setTitle("");
      setAmount("");
      setType("income");
      setCategory("Twitch Subs");
    }
  }, [editingTransaction, open]);

  // Quando o tipo muda, reseta a categoria se ela não existe no novo tipo
  useEffect(() => {
    const cats = type === "expense" ? expenseCategories : incomeCategories;
    const categoryExists = cats.some((c) => c.value === category);

    if (!categoryExists) {
      setCategory(cats[0].value);
    }
  }, [type]);

  // Controla abrir/fechar o dialog nativo do HTML
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Quando o formulário é enviado
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Monta os dados e envia para o componente pai
    onSave({
      title: sanitizeInput(title),
      amount: parseCurrencyInput(amount),
      type,
      category,
    });

    onClose();
  };

  // Se não está aberto, não renderiza nada
  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-neon/30 bg-card p-0 text-white backdrop:bg-black/60"
    >
      <div className="p-6">
        {/* Cabeçalho do modal */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-neon">
            {editingTransaction ? "Editar Movimentação" : "Lançar Movimentação"}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white" aria-label="Fechar">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Campo: Descrição */}
          <div>
            <label htmlFor="desc" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Descrição
            </label>
            <input
              id="desc"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Doação Twitch, Microfone..."
              required
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-neon/50"
            />
          </div>

          {/* Campos: Valor e Tipo (lado a lado) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Valor (R$)
              </label>
              <input
                id="amount"
                type="text"
                value={amount}
                onChange={(e) => setAmount(maskCurrency(e.target.value))}
                placeholder="0,00"
                required
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-neon/50"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Tipo
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as "income" | "expense")}
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-neon/50"
              >
                <option value="income">Receita (+)</option>
                <option value="expense">Despesa (-)</option>
              </select>
            </div>
          </div>

          {/* Campo: Categoria (muda conforme o tipo) */}
          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-neon/50"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Botões: Cancelar e Salvar */}
          <div className="flex justify-end gap-3 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-white/20 hover:bg-white/5">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 text-sm rounded-full border border-neon/20 font-semibold hover:bg-neon/10 transition-all">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
