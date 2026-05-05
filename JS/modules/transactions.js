// --- MÓDULO DE TRANSAÇÕES ---
 
import { saveTransactions } from '../data/storage.js';
import { updateMetrics } from '../ui/render.js';
import { renderTransactions } from '../ui/render.js';
import { closeModal } from '../ui/modals.js';
 
export let transactions = [];
 
export const setTransactions = (data) => {
    transactions = data;
};
 
export const saveAndRefresh = () => {
    saveTransactions(transactions);
    updateMetrics(transactions);
    renderTransactions(transactions);
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
