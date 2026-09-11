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
    monthsToProject?: number;
}

export default function ExponentialGrowthChart({ transactions, monthsToProject = 3 }: Props) {
    const monthly = getMonthlyTotals(transactions, "income");

    if (monthly.length < 1) {
        return (
            <div className="bg-card border border-neon/30 rounded-2xl p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center">
                        <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Pronto para analisar</h3>
                <p className="text-sm text-muted">
                    Registre suas receitas para ver a tendência de crescimento do seu faturamento.
                </p>
            </div>
        );
    }

    const values = monthly.map((m) => m.total);
    const model = calculateExponentialGrowth(values);

    const historicalLabels = monthly.map((m) => m.month);
    const futureLabels = Array.from({ length: monthsToProject }, (_, i) => `+${i + 1}m`);
    const labels = [...historicalLabels, ...futureLabels];

    const fittedCurve = labels.map((_, t) => projectExponentialValue(model, t));

    const data = {
        labels,
        datasets: [
            {
                label: "Tendência",
                data: fittedCurve,
                borderColor: "#5DFF9B",
                backgroundColor: "rgba(93,255,155,0.1)",
                pointBackgroundColor: "#5DFF9B",
                pointBorderColor: "#5DFF9B",
                tension: 0.4,
                fill: true,
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: "rgba(93,255,155,0.08)" },
                ticks: {
                    color: "#e0e0e0",
                    callback: (value: number | string) => formatCurrency(Number(value)),
                },
                border: { display: false },
            },
            x: {
                grid: { display: false },
                ticks: { color: "#e0e0e0" },
                border: { display: false },
            },
        },
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(36,36,36,0.95)",
                titleColor: "#5DFF9B",
                bodyColor: "#ffffff",
                borderColor: "rgba(93,255,155,0.3)",
                borderWidth: 1,
                padding: 12,
                callbacks: {
                    label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
                        const label = ctx.dataset.label || "";
                        const val = ctx.parsed.y !== null ? formatCurrency(ctx.parsed.y) : "sem dado";
                        return ` ${label}: ${val}`;
                    },
                },
            },
        },
    };

    const nextValue = projectExponentialValue(model, values.length);
    const goodFit = model.rSquared >= 0.7;

    return (
        <div className="bg-card border border-neon/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-neon/10 border border-neon/30 flex items-center justify-center">
                    <svg className="w-4 h-4 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold">Projeção de Crescimento</h3>
            </div>
            <p className="text-sm text-muted mb-6">
                Modelo exponencial R(t) = R0 · e<sup className="text-xs">k·t</sup> ajustado ao seu histórico
            </p>

            <div className="h-[300px] mb-6">
                <Line data={data} options={options} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-neon/20">
                    <p className="text-xs text-muted mb-1">Base (R0)</p>
                    <p className="text-lg font-bold text-neon">{formatCurrency(model.r0)}</p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-neon/20">
                    <p className="text-xs text-muted mb-1">Crescimento</p>
                    <p className={`text-lg font-bold ${model.monthlyGrowthRate >= 0 ? "text-neon" : "text-red"}`}>
                        {model.monthlyGrowthRate >= 0 ? "+" : ""}{model.monthlyGrowthRate.toFixed(1)}%
                    </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-neon/20">
                    <p className="text-xs text-muted mb-1">Duplicar em</p>
                    <p className="text-lg font-bold text-neon">
                        {model.doublingTime ? `${model.doublingTime.toFixed(1)}m` : "—"}
                    </p>
                </div>
                <div className="bg-[#1a1a1a] rounded-xl p-4 border border-neon/20">
                    <p className="text-xs text-muted mb-1">Precisão (R²)</p>
                    <p className={`text-lg font-bold ${goodFit ? "text-neon" : "text-yellow"}`}>
                        {(model.rSquared * 100).toFixed(0)}%
                    </p>
                </div>
            </div>

            <div className="bg-neon/5 border border-neon/20 rounded-xl p-4">
                <p className="text-sm text-muted">
                    Próximo mês:{" "}
                    <span className="text-neon font-bold text-lg">{formatCurrency(nextValue)}</span>
                    {model.monthlyGrowthRate > 0 && (
                        <span className="text-neon ml-2">↑ {model.monthlyGrowthRate.toFixed(1)}%</span>
                    )}
                </p>
            </div>
        </div>
    );
}
