// ============================================
// RevenueChart.tsx - Gráfico de barras das receitas
// Mostra quanto veio de cada fonte (Twitch, YouTube, Donates)
// ============================================

"use client";

import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Transaction } from "@/lib/storage";
import { getTotalByCategory } from "@/lib/calculations";

// Registra os componentes do Chart.js que vamos usar
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Props do componente
interface Props {
  transactions: Transaction[];
}

export default function RevenueChart({ transactions }: Props) {
  // Calcula o total de cada fonte de receita
  const twitch = getTotalByCategory(transactions, "income", "Twitch Subs");
  const youtube = getTotalByCategory(transactions, "income", "YouTube AdSense");
  const donates = getTotalByCategory(transactions, "income", "Donates");

  // Dados do gráfico de barras
  const data = {
    labels: ["Total Arrecadado"],
    datasets: [
      { label: "Twitch", data: [twitch], backgroundColor: "#9147FF", borderRadius: 6, barPercentage: 0.4 },
      { label: "YouTube", data: [youtube], backgroundColor: "#FB2C36", borderRadius: 6, barPercentage: 0.4 },
      { label: "Donates", data: [donates], backgroundColor: "#00FF7F", borderRadius: 6, barPercentage: 0.4 },
    ],
  };

  // Configurações visuais do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      // Eixo Y (vertical) - valores
      y: {
        beginAtZero: true,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "#a0a0a0" },
        border: { display: false },
      },
      // Eixo X (horizontal) - labels
      x: {
        grid: { display: false },
        ticks: { color: "#a0a0a0" },
        border: { display: false },
      },
    },
    plugins: {
      // Legenda embaixo do gráfico
      legend: {
        position: "bottom" as const,
        labels: { color: "#a0a0a0", usePointStyle: true, padding: 20 },
      },
      // Tooltip ao passar o mouse
      tooltip: {
        backgroundColor: "rgba(18,18,20,0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        callbacks: {
          // Formata o valor no tooltip como moeda brasileira
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
            const label = ctx.dataset.label || "";
            const val = ctx.parsed.y !== null
              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ctx.parsed.y)
              : "";
            return `${label}: ${val}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card border border-neon/30 rounded-2xl p-5 shadow-lg">
      <h3 className="text-lg font-bold mb-1">Receitas por fonte</h3>
      <p className="text-sm text-muted mb-4">Evolução Mensal da plataforma</p>
      <div className="h-[400px]">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
