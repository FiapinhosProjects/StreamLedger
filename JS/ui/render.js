import { formatCurrency } from "../utils/format.js";

export const renderTransactions = (transactions, transactionList) => {
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
                        <img src="assets/${isIncome ? 'Lucro.svg' : 'Despesa.svg'}" width="20">
                    </div>
                    <div>
                        <div class="fw-bold">${t.title}</div>
                        <div class="text-body-tertiary small">${t.category} · ${t.date}</div>
                    </div>
                </div>
                <div class="fw-bold ${isIncome ? 'text-success' : 'text-danger'}">
                    ${isIncome ? '+' : '-'}${formatCurrency(t.amount)}
                </div>
            </div>
        `;

        transactionList.innerHTML += itemHtml;
    });
};