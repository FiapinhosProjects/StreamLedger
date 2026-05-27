// ============================================
// Receitas - Página de gerenciamento de receitas
// Mostra métricas por fonte e gráfico de barras
// ============================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import MetricCard from "@/components/ui/MetricCard";
import TransactionModal from "@/components/modals/TransactionModal";
import DuplicateModal from "@/components/modals/DuplicateModal";
import RevenueChart from "@/components/ui/RevenueChart";
import Toast from "@/components/ui/Toast";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/format";
import { getTotalByCategory } from "@/lib/calculations";
import { Transaction } from "@/lib/storage";

export default function Receitas() {
  // Hook que gerencia as transações
  const { transactions, addTransaction, updateTransaction } = useTransactions();

  // Controle do modal de criar/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Controle do modal de duplicata
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<Omit<Transaction, "id" | "date"> | null>(null);

  // Controle do toast
  const [toastVisible, setToastVisible] = useState(false);
  const hideToast = useCallback(() => setToastVisible(false), []);

  // Calcula totais por fonte de receita
  const twitchSubs = getTotalByCategory(transactions, "income", "Twitch Subs");
  const youtube = getTotalByCategory(transactions, "income", "YouTube AdSense");
  const donates = getTotalByCategory(transactions, "income", "Donates");

  // Verifica se já existe uma transação igual
  const checkDuplicate = (data: Omit<Transaction, "id" | "date">) => {
    return transactions.some(
      (t) => t.title === data.title && t.amount === data.amount && t.category === data.category && t.type === data.type
    );
  };

  // Salva a transação (nova ou editada)
  const handleSave = (data: Omit<Transaction, "id" | "date">) => {
    if (editing) {
      updateTransaction(editing.id, data);
      setEditing(null);
      setToastVisible(true);
    } else {
      if (checkDuplicate(data)) {
        setPendingData(data);
        setDuplicateModalOpen(true);
        return;
      }
      addTransaction(data);
      setToastVisible(true);
    }
  };

  // Confirma salvar mesmo sendo duplicata
  const handleConfirmDuplicate = () => {
    if (pendingData) {
      addTransaction(pendingData);
      setPendingData(null);
      setToastVisible(true);
    }
    setDuplicateModalOpen(false);
  };

  return (
    <>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Image
            src="/assets/user.svg"
            alt="User"
            width={45}
            height={45}
            className="rounded-full border border-neon bg-[#2a2a2a] p-1"
          />
          <div>
            <h2 className="text-lg font-bold">Receitas</h2>
            <p className="text-sm text-muted">Acompanhe seus rendimentos</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-5 py-2.5 rounded-full border border-neon/20 font-semibold text-sm hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 hover:border-neon/50 transition-all duration-300"
        >
          + Nova Transação
        </button>
      </div>

      {/* Cards de métricas por fonte */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon="/assets/Twitch.svg" iconBg="#9147FF" label="Twitch Subs" value={formatCurrency(twitchSubs)} />
        <MetricCard icon="/assets/Youtube.svg" iconBg="#FB2C36" label="YouTube AdSense" value={formatCurrency(youtube)} />
        <MetricCard icon="/assets/Donate.svg" iconBg="#00FF7F" label="Donates" value={formatCurrency(donates)} />
      </div>

      {/* Gráfico de barras das receitas */}
      <RevenueChart transactions={transactions} />

      {/* Modal de criar/editar transação */}
      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editingTransaction={editing}
      />

      {/* Modal de alerta de duplicata */}
      <DuplicateModal
        open={duplicateModalOpen}
        onClose={() => { setDuplicateModalOpen(false); setPendingData(null); }}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Toast de notificação */}
      <Toast message="Transação adicionada com sucesso!" visible={toastVisible} onClose={hideToast} />
    </>
  );
}
