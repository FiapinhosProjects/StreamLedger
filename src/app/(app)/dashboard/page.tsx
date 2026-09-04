"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import MetricCard from "@/components/ui/MetricCard";
import TransactionModal from "@/components/modals/TransactionModal";
import DeleteModal from "@/components/modals/DeleteModal";
import DuplicateModal from "@/components/modals/DuplicateModal";
import GoalTracker from "@/components/ui/GoalTracker";
import TopGames from "@/components/ui/TopGames";
import Toast from "@/components/ui/Toast";
import Chatbot from "@/components/chatbot/Chatbot";
import { useTransactions } from "@/hooks/useTransactions";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import TransactionTable from "@/components/ui/TransactionTable";
import { formatCurrency } from "@/lib/format";
import { getTotalByType } from "@/lib/calculations";
import { Transaction } from "@/lib/storage";

export default function Dashboard() {
  // Hook que gerencia as transações (adicionar, editar, excluir)
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useTransactions();

  // Controle do modal de criar/editar transação
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  // Controle do modal de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Controle do modal de duplicata
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<Omit<Transaction, "id" | "date"> | null>(null);

  // Controle do toast de notificação
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const hideToast = useCallback(() => setToastVisible(false), []);

  // Cotação USD-BRL em tempo real
  const { rate, loading: rateLoading } = useExchangeRate();

  // Calcula os totais para os cards de métrica
  const revenue = getTotalByType(transactions, "income");
  const costs = getTotalByType(transactions, "expense");
  const profit = revenue - costs;
  const profitUsd = rate ? profit / rate : null;

  // Verifica se já existe uma transação igual
  const checkDuplicate = (data: Omit<Transaction, "id" | "date">) => {
    return transactions.some(
      (t) => t.title === data.title && t.amount === data.amount && t.category === data.category && t.type === data.type
    );
  };

  // Salva a transação (nova ou editada)
  const handleSave = (data: Omit<Transaction, "id" | "date">) => {
    if (editing) {
      // Modo edição: atualiza a transação existente
      updateTransaction(editing.id, data);
      setEditing(null);
      setToastMessage("Transação adicionada com sucesso!");
      setToastVisible(true);
    } else {
      // Modo novo: verifica duplicata antes de salvar
      if (checkDuplicate(data)) {
        setPendingData(data);
        setDuplicateModalOpen(true);
        return;
      }
      addTransaction(data);
      setToastMessage("Transação adicionada com sucesso!");
      setToastVisible(true);
    }
  };

  // Callback disparado quando o chatbot confirma uma transação
  const handleChatbotConfirm = useCallback(
    (data: { title: string; amount: number; type: "income" | "expense"; category: string }) => {
      const saved = addTransaction(data);
      setToastMessage("Transação salva via assistente! ✅");
      setToastVisible(true);
      return saved;
    },
    [addTransaction]
  );

  // Callback disparado quando o chatbot exclui uma transação
  const handleChatbotDelete = useCallback(
    (data: { title: string; amount: number; type: "income" | "expense"; category: string; id?: number }) => {
      if (data.id != null) {
        deleteTransaction(data.id);
        setToastMessage("Transação excluída! 🗑️");
        setToastVisible(true);
      }
    },
    [deleteTransaction]
  );

  // Confirma salvar mesmo sendo duplicata
  const handleConfirmDuplicate = () => {
    if (pendingData) {
      addTransaction(pendingData);
      setPendingData(null);
      setToastMessage("Transação adicionada com sucesso!");
      setToastVisible(true);
    }
    setDuplicateModalOpen(false);
  };

  // Abre o modal de edição com os dados da transação
  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  // Abre o modal de confirmação de exclusão
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  // Confirma a exclusão da transação
  const handleConfirmDelete = () => {
    if (deleteId !== null) {
      deleteTransaction(deleteId);
      setDeleteId(null);
      setToastMessage("Transação excluída com sucesso!");
      setToastVisible(true);
    }
    setDeleteModalOpen(false);
  };

  return (
    <>
      {/* Cabeçalho com avatar e botão de nova transação */}
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
            <h2 className="text-lg font-bold">Dashboard Financeiro</h2>
            <p className="text-sm text-muted">Bem-vindo de volta, Streamer!</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-5 py-2.5 rounded-full border border-neon/20 font-semibold text-sm hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 hover:border-neon/50 transition-all duration-300"
        >
          + Nova Transação
        </button>
      </div>

      {/* Cards de métricas (Faturamento, Custos, Lucro, USD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard icon="/assets/LucroGeral.svg" iconBg="#6BD4B8" label="Faturamento Total" value={formatCurrency(revenue)} />
        <MetricCard icon="/assets/CustosCanal.svg" iconBg="#F87171" label="Custos do Canal" value={formatCurrency(costs)} />
        <MetricCard icon="/assets/lucroReal.svg" iconBg="#3b82f6" label="Lucro Real" value={formatCurrency(profit)} />
        <MetricCard
          icon="/assets/conversao.svg"
          iconBg="#a78bfa"
          label="Lucro em USD"
          value={rateLoading ? "Carregando..." : profitUsd !== null ? `$ ${profitUsd.toFixed(2)}` : "Indisponível"}
          subtitle={rate ? `Cotação ≈ R$ ${rate.toFixed(2)}` : undefined}
        />
      </div>

      {/* Tabela de transações com busca e ordenação */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Movimentações</h3>
        <TransactionTable
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => { setEditing(null); setModalOpen(true); }}
        />
      </div>

      {/* Componente de meta financeira */}
      <GoalTracker transactions={transactions} />

      {/* Jogos em alta na Twitch */}
      <div className="mt-6">
        <TopGames />
      </div>

      {/* Chatbot flutuante */}
      <Chatbot onConfirm={handleChatbotConfirm} onDelete={handleChatbotDelete} />

      {/* Modal de criar/editar transação */}
      <TransactionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        editingTransaction={editing}
      />

      {/* Modal de confirmação de exclusão */}
      <DeleteModal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }}
        onConfirm={handleConfirmDelete}
      />

      {/* Modal de alerta de duplicata */}
      <DuplicateModal
        open={duplicateModalOpen}
        onClose={() => { setDuplicateModalOpen(false); setPendingData(null); }}
        onConfirm={handleConfirmDuplicate}
      />

      {/* Toast de notificação */}
      <Toast message={toastMessage} visible={toastVisible} onClose={hideToast} />
    </>
  );
}
