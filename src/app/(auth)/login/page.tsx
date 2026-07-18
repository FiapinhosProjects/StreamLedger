// ============================================
// login/page.tsx - Página de login
// Login via Gov.br (mock) ou verificação de idade
// ============================================

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useRouter } from "next/navigation";
import { validateCPF } from "@/lib/cpfValidation";

export default function LoginPage() {
  const router = useRouter();
  const { isVerified, isLoading, loginWithGovBr } = useAgeVerification();

  // Estados locais
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showGovBrModal, setShowGovBrModal] = useState(false);

  // Se já verificado, redireciona para dashboard
  if (isVerified && !isLoading) {
    router.push("/dashboard");
    return null;
  }

  // Handler para formatar CPF
  const handleCpfChange = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, "");
    let formatted = numbers.substring(0, 3);
    if (numbers.length > 3) formatted += "." + numbers.substring(3, 6);
    if (numbers.length > 6) formatted += "." + numbers.substring(6, 9);
    if (numbers.length > 9) formatted += "-" + numbers.substring(9, 11);
    setCpf(formatted);
  }, []);

  // Handler para formatar data
  const handleDateChange = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, "");
    let formatted = numbers.substring(0, 2);
    if (numbers.length > 2) formatted += "/" + numbers.substring(2, 4);
    if (numbers.length > 4) formatted += "/" + numbers.substring(4, 8);
    setBirthDate(formatted);
  }, []);

  // Validação
  const handleValidate = useCallback(() => {
    let valid = true;
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      setCpfError("CPF deve ter 11 dígitos");
      valid = false;
    } else if (!validateCPF(cleanCpf)) {
      setCpfError("CPF inválido");
      valid = false;
    } else {
      setCpfError(null);
    }

    const dateParts = birthDate.split("/");
    if (dateParts.length !== 3 || dateParts[0].length !== 2 || dateParts[1].length !== 2 || dateParts[2].length !== 4) {
      setBirthDateError("Data deve ser DD/MM/AAAA");
      valid = false;
    } else {
      const [, , year] = dateParts.map(Number);
      if (year < 1900 || year > new Date().getFullYear()) {
        setBirthDateError("Ano inválido");
        valid = false;
      } else {
        setBirthDateError(null);
      }
    }

    return valid;
  }, [cpf, birthDate]);

  // Login
  const handleLogin = useCallback(() => {
    if (!handleValidate()) return;

    const mockData = {
      nivel: "ouro" as const,
      nome: "Usuário Verificado",
      email: "usuario@exemplo.com",
    };

    const cleanCpf = cpf.replace(/\D/g, "");
    const result = loginWithGovBr(cleanCpf, mockData, birthDate);

    if (result.success) {
      router.push("/dashboard");
    } else {
      setLoginError(result.error || "Erro ao verificar");
    }
  }, [cpf, birthDate, loginWithGovBr, handleValidate, router]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header simplificado */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar ao início
        </Link>
      </header>

      {/* Conteúdo centralizado */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Image src="/assets/logo.png" alt="StreamLedger" width={40} height={40} />
            </div>
            <h1 className="text-2xl font-bold text-neon mb-2">Entrar no StreamLedger</h1>
            <p className="text-muted text-sm">
              Verificação de idade obrigatória conforme Lei 15.211/2025
            </p>
          </div>

          {/* Card principal */}
          <div className="bg-card border border-neon/20 rounded-2xl p-6">
            {/* Botão Gov.br */}
            <button
              onClick={() => setShowGovBrModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#1a4ba3] hover:bg-[#1a4ba3]/90 rounded-xl transition-all mb-4"
            >
              <span className="font-semibold">Entrar com Gov.br</span>
            </button>

            {/* Divisor */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-muted text-xs">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Formulário CPF */}
            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  className={`w-full rounded-lg border ${cpfError ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                  maxLength={14}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {cpfError && <p className="text-red text-xs mt-1">{cpfError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className={`w-full rounded-lg border ${birthDateError ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                  maxLength={10}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {birthDateError && <p className="text-red text-xs mt-1">{birthDateError}</p>}
              </div>

              {loginError && (
                <p className="text-red text-sm text-center">{loginError}</p>
              )}

              {/* Aviso Legal */}
              <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3">
                <p className="text-yellow text-xs leading-relaxed">
                  <span className="font-semibold">⚠️ Aviso Legal:</span> Declaro que as informações prestadas são verdadeiras.
                  Fornecer dados falsos constitui crime de falsa identidade (Art. 299 do Código Penal),
                  com pena de reclusão de 2 a 6 anos.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
              >
                Verificar e Entrar
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-muted text-xs mt-6">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            <br />
            Protegido pela Lei 15.211/2025 (Lei Felca)
          </p>
        </div>
      </div>

      {/* Modal Gov.br */}
      {showGovBrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-neon/20 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Login Gov.br</h2>
              <button onClick={() => setShowGovBrModal(false)} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Aviso de demo */}
            <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3 mb-4">
              <p className="text-yellow text-xs">
                <span className="font-semibold">Modo Demonstração</span>
                <br />
                Selecione o nível Gov.br para simular diferentes cenários de verificação.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => handleCpfChange(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  maxLength={14}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  maxLength={10}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
              </div>

              {/* Aviso Legal */}
              <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3">
                <p className="text-yellow text-xs leading-relaxed">
                  <span className="font-semibold">⚠️ Aviso Legal:</span> Declaro que as informações prestadas são verdadeiras.
                  Fornecer dados falsos constitui crime de falsa identidade (Art. 299 do Código Penal).
                </p>
              </div>

              <button
                onClick={() => {
                  if (handleValidate()) {
                    handleLogin();
                    setShowGovBrModal(false);
                  }
                }}
                className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
