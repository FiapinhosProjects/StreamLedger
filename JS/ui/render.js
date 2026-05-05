// --- MÓDULO DE RENDERIZAÇÃO ---

import { formatCurrency } from '../utils/format.js';
import { revenueChartInstance, expenseChartInstance } from '../charts/charts.js';

const transactionList = document.querySelector('.transactions');

export const renderTransactions = (transactions) => {
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
            <div class="d-flex justify-content-between align-items-center p-3 rounded-3" style="background: rgba(255, 255, 255, 0.05);">
                <div>
                    <div class="fw-bold" style="color: #fff;">${t.title}</div>
                    <div class="text-body-tertiary small">${t.category}</div>
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