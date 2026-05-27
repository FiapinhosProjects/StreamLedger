// ============================================
// ExpenseChart.tsx - Gráfico de pizza das despesas
// Mostra a distribuição de gastos por categoria
// ============================================

"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Transaction } from "@/lib/storage";
import { getTotalByCategory, getTotalExcludingCategories } from "@/lib/calculations";

// Registra os componentes do Chart.js que vamos usar
ChartJS.register(ArcElement, Tooltip, Legend);

// Props do componente
interface Props {
  transactions: Transaction[];
}

export default function ExpenseChart({ transactions }: Props) {
  // Calcula o total de cada categoria de despesa
  const setup = getTotalByCategory(transactions, "expense", "Setup");
  const software = getTotalByCategory(transactions, "expense", "Software");
  const outros = getTotalExcludingCategories(transactions, "expense", ["Setup", "Software"]);

  // Dados do gráfico de pizza
  const data = {
    labels: ["Setup", "Software", "Outros"],
    datasets: [{
      data: [setup, software, outros],
      backgroundColor: ["#9147FF", "#00FF7F", "#FF6900"],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  // Configurações visuais do gráfico
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // Legenda à direita
      legend: {
        position: "right" as const,
        labels: { color: "#a0a0a0", padding: 20 },
      },
      // Tooltip ao passar o mouse
      tooltip: {
        backgroundColor: "rgba(18,18,20,0.9)",
        titleColor: "#fff",
        bodyColor: "#fff",
        callbacks: {
          // Formata o valor no tooltip como moeda brasileira
          label: (ctx: { label?: string; parsed: number | null }) => {
            const label = ctx.label || "";
            const val = ctx.parsed !== null
              ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ctx.parsed)
              : "";
            return `${label}: ${val}`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-card border border-neon/30 rounded-2xl p-5 shadow-lg h-full">
      <h3 className="text-lg font-bold mb-1">Distribuição de Despesas</h3>
      <p className="text-sm text-muted mb-4">Por categoria</p>
      <div className="h-[300px]">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
}
