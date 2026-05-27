// ============================================
// Navbar.tsx - Barra de navegação do site (marketing)
// Aparece no topo das páginas públicas (Início, Sobre, etc)
// ============================================

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";

// Links do menu de navegação
const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/pesquisa", label: "Pesquisa" },
  { href: "/newsletter", label: "Newsletter" },
];

export default function Navbar() {
  // Pega a URL atual para destacar o link ativo
  const pathname = usePathname();

  // Controla se o menu mobile está aberto
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-header border-b border-neon/10">
      <nav className="max-w-7xl mx-auto flex items-center justify-center px-4 h-[70px] relative" aria-label="Navegação principal">
        {/* Logo à esquerda */}
        <Link href="/" className="absolute left-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg">
          <Image src="/assets/logo.png" alt="StreamLedger" width={151} height={44} />
        </Link>

        {/* Menu Desktop (escondido no mobile) */}
        <ul className="hidden md:flex items-center gap-6">
          {links.map((link) => {
            // Verifica se este link é a página atual
            const isActive = pathname === link.href;

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative text-base font-medium transition-all duration-300 hover:text-neon hover:drop-shadow-[0_0_6px_rgba(93,255,155,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm ${
                    isActive
                      ? "text-neon font-semibold underline underline-offset-8 decoration-2 decoration-neon drop-shadow-[0_0_6px_rgba(93,255,155,0.6)]"
                      : "text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botão "Acessar Demo" à direita (desktop) */}
        <Link
          href="/dashboard"
          className="hidden md:inline-block absolute right-4 text-base font-semibold px-4 py-2 rounded-full border border-neon/20 hover:bg-neon/10 hover:shadow-[0_0_12px_rgba(93,255,155,0.4)] hover:-translate-y-0.5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Acessar Demo
        </Link>

        {/* Botão hambúrguer (mobile) */}
        <button
          className="md:hidden text-white absolute right-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menu"
          aria-expanded={open}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Menu Mobile (aparece quando clica no hambúrguer) */}
      {open && (
        <div className="md:hidden bg-header border-t border-neon/10 px-4 pb-4">
          <ul className="flex flex-col gap-3 pt-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block py-2 text-sm font-medium ${
                    pathname === link.href ? "text-neon" : "text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-semibold text-neon"
              >
                Acessar App
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
