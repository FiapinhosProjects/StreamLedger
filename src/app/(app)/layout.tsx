// ============================================
// Layout do App (Dashboard, Receitas, Despesas)
// Estrutura com sidebar à esquerda e conteúdo à direita
// ============================================

import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Menu lateral */}
      <Sidebar />

      {/* Área principal do conteúdo */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 overflow-y-auto min-h-screen p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
