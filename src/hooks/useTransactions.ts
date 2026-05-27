// ============================================
// useTransactions.ts - Hook de gerenciamento de transações
// Controla adicionar, editar e excluir transações
// ============================================

"use client";

import { useState, useEffect } from "react";
import { Transaction, getTransactions, saveTransactions } from "@/lib/storage";

// Hook personalizado que gerencia todas as transações do app
export function useTransactions() {
  // Estado que guarda a lista de transações
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Quando o componente carrega, busca as transações salvas no localStorage
  useEffect(() => {
    const saved = getTransactions();
    setTransactions(saved);
  }, []);

  // Função interna que atualiza o estado E salva no localStorage
  function save(updated: Transaction[]) {
    setTransactions(updated);
    saveTransactions(updated);
  }

  // Adiciona uma nova transação à lista
  function addTransaction(data: Omit<Transaction, "id" | "date">) {
    // Cria a transação com id único e data de hoje
    const newTx: Transaction = {
      ...data,
      id: Date.now(),
      date: new Date().toLocaleDateString("pt-BR"),
    };

    // Adiciona no final da lista
    const updated = [...transactions, newTx];
    save(updated);
    return newTx;
  }

  // Edita uma transação existente pelo id
  function updateTransaction(id: number, data: Omit<Transaction, "id" | "date">) {
    // Percorre a lista e atualiza só a que tem o id igual
    const updated = transactions.map((t) => {
      if (t.id === id) {
        return { ...t, ...data };
      }
      return t;
    });

    save(updated);
  }

  // Remove uma transação pelo id
  function deleteTransaction(id: number) {
    // Filtra removendo a transação com o id informado
    const updated = transactions.filter((t) => t.id !== id);
    save(updated);
  }

  // Retorna os dados e funções para os componentes usarem
  return { transactions, addTransaction, updateTransaction, deleteTransaction };
}
