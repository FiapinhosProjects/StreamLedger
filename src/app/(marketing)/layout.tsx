// ============================================
// Layout de Marketing (Início, Sobre, Pesquisa, Newsletter)
// Estrutura com navbar no topo e footer embaixo
// ============================================

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Barra de navegação no topo */}
      <Navbar />

      {/* Conteúdo da página */}
      <main className="flex-1">{children}</main>

      {/* Rodapé */}
      <Footer />
    </>
  );
}
