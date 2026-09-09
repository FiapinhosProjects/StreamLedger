"use client";

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Transaction } from "@/lib/storage";
import {
    getMonthlyTotals,
    calculateExponentialGrowth,
    projectExponentialValue,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";

// Registra os componentes do Chart.js necessários para o gráfico de linha
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

interface Props {
    transactions: Transaction[];
    monthsToProject?: number; // quantos meses futuros projetar (padrão: 3)
}

// Dashboard Matemático — modela o crescimento do faturamento com uma
// função exponencial R(t) = R0 * e^(k*t), ajustada aos dados históricos
// por regressão linear sobre ln(R(t)) (mínimos quadrados).
export default function ExponentialGrowthChart({ transactions, monthsToProject = 3 }: Props) {
    const monthly = getMonthlyTotals(transactions, "income");

    // Precisa de pelo menos 2 meses de histórico para ajustar a curva
    if (monthly.length < 2) {
        return (
            <div className="bg-card border border-neon/30 rounded-2xl p-5 shadow-lg">
                <h3 className="text-lg font-bold mb-1">📈 Dashboard Matemático — Projeção de Crescimento</h3>
                <p className="text-sm text-muted">
                    Registre receitas em pelo menos 2 meses diferentes para gerar a projeção exponencial.
                </p>
            </div>
        );
    }

    const values = monthly.map((m) => m.total);
    const model = calculateExponentialGrowth(values);

    // Índices de tempo: histórico vai de t=0 até t=n-1; projeção continua depois
    const historicalLabels = monthly.map((m) => m.month);
    const futureLabels = Array.from({ length: monthsToProject }, (_, i) => `t+${i + 1} (proj.)`);
    const labels = [...historicalLabels, ...futureLabels];

    // Curva ajustada R(t) = R0 * e^(k*t) para todos os pontos (histórico + futuro)
    const fittedCurve = labels.map((_, t) => projectExponentialValue(model, t));

    // Série "real" só aparece nos meses com dados históricos (fica em branco na projeção)
    const realSeries = [...values, ...Array(monthsToProject).fill(null)];

    const data = {
        labels,
        datasets: [
            {
                label: "Faturamento real",
                data: realSeries,
                borderColor: "#00FF7F",
                backgroundColor: "rgba(0,255,127,0.15)",
                pointBackgroundColor: "#00FF7F",
                tension: 0.3,
                fill: true,
            },
            {
                label: "Modelo R(t) = R0·e^(kt)",
                data: fittedCurve,
                borderColor: "#a78bfa",
                borderDash: [6, 4],
                pointRadius: 2,
                backgroundColor: "transparent",
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "rgba(255,255,255,0.05)" },
                ticks: { color: "#a0a0a0" },
                border: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: "#a0a0a0" },
                border: { display: false },
            },
        },
        plugins: {
            legend: {
                position: "bottom" as const,
                labels: { color: "#a0a0a0", usePointStyle: true, padding: 20 },
            },
            tooltip: {
                backgroundColor: "rgba(18,18,20,0.9)",
                titleColor: "#fff",
                bodyColor: "#fff",
                callbacks: {
                    label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
                        const label = ctx.dataset.label || "";
                        const val = ctx.parsed.y !== null ? formatCurrency(ctx.parsed.y) : "sem dado";
                        return `${label}: ${val}`;
                    },
                },
            },
        },
    };

    const nextValue = projectExponentialValue(model, values.length); // t seguinte ao último mês
    const goodFit = model.rSquared >= 0.7;

    return (
        <div className="bg-card border border-neon/30 rounded-2xl p-5 shadow-lg">
            <h3 className="text-lg font-bold mb-1">📈 Dashboard Matemático — Projeção de Crescimento</h3>
            <p className="text-sm text-muted mb-4">
                Modelo exponencial R(t) = R0 · e^(k·t) ajustado ao histórico de faturamento.
            </p>

            <div className="h-[320px] mb-5">
                <Line data={data} options={options} />
            </div>

            {/* Cards com os parâmetros calculados do modelo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-header rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted">R0 (base)</p>
                    <p className="text-base font-bold">{formatCurrency(model.r0)}</p>
                </div>
                <div className="bg-header rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted">Taxa mensal (k)</p>
                    <p className="text-base font-bold">
                        {model.monthlyGrowthRate >= 0 ? "+" : ""}
                        {model.monthlyGrowthRate.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-header rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted">Tempo de duplicação</p>
                    <p className="text-base font-bold">
                        {model.doublingTime ? `${model.doublingTime.toFixed(1)} meses` : "N/A"}
                    </p>
                </div>
                <div className="bg-header rounded-xl p-3 border border-border">
                    <p className="text-xs text-muted">Ajuste do modelo (R²)</p>
                    <p className={`text-base font-bold ${goodFit ? "text-neon" : "text-yellow"}`}>
                        {(model.rSquared * 100).toFixed(1)}%
                    </p>
                </div>
            </div>

            <p className="text-sm text-muted mt-4">
                Projeção para o próximo mês (t = {values.length}):{" "}
                <strong className="text-neon">{formatCurrency(nextValue)}</strong>
            </p>
        </div>
    );
}