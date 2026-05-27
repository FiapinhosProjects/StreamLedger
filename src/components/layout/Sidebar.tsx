// ============================================
// Sidebar.tsx - Menu lateral do app (dashboard)
// Navegação entre Visão Geral, Receitas e Despesas
// ============================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Itens do menu lateral
const navItems = [
  { href: "/dashboard", label: "Visão Geral", icon: "/assets/home.svg" },
  { href: "/receitas", label: "Receitas", icon: "/assets/ReceitasIcon.svg" },
  { href: "/despesas", label: "Despesas", icon: "/assets/DespesaIcon.svg" },
];

export default function Sidebar() {
  // Pega a URL atual para destacar o item ativo
  const pathname = usePathname();

  // Controla se o menu mobile está aberto
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Barra superior no mobile (substitui a sidebar) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-header border-b border-neon/10 flex items-center px-4 py-3">
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/" className="ml-3">
          <Image src="/assets/logo.png" alt="StreamLedger" width={120} height={36} />
        </Link>
      </div>

      {/* Menu mobile (overlay que aparece ao clicar no hambúrguer) */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Painel do menu */}
          <div className="w-64 bg-header border-r border-neon/10 flex flex-col p-6">
            <div className="flex items-center justify-between mb-8">
              <Link href="/">
                <Image src="/assets/logo.png" alt="StreamLedger" width={120} height={36} />
              </Link>
              <button onClick={() => setOpen(false)} aria-label="Fechar menu" className="text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <Nav pathname={pathname} onNavigate={() => setOpen(false)} />
          </div>
          {/* Fundo escuro que fecha o menu ao clicar */}
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Sidebar desktop (fixa à esquerda) */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-header border-r border-neon/10 p-6 fixed left-0 top-0" role="navigation" aria-label="Menu principal">
        <Link href="/" className="mb-10 block text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
          <Image src="/assets/logo.png" alt="StreamLedger" width={140} height={40} className="mx-auto" />
        </Link>
        <Nav pathname={pathname} />
      </aside>
    </>
  );
}

// Componente interno de navegação (usado tanto no desktop quanto no mobile)
function Nav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-2 flex-1" aria-label="Navegação do aplicativo">
      {navItems.map((item) => {
        // Verifica se este item é a página atual
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              active
                ? "bg-neon/10 text-neon shadow-[0_0_8px_rgba(93,255,155,0.3)]"
                : "text-white/70 hover:bg-neon/5 hover:text-neon hover:translate-x-1 hover:drop-shadow-[0_0_6px_rgba(93,255,155,0.5)]"
            }`}
          >
            <Image src={item.icon} alt="" width={18} height={18} />
            {item.label}
          </Link>
        );
      })}

      {/* Botão "Sair do App" no final do menu */}
      <div className="mt-auto pb-8">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/70 hover:bg-neon/5 hover:text-neon hover:translate-x-1 hover:drop-shadow-[0_0_6px_rgba(93,255,155,0.5)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Image src="/assets/Voltar.svg" alt="" width={18} height={18} />
          Sair do App
        </Link>
      </div>
    </nav>
  );
}
