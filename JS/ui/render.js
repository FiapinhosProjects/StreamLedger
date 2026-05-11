// --- MÓDULO DE RENDERIZAÇÃO ---

import { formatCurrency, formatToInput } from '../utils/format.js';
import { escapeHTML } from '../utils/sanitize.js';
import { revenueChartInstance, expenseChartInstance } from '../charts/charts.js';

const transactionList = document.querySelector('.transactions');

// --- HELPER FUNÇÕES LOCAIS ---
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr; // Retorna como String caso queira adicionar formatação depois
};

const getCategoryIcon = (category) => {
    switch(category) {
        case 'Twitch Subs': return '<img src="assets/Twitch.svg" width="20">';
        case 'YouTube AdSense': return '<img src="assets/Youtube.svg" width="20">';
        case 'Donates': return '<img src="assets/Donate.svg" width="20">';
        case 'Setup': return '<img src="assets/equipamento.svg" width="20">';
        case 'Software': return '<img src="assets/software.svg" width="20">';
        default: return '<img src="assets/Outros.svg" width="20">';
    }
};

export const renderTransactions = (transactions) => {
    if (!transactionList) return;

    const header = `
        <div class="transactions-header">
            <h1 class="fs-4">Movimentações Recentes</h1>
            <p class="transactions-subtitle text-body-secondary">Últimas transações registradas</p>
        </div>`;

    transactionList.innerHTML = header;

    if (transactions.length === 0) {
        transactionList.innerHTML += `
            <div class="text-center p-5">
                <p class="text-body-tertiary mb-3">Nenhuma transação registrada ainda.</p>
                <button onclick="window.openModal()" class="btn btn-sm" style="background: var(--neon); color: #121214; font-weight: 600; border-radius: 8px; padding: 0.5rem 1.25rem;">
                    + Registrar primeira transação
                </button>
            </div>`;
        return;
    }

    transactions.slice().reverse().forEach(t => {
        const isIncome = t.type === 'income';
        const isDespesa = t.type === 'expense';
        
        // Sanitização de entradas do usuário contra XSS
        const safeTitle = escapeHTML(t.title);
        const safeCategory = escapeHTML(t.category);

        const itemHtml = `
            <div class="transaction-item highlight-border d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center p-3 mb-2 rounded" 
                 style="background: var(--card);">
                <div class="d-flex align-items-center gap-3 mb-2 mb-sm-0">
                  <div class="cat-icon bg-opacity-10 d-flex align-items-center justify-content-center border"
                       style="width: 40px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1) !important;">
                    ${getCategoryIcon(t.category)}
                  </div>
                  <div>
                    <h6 class="mb-0 fw-semibold">${safeTitle}</h6>
                    <small class="text-body-tertiary">${formatDate(t.date)} &bull; ${safeCategory}</small>
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

export const renderTopExpenses = (transactions) => {
    const topExpensesList = document.getElementById('topExpensesList');
    if (!topExpensesList) return;

    const expenses = transactions.filter(t => t.type === 'expense')
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

    topExpensesList.innerHTML = '';

    if (expenses.length === 0) {
        topExpensesList.innerHTML = `<p class="text-body-tertiary small">Nenhuma despesa registrada.</p>`;
        return;
    }

    expenses.forEach(t => {
        const itemHtml = `
            <div class="d-flex justify-content-between align-items-center p-2 mb-2 rounded" style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);">
              <div class="d-flex align-items-center gap-2">
                ${getCategoryIcon(t.category)}
                <span class="small fw-medium">${escapeHTML(t.title)}</span>
              </div>
              <div class="fw-bold text-danger">
                  ${formatCurrency(t.amount)}
              </div>
            </div>
        `;
        topExpensesList.innerHTML += itemHtml;
    });
};

export const updateMetrics = (transactions) => {
    const isReceitasPage = window.location.pathname.includes('receitas.html');
    const isDespesasPage = window.location.pathname.includes('despesas.html');

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
    } else if (isDespesasPage) {
        const equipAmount = transactions.filter(t => t.type === 'expense' && t.category === 'Setup').reduce((acc, t) => acc + t.amount, 0);
        const softAmount = transactions.filter(t => t.type === 'expense' && t.category === 'Software').reduce((acc, t) => acc + t.amount, 0);
        const outrosAmount = transactions.filter(t => t.type === 'expense' && t.category !== 'Setup' && t.category !== 'Software').reduce((acc, t) => acc + t.amount, 0);

        const valueCards = document.querySelectorAll('.metric-value');
        if (valueCards.length >= 3) {
            valueCards[0].innerText = formatCurrency(equipAmount);
            valueCards[1].innerText = formatCurrency(softAmount);
            valueCards[2].innerText = formatCurrency(outrosAmount);
        }

        if (expenseChartInstance) {
            expenseChartInstance.data.datasets[0].data = [equipAmount, softAmount, outrosAmount];
            expenseChartInstance.update();
        }

        renderTopExpenses(transactions);
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