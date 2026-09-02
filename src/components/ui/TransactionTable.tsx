// ============================================
// TransactionTable.tsx — Tabela de transações com busca e ordenação
// Filtra por título | Ordena por data e valor
// ============================================

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { formatCurrency } from "@/lib/format";
import { Transaction } from "@/lib/storage";

type SortKey = "date" | "amount";
type SortDir = "asc" | "desc";
type FilterType = "all" | "income" | "expense";

// ============================================
// Select — wrapper com seta customizada
// Usa position relative + z-index para garantir dropdown sobre a tabela
// ============================================

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

function Select({ value, onChange, children, className = "" }: SelectProps) {
  return (
    <div className={`relative z-20 ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-9 py-2 rounded-lg border border-white/10 bg-background text-xs text-white/70 outline-none focus:border-neon/40 transition-colors cursor-pointer hover:border-white/20"
      >
        {children}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
}

// ============================================
// Helpers
// ============================================

function parseDate(dateStr: string): Date {
  // Formato: DD/MM/YYYY
  const [day, month, year] = dateStr.split("/").map(Number);
  return new Date(year, month - 1, day);
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, string> = {
    "Twitch Subs": "/assets/Twitch.svg",
    "YouTube AdSense": "/assets/Youtube.svg",
    "Donates": "/assets/Donate.svg",
    "Setup": "/assets/equipamento.svg",
    "Software": "/assets/software.svg",
  };
  return (
    <Image
      src={icons[category] || "/assets/Outros.svg"}
      alt=""
      width={18}
      height={18}
    />
  );
}

// ============================================
// Sub-componente: Linha de transação
// ============================================

function TransactionRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <tr className="group border-b border-white/5 hover:bg-neon/5 transition-colors duration-150">
      {/* Ícone + Descrição */}
      <td className="py-3 px-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
            <CategoryIcon category={tx.category} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm text-white truncate max-w-[140px] sm:max-w-none">
              {tx.title}
            </p>
            <p className="text-xs text-white/40 sm:hidden">{tx.category}</p>
          </div>
        </div>
      </td>

      {/* Categoria — só visible em md+ */}
      <td className="py-3 px-2 hidden md:table-cell">
        <span className="text-xs text-white/50">{tx.category}</span>
      </td>

      {/* Data */}
      <td className="py-3 px-2 hidden sm:table-cell">
        <span className="text-xs text-white/40">{tx.date}</span>
      </td>

      {/* Valor */}
      <td className="py-3 px-2">
        <span
          className={`font-semibold text-sm tabular-nums ${
            tx.type === "income" ? "text-green-400" : "text-red"
          }`}
        >
          {tx.type === "income" ? "+" : "-"}
          {formatCurrency(tx.amount)}
        </span>
      </td>

      {/* Ações */}
      <td className="py-3 px-2">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => onEdit(tx)}
            title="Editar"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-neon hover:bg-neon/10 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(tx.id)}
            title="Excluir"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-red hover:bg-red/10 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

// ============================================
// Componente principal
// ============================================

export default function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  onAdd,
}: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return transactions
      .filter((tx) => {
        if (filterType !== "all" && tx.type !== filterType) return false;
        if (q && !tx.title.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") {
          cmp = parseDate(a.date).getTime() - parseDate(b.date).getTime();
        } else {
          cmp = a.amount - b.amount;
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [transactions, search, sortKey, sortDir, filterType]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col)
      return (
        <svg className="w-3 h-3 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    return sortDir === "desc" ? (
      <svg className="w-3 h-3 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    ) : (
      <svg className="w-3 h-3 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  const hasTransactions = transactions.length > 0;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header com busca e controles */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Busca */}
          <div className="relative flex-1 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar transação..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-white/10 bg-background text-sm text-white placeholder:text-white/25 outline-none focus:border-neon/40 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Controles: filtro tipo + ordenação */}
          {/* Mobile: ocupa linha inteira com margem esquerda; Desktop: inline */}
          <div className="flex items-center gap-2 pl-0 sm:pl-0 mt-1 sm:mt-0">
            {/* Filtro por tipo */}
            <div className="w-32">
              <Select value={filterType} onChange={(v) => setFilterType(v as FilterType)}>
                <option value="all">Todos</option>
                <option value="income">↑ Receitas</option>
                <option value="expense">↓ Despesas</option>
              </Select>
            </div>

            {/* Ordenação */}
            <div className="w-36">
              <Select
                value={`${sortKey}-${sortDir}`}
                onChange={(v) => {
                  const [key, dir] = v.split("-") as [SortKey, SortDir];
                  setSortKey(key);
                  setSortDir(dir);
                }}
              >
                <option value="date-desc">Mais recentes</option>
                <option value="date-asc">Mais antigas</option>
                <option value="amount-desc">Maior valor</option>
                <option value="amount-asc">Menor valor</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Contador de resultados */}
        {hasTransactions && (
          <p className="text-xs text-white/30 mt-2">
            {filtered.length === 0
              ? "Nenhuma transação encontrada"
              : filtered.length === transactions.length
              ? `${transactions.length} transação${transactions.length !== 1 ? "ões" : "ão"}`
              : `Mostrando ${filtered.length} de ${transactions.length}`}
          </p>
        )}
      </div>

      {/* Tabela */}
      {!hasTransactions ? (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-white/40 text-sm mb-4">Nenhuma transação registrada ainda.</p>
          <button
            onClick={onAdd}
            className="px-4 py-2 text-sm rounded-lg bg-neon text-background font-semibold hover:opacity-85 active:scale-95 transition-all duration-200"
          >
            + Registrar primeira transação
          </button>
        </div>
      ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-2.5 px-3 text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="text-left py-2.5 px-2 hidden md:table-cell text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th
                    className="text-left py-2.5 pl-2 pr-3 hidden sm:table-cell text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-white/60 transition-colors"
                    onClick={() => handleSort("date")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Data
                      <SortIcon col="date" />
                    </span>
                  </th>
                  <th
                    className="text-right py-2.5 pl-3 pr-4 text-xs font-semibold text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-white/60 transition-colors"
                    onClick={() => handleSort("amount")}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      Valor
                      <SortIcon col="amount" />
                    </span>
                  </th>
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted text-sm">Nenhuma transação corresponde à busca.</p>
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-xs text-neon hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )
      }
    </div>
  );
}
