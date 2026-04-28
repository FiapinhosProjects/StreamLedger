import { getTransactions, saveTransactions } from './services/storage.js';
import { applyCurrencyMask } from './utils/format.js';
import { processSaveTransaction, isDuplicate } from './modules/transactions.js';
import { renderTransactions } from './ui/render.js';
import { initChart, initExpenseChart } from './charts/charts.js';
import { updateRevenueChart } from './charts/charts.js';

// ELEMENTOS
const transactionList = document.querySelector('.transactions');
const transactionForm = document.getElementById('transaction-form');
const amountInput = document.getElementById('amount');

let transactions = getTransactions();

// máscara
if (amountInput) applyCurrencyMask(amountInput);

// salvar
const saveAndRefresh = () => {
    updateRevenueChart(transactions);
    saveTransactions(transactions);
    renderTransactions(transactions, transactionList);
};

// FORM
if (transactionForm) {
    transactionForm.onsubmit = (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;

        let rawAmountStr = document.getElementById('amount').value
            .replace(/\./g, '')
            .replace(',', '.');

        const data = {
            id: id ? parseInt(id) : Date.now(),
            title: document.getElementById('desc').value,
            amount: parseFloat(rawAmountStr),
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: id ? transactions.find(t => t.id === parseInt(id)).date : new Date().toLocaleDateString('pt-BR')
        };

        if (isDuplicate(transactions, data)) {
            alert('Transação duplicada!');
            return;
        }

        transactions = processSaveTransaction(transactions, data);

        saveAndRefresh();
        transactionForm.reset();
    };
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    initExpenseChart();
    saveAndRefresh();
});