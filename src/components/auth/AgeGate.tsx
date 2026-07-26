// ============================================
// AgeGate.tsx - Barreira de entrada / Verificação de idade
// Componente que verifica se usuário tem 18+ antes de acessar
// Conforme Lei Felca (Lei 15.211/2025)
// Fluxo: CPF -> Verifica idade -> Yoti (18+) ou Parental (<18)
// ============================================

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { validateCPF, calculateAge } from "@/lib/cpfValidation";
import YotiVerification, { type YotiResult } from "./YotiVerification";
import BlockedAccess from "./BlockedAccess";

interface AgeGateProps {
  children: React.ReactNode;
}

export default function AgeGate({ children }: AgeGateProps) {
  const router = useRouter();
  const { isLoading, isVerified, user, needsParentalConsent, loginWithGovBr, logout } = useAgeVerification();

  // Redireciona para dashboard quando verificado com sucesso
  useEffect(() => {
    if (!isLoading && isVerified) {
      router.push("/dashboard");
    }
  }, [isVerified, isLoading, router]);

  // Estados locais para o formulário
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estado do fluxo
  const [step, setStep] = useState<"form" | "yoti" | "parental">("form");
  const [declaredAge, setDeclaredAge] = useState<number>(0);

  // Modal de Em Breve (Gov.br)
  const [showGovBrModal, setShowGovBrModal] = useState(false);

  // Estado do checkbox de declaração
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Refs para controlar posição do cursor
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const birthDateInputRef = useRef<HTMLInputElement>(null);

  // Handler para formatar CPF - mantém cursor na posição correta
  const handleCpfChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    const selectionStart = input.selectionStart || 0;

    const numbers = value.replace(/\D/g, "");
    let formatted = numbers.substring(0, 3);
    if (numbers.length > 3) formatted += "." + numbers.substring(3, 6);
    if (numbers.length > 6) formatted += "." + numbers.substring(6, 9);
    if (numbers.length > 9) formatted += "-" + numbers.substring(9, 11);

    setCpf(formatted);

    // Calcula nova posição do cursor baseada nos caracteres digitados
    const digitsBeforeCursor = value.substring(0, selectionStart).replace(/\D/g, "").length;
    let newCursorPos = digitsBeforeCursor;
    if (digitsBeforeCursor > 3) newCursorPos++;
    if (digitsBeforeCursor > 6) newCursorPos++;
    if (digitsBeforeCursor > 9) newCursorPos++;
    newCursorPos = Math.min(newCursorPos, formatted.length);

    // Restaura posição do cursor após o re-render
    requestAnimationFrame(() => {
      if (cpfInputRef.current) {
        cpfInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }, []);

  // Handler para formatar data - mantém cursor na posição correta
  const handleDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const value = input.value;
    const selectionStart = input.selectionStart || 0;

    const numbers = value.replace(/\D/g, "");
    let formatted = "";

    if (numbers.length > 0) {
      formatted = numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += "/" + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += "/" + numbers.substring(4, 8);
    }

    setBirthDate(formatted);

    // Calcula nova posição do cursor
    const digitsBeforeCursor = value.substring(0, selectionStart).replace(/\D/g, "").length;
    let newCursorPos = digitsBeforeCursor;
    if (digitsBeforeCursor > 2) newCursorPos++;
    if (digitsBeforeCursor > 4) newCursorPos++;
    newCursorPos = Math.min(newCursorPos, formatted.length);

    // Restaura posição do cursor após o re-render
    requestAnimationFrame(() => {
      if (birthDateInputRef.current) {
        birthDateInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
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

  // Continuar após validar CPF
  const handleContinue = useCallback(() => {
    if (!handleValidate()) return;

    // Calcular idade declarada
    const age = calculateAge(birthDate);
    setDeclaredAge(age);

    // Redirecionar baseado na idade
    if (age >= 18) {
      setStep("yoti");
    } else {
      setStep("parental");
    }
  }, [handleValidate, birthDate]);

  // Voltar ao formulário
  const handleBack = useCallback(() => {
    setStep("form");
  }, []);

  // Login após verificação Yoti
  const handleYotiVerified = useCallback((result: YotiResult) => {
    if (!result.verified) {
      setLoginError("Verificação facial não aprovada. A idade estimada não corresponde.");
      setStep("form");
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const mockData = {
      nivel: "ouro" as const,
      nome: "Usuário Verificado",
      email: "usuario@exemplo.com",
    };

    const loginResult = loginWithGovBr(cleanCpf, mockData, birthDate);
    if (!loginResult.success) {
      setLoginError(loginResult.error || "Erro ao verificar");
      setStep("form");
    }
  }, [cpf, birthDate, loginWithGovBr]);

  // Carregando
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Verificando idade...</p>
        </div>
      </div>
    );
  }

  // Verificado mas menor - mostrar bloqueado
  if (needsParentalConsent) {
    return <BlockedAccess user={{ nome: user?.nome, birthDate: user?.birthDate }} onLogout={logout} />;
  }

  // Não verificado - mostrar página de verificação
  if (!isVerified) {
    // Modal "Em Breve" - Gov.br
    if (showGovBrModal) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md bg-card border border-neon/20 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-neon/5 border-b border-neon/20 p-6 text-center">
              <div className="w-20 h-20 bg-neon/10 border border-neon/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-neon mb-2">Em Breve!</h2>
              <p className="text-muted text-sm">Calma, essa função está sendo desenvolvida.</p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 text-center">
              <p className="text-white/80 text-sm mb-4">
                A integração com <span className="text-[#1a4ba3] font-semibold">Gov.br</span> está
                sendo trabalhada para trazer mais segurança e praticidade ao seu login.
              </p>

              <div className="bg-neon/5 border border-neon/20 rounded-xl p-4 mb-6">
                <p className="text-neon text-sm font-medium mb-2">Enquanto isso...</p>
                <p className="text-muted text-xs">
                  Use o formulário abaixo com seu CPF e data de nascimento para acessar a plataforma.
                </p>
              </div>

              <button
                onClick={() => setShowGovBrModal(false)}
                className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Etapa: Verificação Yoti (18+)
    if (step === "yoti") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md">
            <YotiVerification
              declaredAge={declaredAge}
              onVerified={handleYotiVerified}
              onCancel={handleBack}
            />
          </div>
        </div>
      );
    }

    // Etapa: Cadastro Parental (<18)
    if (step === "parental") {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 bg-yellow/10 border border-yellow/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-yellow mb-2">Menor de 18 anos</h1>
            <p className="text-muted mb-6">
              Você declarou ter <strong className="text-white">{declaredAge}</strong> anos.
              <br />
              Para menores, é necessário preenchimento parental.
            </p>

            <div className="bg-card border border-neon/20 rounded-2xl p-6 mb-6 text-left">
              <h3 className="font-semibold text-neon mb-3">O que acontece?</h3>
              <ol className="space-y-2 text-sm text-muted">
                <li className="flex gap-2">
                  <span className="text-neon font-bold">1.</span>
                  Um responsável legal (pais ou tutors) precisa criar uma conta
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-bold">2.</span>
                  O responsável preencherá seus dados e fará a verificação facial
                </li>
                <li className="flex gap-2">
                  <span className="text-neon font-bold">3.</span>
                  Após aprovação, você terá acesso ao StreamLedger
                </li>
              </ol>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="/cadastro-parental"
                className="block w-full py-3 rounded-xl bg-neon text-background font-semibold text-center hover:opacity-90 transition-all"
              >
                Preenchimento Parental
              </a>
              <button
                onClick={handleBack}
                className="w-full py-3 rounded-xl border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-all"
              >
                Voltar e corrigir idade
              </button>
            </div>

            <p className="text-center text-muted text-xs mt-6">
              Conforme Lei 15.211/2025 - ECA Digital
            </p>
          </div>
        </div>
      );
    }

    // Etapa: Formulário inicial
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neon mb-2">Verificação de Idade</h1>
            <p className="text-muted text-sm">Para garantir a segurança dos menores, conforme a Lei 15.211/2025</p>
          </div>

          <div className="bg-card border border-neon/20 rounded-2xl p-6">
            <button
              onClick={() => setShowGovBrModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1a4ba3] hover:bg-[#1a4ba3]/90 rounded-xl transition-all mb-4"
            >
              <span className="font-semibold">Entrar com Gov.br</span>
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-muted text-xs">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                    CPF
                  </label>
                  <input
                    ref={cpfInputRef}
                    type="text"
                    value={cpf}
                    onChange={handleCpfChange}
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
                    ref={birthDateInputRef}
                    type="text"
                    value={birthDate}
                    onChange={handleDateChange}
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

                {/* Checkbox de declaração */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={declarationChecked}
                      onChange={(e) => setDeclarationChecked(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 border-2 border-white/30 rounded bg-background peer-checked:bg-neon peer-checked:border-neon transition-all group-hover:border-neon/50" />
                    <svg
                      className="absolute top-0.5 left-0.5 w-4 h-4 text-background opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/80 leading-relaxed">
                    Declaro que as informações prestadas são verdadeiras.
                  </span>
                </label>

                {/* Aviso Legal */}
                <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3">
                  <p className="text-yellow text-xs leading-relaxed">
                    <span className="font-semibold">⚠️ Aviso Legal:</span> Fornecer dados falsos constitui crime de falsa identidade (Art. 299 do Código Penal), com pena de reclusão de 2 a 6 anos.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!declarationChecked}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    declarationChecked
                      ? "bg-neon text-background hover:opacity-90"
                      : "bg-neon/30 text-background/50 cursor-not-allowed"
                  }`}
                >
                  Continuar
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-muted text-xs mt-6">
            Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade.
            <br />
            Protegido pela Lei 15.211/2025 (Lei Felca)
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
