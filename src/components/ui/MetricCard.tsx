// ============================================
// MetricCard.tsx - Card de métrica financeira
// Exibe um ícone, label e valor (ex: "Faturamento: R$ 1.500")
// ============================================

import Image from "next/image";

// Props que o MetricCard recebe
// icon: caminho da imagem do ícone
// iconBg: cor de fundo do ícone (ex: "#6BD4B8")
// label: texto descritivo (ex: "Faturamento Total")
// value: valor formatado (ex: "R$ 1.500,00")
export default function MetricCard({ icon, iconBg, label, value }: any) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_0_20px_rgba(93,255,155,0.15)] hover:scale-[1.02] cursor-default">
      <div className="flex items-center gap-4">
        {/* Ícone com fundo colorido */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
          style={{ background: iconBg }}
        >
          <Image src={icon} alt="" width={24} height={24} />
        </div>

        {/* Texto: label em cima, valor embaixo */}
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
