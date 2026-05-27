// ============================================
// Dashboard - Página principal do app
// Mostra métricas, transações recentes, meta e modais
// ============================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import MetricCard from "@/components/ui/MetricCard";
import TransactionModal from "@/components/modals/TransactionModal";
import DeleteModal from "@/components/modals/DeleteModal";
import DuplicateModal from "@/components/modals/DuplicateModal";
import GoalTracker from "@/components/ui/GoalTracker";
import Toast from "@/components/ui/Toast";
import { useTransactions } from "@/hooks/useTransactions";
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

  // Calcula os totais para os cards de métrica
  const revenue = getTotalByType(transactions, "income");
  const costs = getTotalByType(transactions, "expense");
  const profit = revenue - costs;

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

      {/* Cards de métricas (Faturamento, Custos, Lucro) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon="/assets/LucroGeral.svg" iconBg="#6BD4B8" label="Faturamento Total" value={formatCurrency(revenue)} />
        <MetricCard icon="/assets/CustosCanal.svg" iconBg="#F87171" label="Custos do Canal" value={formatCurrency(costs)} />
        <MetricCard icon="/assets/lucroReal.svg" iconBg="#3b82f6" label="Lucro Real" value={formatCurrency(profit)} />
      </div>

      {/* Lista de transações recentes */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h3 className="text-lg font-semibold mb-1">Movimentações Recentes</h3>
        <p className="text-sm text-muted mb-4">Últimas transações registradas</p>

        {transactions.length === 0 ? (
          // Estado vazio: nenhuma transação registrada
          <div className="text-center py-10">
            <p className="text-muted mb-3">Nenhuma transação registrada ainda.</p>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="px-4 py-2 text-sm rounded-lg bg-neon text-background font-semibold"
            >
              + Registrar primeira transação
            </button>
          </div>
        ) : (
          // Lista de transações (mais recentes primeiro)
          <div className="flex flex-col gap-2">
            {transactions.slice().reverse().map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-subtle hover:bg-neon/5 hover:border-neon/20 hover:shadow-[0_0_10px_rgba(93,255,155,0.1)] hover:-translate-y-0.5 border border-transparent transition-all duration-300">
                {/* Info da transação: ícone, título, data */}
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <CategoryIcon category={t.category} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.title}</p>
                    <p className="text-xs text-muted">{t.date} &bull; {t.category}</p>
                  </div>
                </div>

                {/* Valor e botões de ação */}
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${t.type === "income" ? "text-green-400" : "text-red"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                  <button onClick={() => handleEdit(t)} className="text-muted hover:text-neon hover:drop-shadow-[0_0_6px_rgba(93,255,155,0.6)] transition-all duration-300 text-sm" title="Editar">✎</button>
                  <button onClick={() => handleDelete(t.id)} className="text-muted hover:text-red hover:drop-shadow-[0_0_6px_rgba(255,68,102,0.6)] transition-all duration-300 text-sm" title="Excluir">✖</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Componente de meta financeira */}
      <GoalTracker transactions={transactions} />

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

// Componente auxiliar: ícone da categoria
function CategoryIcon({ category }: { category: string }) {
  // Mapa de categorias para ícones
  const icons: Record<string, string> = {
    "Twitch Subs": "/assets/Twitch.svg",
    "YouTube AdSense": "/assets/Youtube.svg",
    "Donates": "/assets/Donate.svg",
    "Setup": "/assets/equipamento.svg",
    "Software": "/assets/software.svg",
  };

  // Se não encontrar, usa o ícone genérico "Outros"
  return <Image src={icons[category] || "/assets/Outros.svg"} alt="" width={20} height={20} />;
}
