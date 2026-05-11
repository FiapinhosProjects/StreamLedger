// --- MÓDULO DE TRANSAÇÕES ---

import { saveTransactions } from '../data/storage.js';
import { updateMetrics } from '../ui/render.js';
import { renderTransactions } from '../ui/render.js';
import { closeModal } from '../ui/modals.js';
import { isDuplicate } from '../utils/calculations.js';
import { refreshProjection } from './projection.js';

export let transactions = [];

export const setTransactions = (data) => {
    transactions = data;
};

export const saveAndRefresh = () => {
    saveTransactions(transactions);
    updateMetrics(transactions);
    renderTransactions(transactions);
    refreshProjection();
};

export const processSaveTransaction = (data) => {
    const editIdEl = document.getElementById('edit-id');
    const id = editIdEl ? editIdEl.value : '';

    if (id) {
        const index = transactions.findIndex(t => t.id === parseInt(id));
        transactions[index] = data;
    } else {
        transactions.push(data);
    }

    saveAndRefresh();
    closeModal();
};

export const buildTransactionData = () => {
    const id = document.getElementById('edit-id').value;
    const rawAmountStr = document.getElementById('amount').value.replace(/\./g, '').replace(',', '.');
    const amountFloat = parseFloat(rawAmountStr);

    return {
        id: id ? parseInt(id) : Date.now(),
        title: document.getElementById('desc').value,
        amount: amountFloat,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        date: id ? transactions.find(t => t.id === parseInt(id)).date : new Date().toLocaleDateString('pt-BR')
    };
};

export const checkDuplicate = (data) => {
    return isDuplicate(transactions, data);
};
