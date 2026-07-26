// ============================================
// acesso-bloqueado/page.tsx - Página de acesso bloqueado
// Exibida quando menor tenta acessar sem vínculo parental
// Conforme Lei Felca (Lei 15.211/2025)
// ============================================

"use client";

import Link from "next/link";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { calculateAge } from "@/lib/cpfValidation";

export default function AcessoBloqueadoPage() {
  const { user, logout } = useAgeVerification();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          {/* Ícone de bloqueio */}
          <div className="w-24 h-24 bg-red/10 border-2 border-red/30 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-12 h-12 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-red mb-2">Acesso Bloqueado</h1>

          {user?.nome && (
            <p className="text-lg text-white mb-2">Olá, {user.nome}!</p>
          )}

          <p className="text-muted mb-6">
            {user?.birthDate
              ? `Você tem ${calculateAge(user.birthDate)} anos.`
              : "Sua idade não permite acesso direto."}
            <br />
            Para menores de 18 anos, é necessário vínculo com responsável legal.
          </p>

          {/* Explicação */}
          <div className="bg-card border border-neon/20 rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-bold text-neon mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como funciona?
            </h3>

            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-neon font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Busque um responsável legal</p>
                  <p className="text-muted text-xs">Pai, mãe ou tutor maior de 18 anos</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-neon font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Responsável cria conta</p>
                  <p className="text-muted text-xs">Acesse com Gov.br (nível Prata ou Ouro)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-neon font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Vincule seu CPF</p>
                  <p className="text-muted text-xs">O responsável informa seus dados para criar vínculo</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-neon font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Acesso liberado!</p>
                  <p className="text-muted text-xs">Com monitoramento do responsável</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <Link
              href="/cadastro-parental"
              className="block w-full py-3.5 rounded-xl bg-neon text-background font-bold text-center hover:opacity-90 transition-all"
            >
              Responsável: Criar Conta
            </Link>

            <button
              onClick={logout}
              className="w-full py-3 rounded-xl border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-all"
            >
              Voltar e usar outro CPF
            </button>
          </div>

          {/* Footer legal */}
          <div className="mt-8 pt-4 border-t border-white/10">
            <p className="text-muted text-xs">
              Proteção garantida pela Lei 15.211/2025 (ECA Digital)
              <br />
              Estatuto da Criança e do Adolescente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
