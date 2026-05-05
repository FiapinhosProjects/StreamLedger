// --- PONTO DE ENTRADA PRINCIPAL ---

import { getTransactions } from './data/storage.js';
import { applyAmountMask } from './utils/format.js';
import { setTransactions, saveAndRefresh } from './modules/transactions.js';
import { initChart, initExpenseChart } from './charts/charts.js';
import {
    openModal,
    closeModal,
    deleteTransaction,
    closeDeleteModal,
    confirmDelete,
    closeDuplicateModal,
    confirmDuplicate,
    initFormSubmit,
    initModalResetListener
} from './ui/modals.js';

// --- EXPÕE FUNÇÕES GLOBAIS (usadas nos atributos onclick do HTML) ---
window.openModal = openModal;
window.closeModal = closeModal;
window.deleteTransaction = deleteTransaction;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.closeDuplicateModal = closeDuplicateModal;
window.confirmDuplicate = confirmDuplicate;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados do localStorage
    const stored = getTransactions();
    setTransactions(stored);

    // Aplica máscara no input de valor
    const amountInput = document.getElementById('amount');
    applyAmountMask(amountInput);

    // Inicializa os gráficos
    initChart();
    initExpenseChart();

    // Inicializa o submit do formulário
    initFormSubmit();

    // Inicializa o listener de reset do modal
    initModalResetListener();

    // Renderiza métricas e transações
    saveAndRefresh();
});
