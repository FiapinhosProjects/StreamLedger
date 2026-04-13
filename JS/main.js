// Seleção de elementos principais
const transactionList = document.querySelector('.transactions');
const modal = document.getElementById('modal-transaction');
const modalDelete = document.getElementById('modal-delete');
const modalDuplicate = document.getElementById('modal-duplicate');
const transactionForm = document.getElementById('transaction-form');
const btnNewTransaction = document.querySelector('.cta-btn');
const amountInput = document.getElementById('amount');

// Busca os dados do LocalStorage ou inicia um array vazio
let transactions = JSON.parse(localStorage.getItem('streamledger_data')) || [];
let transactionToDelete = null;
let pendingTransaction = null; // Guarda os dados para caso de duplicidade

// --- MÁSCARA DE MOEDA EM TEMPO REAL ---
// Verificamos se o amountInput existe, para não travar o index.html
if (amountInput) {
    amountInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value === "") {
            e.target.value = "";
            return;
        }
        value = (parseInt(value, 10) / 100).toFixed(2);
        value = value.replace(".", ",");
        value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
        e.target.value = value;
    });
}

// Formata número do banco de dados para o input
const formatToInput = (value) => {
    let formatted = value.toFixed(2).replace(".", ",");
    return formatted.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
};

// Formata valores para a tela com o "R$"
const formatCurrency = (value) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// --- FUNÇÕES DO MODAL DE CADASTRO/EDIÇÃO ---
// Mudança Crucial: 'window.openModal' garante que os botões do HTML consigam chamar a função
window.openModal = (id = null) => {
    if (!modal) return;

    modal.style.display = 'flex';

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
};

window.closeModal = () => {
    if (modal) modal.style.display = 'none';
};

// --- FUNÇÕES DO MODAL DE EXCLUSÃO ---
window.deleteTransaction = (id) => {
    if (!modalDelete) return;
    transactionToDelete = id;
    modalDelete.style.display = 'flex';
};

window.closeDeleteModal = () => {
    if (modalDelete) modalDelete.style.display = 'none';
    transactionToDelete = null;
};

window.confirmDelete = () => {
    if (transactionToDelete !== null) {
        transactions = transactions.filter(t => t.id !== transactionToDelete);
        saveAndRefresh();
        closeDeleteModal();
    }
};

// --- FUNÇÕES DO MODAL DE DUPLICIDADE ---
window.closeDuplicateModal = () => {
    if (modalDuplicate) modalDuplicate.style.display = 'none';
    pendingTransaction = null;
};

window.confirmDuplicate = () => {
    if (pendingTransaction) {
        processSaveTransaction(pendingTransaction);
        closeDuplicateModal();
    }
};

// --- LÓGICA DE INTERFACE ---
const updateMetrics = () => {
    const revenue = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const costs = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const valueCards = document.querySelectorAll('.metric-value');
    if (valueCards.length >= 3) {
        valueCards[0].innerText = formatCurrency(revenue);
        valueCards[1].innerText = formatCurrency(costs);
        valueCards[2].innerText = formatCurrency(revenue - costs);
    }
};

const renderTransactions = () => {
    if (!transactionList) return;

    const header = `
        <div class="transactions-header">
            <h1 class="fs-4 text-neon">Movimentações Recentes</h1>
            <p class="transactions-subtitle text-secondary">Últimas transações registradas</p>
        </div>`;

    transactionList.innerHTML = header;

    if (transactions.length === 0) {
        transactionList.innerHTML += `<p style="color: #aaa; text-align: center; padding: 20px;">Nenhuma transação registrada ainda.</p>`;
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const isIncome = t.type === 'income';
        const itemHtml = `
            <div class="transaction-item d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-25 hover-bg">
                <div class="trans-left d-flex align-items-center gap-3">
                <div class="trans-avatar d-flex align-items-center justify-content-center rounded" style="width:40px; height:40px; background: rgba(255,255,255,0.05);">
                    <img src="assets/${isIncome ? 'Lucro.svg' : 'Despesa.svg'}" alt="${isIncome ? 'Lucro' : 'Despesa'}" width="20">
                </div>
                <div>
                    <div class="trans-title fw-bold text-white">${t.title}</div>
                    <div class="trans-meta text-secondary" style="font-size: 12px;">${t.category} · ${t.date}</div>
                </div>
            </div>
            <div class="d-flex align-items-center gap-3">
                <div class="trans-amount fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
                <div class="d-flex gap-2">
                    <button onclick="window.openModal(${t.id})" class="btn-edit" title="Editar">✎</button>
                    <button onclick="window.deleteTransaction(${t.id})" class="btn-delete" title="Excluir">✖</button>
                </div>
            </div>
        </div>`;
        transactionList.innerHTML += itemHtml;
    });
};

// --- SALVANDO DADOS ---
if (transactionForm) {
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
            if (modalDuplicate) modalDuplicate.style.display = 'flex';
            return;
        }

        processSaveTransaction(data);
    };
}

const processSaveTransaction = (data) => {
    const id = document.getElementById('edit-id').value;
    if (id) {
        const index = transactions.findIndex(t => t.id === parseInt(id));
        transactions[index] = data;
    } else {
        transactions.push(data);
    }

    saveAndRefresh();
    window.closeModal();
};

const saveAndRefresh = () => {
    localStorage.setItem('streamledger_data', JSON.stringify(transactions));
    updateMetrics();
    renderTransactions();
};

// --- EVENTOS GERAIS ---
window.onclick = (event) => {
    if (event.target == modal) window.closeModal();
    if (event.target == modalDelete) window.closeDeleteModal();
    if (event.target == modalDuplicate) window.closeDuplicateModal();
};

document.addEventListener('DOMContentLoaded', saveAndRefresh);