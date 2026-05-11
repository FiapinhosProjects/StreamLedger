import { getTransactions } from '../data/storage.js';
import { getTotalByType } from '../utils/calculations.js';
import { formatCurrency } from '../utils/format.js';
import { applyAmountMask } from '../utils/format.js';

export const initProjection = () => {
    const btn = document.getElementById('calc-projection-btn');
    const goalInput = document.getElementById('goal-input');
    const resultDiv = document.getElementById('projection-result');

    if (!btn || !goalInput || !resultDiv) return;

    applyAmountMask(goalInput);

    btn.addEventListener('click', () => {
        const transactions = getTransactions();
        const result = calculateGoalProgress(transactions, goalInput.value);
        resultDiv.innerHTML = result;
    });
};

const calculateGoalProgress = (transactions, goalStr) => {
    const goal = parseFloat(goalStr.replace(/\./g, '').replace(',', '.'));

    if (!goal || goal <= 0) {
        return `<p class="text-warning small mb-0">Informe um valor de meta válido.</p>`;
    }

    if (transactions.length === 0) {
        return `<p class="text-body-tertiary small mb-0">Registre transações para calcular o progresso.</p>`;
    }

    // f(x) = ax (função de 1º grau)
    // a = lucro acumulado (receitas - despesas)
    // O progresso é a razão linear entre o acumulado e a meta
    const revenue = getTotalByType(transactions, 'income');
    const costs = getTotalByType(transactions, 'expense');
    const currentBalance = revenue - costs;

    if (currentBalance <= 0) {
        return `
            <p class="text-danger small mb-0">
                Seu saldo atual é ${formatCurrency(currentBalance)}.
                Você precisa de um lucro positivo para avançar em direção à meta.
            </p>`;
    }

    if (currentBalance >= goal) {
        return `
            <p class="small mb-0" style="color: var(--neon);">
                Meta atingida! Saldo atual: ${formatCurrency(currentBalance)}
            </p>`;
    }

    const progress = Math.round((currentBalance / goal) * 100);
    const remaining = goal - currentBalance;

    return `
        <div class="small">
            <p class="mb-2">
                <strong style="color: var(--neon);">${progress}%</strong> da meta atingida
            </p>
            <p class="text-body-secondary mb-2">
                Acumulado: ${formatCurrency(currentBalance)} | Faltam: ${formatCurrency(remaining)}
            </p>
            <div class="progress" style="height: 8px; background: rgba(255,255,255,0.05);">
                <div class="progress-bar" role="progressbar"
                     style="width: ${progress}%; background: var(--neon);"
                     aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
                </div>
            </div>
        </div>`;
};
