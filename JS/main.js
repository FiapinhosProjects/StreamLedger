// Seleção de elementos principais
const transactionList = document.querySelector('.transactions');
const modalEl = document.getElementById('modal-transaction');
const modalDeleteEl = document.getElementById('modal-delete');
const modalDuplicateEl = document.getElementById('modal-duplicate');
const transactionForm = document.getElementById('transaction-form');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');

// Bootstrap Modal instances
const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
const bsModalDelete = modalDeleteEl ? new bootstrap.Modal(modalDeleteEl) : null;
const bsModalDuplicate = modalDuplicateEl ? new bootstrap.Modal(modalDuplicateEl) : null;

// Busca os dados do LocalStorage ou inicia um array vazio
let transactions = JSON.parse(localStorage.getItem('streamledger_data')) || [];
let transactionToDelete = null;
let pendingTransaction = null;

// --- MÁSCARA DE MOEDA EM TEMPO REAL ---
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

let revenueChartInstance = null;

// --- GRÁFICO (Chart.js) ---
const initChart = () => {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Total Arrecadado'],
            datasets: [
                {
                    label: 'twitch',
                    data: [0],
                    backgroundColor: '#9147FF',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                },
                {
                    label: 'youtube',
                    data: [0],
                    backgroundColor: '#FB2C36',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                },
                {
                    label: 'donates',
                    data: [0],
                    backgroundColor: '#00FF7F',
                    borderRadius: 6,
                    barPercentage: 0.4,
                    categoryPercentage: 0.5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#a0a0a0',
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false,
                    },
                    ticks: {
                        color: '#a0a0a0',
                    },
                    border: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#a0a0a0',
                        usePointStyle: true,
                        boxWidth: 10,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(18, 18, 20, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
        }
    });
};

const updateCategoryOptions = () => {
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

window.openModal = (id = null) => {
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

window.closeModal = () => {
    if (bsModal) bsModal.hide();
};

// --- FUNÇÕES DO MODAL DE EXCLUSÃO ---
window.deleteTransaction = (id) => {
    if (!bsModalDelete) return;
    transactionToDelete = id;
    bsModalDelete.show();
};

window.closeDeleteModal = () => {
    if (bsModalDelete) bsModalDelete.hide();
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
    if (bsModalDuplicate) bsModalDuplicate.hide();
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
    const isReceitasPage = window.location.pathname.includes('receitas.html');

    if (isReceitasPage) {
        const twitchSubsIncomes = transactions.filter(t => t.type === 'income' && t.category === 'Twitch Subs').reduce((acc, t) => acc + t.amount, 0);
        const youtubeAdsenseIncomes = transactions.filter(t => t.type === 'income' && t.category === 'YouTube AdSense').reduce((acc, t) => acc + t.amount, 0);
        const donatesIncomes = transactions.filter(t => t.type === 'income' && t.category === 'Donates').reduce((acc, t) => acc + t.amount, 0);

        const valueCards = document.querySelectorAll('.fs-3.fw-bold');
        if (valueCards.length >= 3) {
            valueCards[0].innerText = formatCurrency(twitchSubsIncomes);
            valueCards[1].innerText = formatCurrency(youtubeAdsenseIncomes);
            valueCards[2].innerText = formatCurrency(donatesIncomes);
        }

        if (revenueChartInstance) {
            revenueChartInstance.data.datasets[0].data = [twitchSubsIncomes];
            revenueChartInstance.data.datasets[1].data = [youtubeAdsenseIncomes];
            revenueChartInstance.data.datasets[2].data = [donatesIncomes];
            revenueChartInstance.update();
        }
    } else {
        const revenue = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
        const costs = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

        const valueCards = document.querySelectorAll('.metric-value');
        if (valueCards.length >= 3) {
            valueCards[0].innerText = formatCurrency(revenue);
            valueCards[1].innerText = formatCurrency(costs);
            valueCards[2].innerText = formatCurrency(revenue - costs);
        }
    }
};

const renderTransactions = () => {
    if (!transactionList) return;

    const header = `
        <div class="transactions-header">
            <h1 class="fs-4">Movimentações Recentes</h1>
            <p class="transactions-subtitle text-body-secondary">Últimas transações registradas</p>
        </div>`;

    transactionList.innerHTML = header;

    if (transactions.length === 0) {
        transactionList.innerHTML += `<p class="text-body-tertiary text-center p-4">Nenhuma transação registrada ainda.</p>`;
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const isIncome = t.type === 'income';
        const itemHtml = `
            <div class="transaction-item d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-10">
                <div class="d-flex align-items-center gap-3">
                    <div class="d-flex align-items-center justify-content-center rounded"
                         style="width:40px; height:40px; background: rgba(255,255,255,0.05);">
                        <img src="assets/${isIncome ? 'Lucro.svg' : 'Despesa.svg'}" alt="${isIncome ? 'Lucro' : 'Despesa'}" width="20">
                    </div>
                    <div>
                        <div class="fw-bold">${t.title}</div>
                        <div class="text-body-tertiary small">${t.category} · ${t.date}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-3">
                    <div class="fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
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
            if (bsModalDuplicate) bsModalDuplicate.show();
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

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    saveAndRefresh();
});

// --- RESETANDO MODAL ---
if (modalEl) {
    modalEl.addEventListener('show.bs.modal', () => {
        const editId = document.getElementById('edit-id').value;
        if (!editId) {
            transactionForm.reset();
            document.getElementById('modal-title').innerText = "Nova Transação";
            updateCategoryOptions();
        }
    });
}
