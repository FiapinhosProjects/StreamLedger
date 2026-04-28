// --- MÓDULO DE MODAIS ---
 
import { formatToInput } from '../utils/format.js';
import { transactions, processSaveTransaction, saveAndRefresh } from '../modules/transactions.js';
 
// Elementos dos modais
const modalEl = document.getElementById('modal-transaction');
const modalDeleteEl = document.getElementById('modal-delete');
const modalDuplicateEl = document.getElementById('modal-duplicate');
const transactionForm = document.getElementById('transaction-form');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
 
// Bootstrap Modal instances
export const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
export const bsModalDelete = modalDeleteEl ? new bootstrap.Modal(modalDeleteEl) : null;
export const bsModalDuplicate = modalDuplicateEl ? new bootstrap.Modal(modalDuplicateEl) : null;
 
let transactionToDelete = null;
let pendingTransaction = null;
 
// --- CATEGORIA ---
export const updateCategoryOptions = () => {
    if (!typeSelect || !categorySelect) return;
    const isExpense = typeSelect.value === 'expense';
    Array.from(categorySelect.options).forEach(option => {
        const val = option.value;
        if (['Twitch Subs', 'YouTube AdSense', 'Donates'].includes(val)) {
            option.disabled = isExpense;
            if (isExpense && categorySelect.value === val) {
                categorySelect.value = 'Geral';
            }
        }
    });
};
 
if (typeSelect) {
    typeSelect.addEventListener('change', updateCategoryOptions);
}
 
// --- MODAL DE TRANSAÇÃO ---
export const openModal = (id = null) => {
    if (!bsModal) return;
 
    if (id) {
        const t = transactions.find(item => item.id === id);
        document.getElementById('modal-title').innerText = "Editar Transação";
        document.getElementById('edit-id').value = t.id;
        document.getElementById('desc').value = t.title;
        document.getElementById('type').value = t.type;
        document.getElementById('category').value = t.category;
        document.getElementById('amount').value = formatToInput(t.amount);
    } else {
        document.getElementById('modal-title').innerText = "Nova Transação";
        transactionForm.reset();
        document.getElementById('edit-id').value = "";
    }
 
    updateCategoryOptions();
    bsModal.show();
};
 
export const closeModal = () => {
    if (bsModal) bsModal.hide();
};
 
// --- MODAL DE EXCLUSÃO ---
export const deleteTransaction = (id) => {
    if (!bsModalDelete) return;
    transactionToDelete = id;
    bsModalDelete.show();
};
 
export const closeDeleteModal = () => {
    if (bsModalDelete) bsModalDelete.hide();
    transactionToDelete = null;
};
 
export const confirmDelete = () => {
    if (transactionToDelete !== null) {
        const index = transactions.findIndex(t => t.id === transactionToDelete);
        if (index !== -1) transactions.splice(index, 1);
        saveAndRefresh();
        closeDeleteModal();
    }
};
 
// --- MODAL DE DUPLICIDADE ---
export const closeDuplicateModal = () => {
    if (bsModalDuplicate) bsModalDuplicate.hide();
    pendingTransaction = null;
};
 
export const confirmDuplicate = () => {
    if (pendingTransaction) {
        processSaveTransaction(pendingTransaction);
        closeDuplicateModal();
    }
};
 
// --- SUBMIT DO FORMULÁRIO ---
export const initFormSubmit = () => {
    if (!transactionForm) return;
 
    transactionForm.onsubmit = (e) => {
        e.preventDefault();
 
        const id = document.getElementById('edit-id').value;
        let rawAmountStr = document.getElementById('amount').value.replace(/\./g, '').replace(',', '.');
        const amountFloat = parseFloat(rawAmountStr);
 
        const data = {
            id: id ? parseInt(id) : Date.now(),
            title: document.getElementById('desc').value,
            amount: amountFloat,
            type: document.getElementById('type').value,
            category: document.getElementById('category').value,
            date: id ? transactions.find(t => t.id === parseInt(id)).date : new Date().toLocaleDateString('pt-BR')
        };
 
        const isDuplicate = transactions.some(t =>
            t.title.trim().toLowerCase() === data.title.trim().toLowerCase() &&
            t.amount === data.amount &&
            t.type === data.type &&
            t.id !== data.id
        );
 
        if (isDuplicate) {
            pendingTransaction = data;
            if (bsModalDuplicate) bsModalDuplicate.show();
            return;
        }
 
        processSaveTransaction(data);
    };
};
 
// --- RESET DO MODAL AO ABRIR ---
export const initModalResetListener = () => {
    if (!modalEl) return;
    modalEl.addEventListener('show.bs.modal', () => {
        const editId = document.getElementById('edit-id').value;
        if (!editId) {
            transactionForm.reset();
            document.getElementById('modal-title').innerText = "Nova Transação";
            updateCategoryOptions();
        }
    });
};