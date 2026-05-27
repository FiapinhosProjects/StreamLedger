// ============================================
// Despesas - Página de gerenciamento de despesas
// Mostra métricas por categoria, gráfico e top 5 despesas
// ============================================

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import MetricCard from "@/components/ui/MetricCard";
import TransactionModal from "@/components/modals/TransactionModal";
import DuplicateModal from "@/components/modals/DuplicateModal";
import ExpenseChart from "@/components/ui/ExpenseChart";
import Toast from "@/components/ui/Toast";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency } from "@/lib/format";
import { getTotalByCategory, getTotalExcludingCategories } from "@/lib/calculations";
import { Transaction } from "@/lib/storage";

export default function Despesas() {
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

  // Calcula totais por categoria de despesa
  const setup = getTotalByCategory(transactions, "expense", "Setup");
  const software = getTotalByCategory(transactions, "expense", "Software");
  const outros = getTotalExcludingCategories(transactions, "expense", ["Setup", "Software"]);

  // Pega as 5 maiores despesas (ordenadas por valor)
  const topExpenses = transactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

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
            <h2 className="text-lg font-bold">Despesas</h2>
            <p className="text-sm text-muted">Gerencie seus custos e saídas</p>
          </div>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="px-5 py-2.5 rounded-full border border-neon/20 font-semibold text-sm hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 hover:border-neon/50 transition-all duration-300"
        >
          + Nova Transação
        </button>
      </div>

      {/* Cards de métricas por categoria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <MetricCard icon="/assets/equipamento.svg" iconBg="#9147FF" label="Equipamentos" value={formatCurrency(setup)} />
        <MetricCard icon="/assets/software.svg" iconBg="#00FF7F" label="Software" value={formatCurrency(software)} />
        <MetricCard icon="/assets/Outros.svg" iconBg="#FF6900" label="Outros" value={formatCurrency(outros)} />
      </div>

      {/* Gráfico de pizza + Top 5 despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Gráfico ocupa 3 colunas */}
        <div className="lg:col-span-3">
          <ExpenseChart transactions={transactions} />
        </div>

        {/* Top 5 despesas ocupa 2 colunas */}
        <div className="lg:col-span-2 bg-card border border-neon/30 rounded-2xl p-5 shadow-lg">
          <h3 className="text-lg font-bold mb-1">Maiores Despesas</h3>
          <p className="text-sm text-muted mb-4">Top 5</p>

          {topExpenses.length === 0 ? (
            <p className="text-muted text-sm">Nenhuma despesa registrada.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {topExpenses.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={t.category} />
                    <span className="text-sm font-medium">{t.title}</span>
                  </div>
                  <span className="font-bold text-red text-sm">{formatCurrency(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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

// Componente auxiliar: ícone da categoria de despesa
function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    "Setup": "/assets/equipamento.svg",
    "Software": "/assets/software.svg",
  };
  return <Image src={icons[category] || "/assets/Outros.svg"} alt="" width={20} height={20} />;
}
