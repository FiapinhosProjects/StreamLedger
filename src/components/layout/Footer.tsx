// ============================================
// Footer.tsx - Rodapé do site (páginas de marketing)
// Mostra logo, links de navegação e equipe
// ============================================

import Link from "next/link";
import Image from "next/image";

// Lista dos membros da equipe com links do LinkedIn
const team = [
  { name: "Bruna Sousa", url: "https://www.linkedin.com/in/brunasousasantos/" },
  { name: "Gabriel Kott", url: "https://www.linkedin.com/in/gabriel-kott-3494342ab/" },
  { name: "Caio Leme", url: "https://www.linkedin.com/in/caiobertaglia/" },
  { name: "Gabriele Lopes", url: "https://www.linkedin.com/in/gabrielelopes1925/" },
  { name: "Davi Simione", url: "https://www.linkedin.com/in/davi-simione-01127830b/" },
];

export default function Footer() {
  return (
    <footer className="bg-header border-t border-neon/10 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Grid com 3 colunas: logo, navegação e equipe */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Coluna 1: Logo e descrição */}
          <div>
            <Image src="/assets/logo.png" alt="StreamLedger" width={140} height={36} className="mb-4" />
            <p className="text-sm text-muted">
              Gestão financeira simples e acessível para streamers iniciantes.
            </p>
          </div>

          {/* Coluna 2: Links de navegação */}
          <div>
            <h6 className="text-neon font-bold mb-4 text-sm">Navegação</h6>
            <ul className="flex flex-col gap-2">
              <li><Link href="/" className="text-sm text-muted hover:text-neon transition-colors">Início</Link></li>
              <li><Link href="/sobre" className="text-sm text-muted hover:text-neon transition-colors">Sobre</Link></li>
              <li><Link href="/pesquisa" className="text-sm text-muted hover:text-neon transition-colors">Pesquisa</Link></li>
              <li><Link href="/dashboard" className="text-sm text-muted hover:text-neon transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          {/* Coluna 3: Membros da equipe */}
          <div>
            <h6 className="text-neon font-bold mb-4 text-sm">Equipe</h6>
            <ul className="flex flex-col gap-2">
              {team.map((member) => (
                <li key={member.name}>
                  <a
                    href={member.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted hover:text-neon transition-colors"
                  >
                    {member.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Linha divisória e copyright */}
        <hr className="border-white/10 my-6" />
        <p className="text-center text-xs text-muted">
          StreamLedger &copy; 2026 — Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
