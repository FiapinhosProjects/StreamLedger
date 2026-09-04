"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgeVerification } from "@/hooks/useAgeVerification";
import { useInputMask, formatCpfValue, formatDateValue } from "@/hooks/useInputMask";
import { validateCPF, calculateAge } from "@/lib/cpfValidation";
import { getParentalLinks } from "@/lib/storage";
import { checkClientRateLimit } from "@/lib/rateLimit";
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

  // Inputs com máscara de cursor position
  const cpfInput = useInputMask({ formatFn: formatCpfValue });
  const birthDateInput = useInputMask({ formatFn: formatDateValue });

  // Estados locais para o formulário
  const [loginError, setLoginError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Estado do fluxo
  const [step, setStep] = useState<"form" | "yoti" | "parental">("form");
  const [declaredAge, setDeclaredAge] = useState<number>(0);

  // Loading state para transição entre etapas
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Modal de Em Breve (Gov.br)
  const [showGovBrModal, setShowGovBrModal] = useState(false);

  // Estado do checkbox de declaração
  const [declarationChecked, setDeclarationChecked] = useState(false);

  // Resetar estados quando volta para o formulário
  useEffect(() => {
    if (step === "form") {
      setDeclarationChecked(false);
      setIsTransitioning(false);
    }
  }, [step]);

  // Validação
  const handleValidate = useCallback(() => {
    let valid = true;
    const cleanCpf = cpfInput.value.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      cpfInput.setError("CPF deve ter 11 dígitos");
      valid = false;
    } else if (!validateCPF(cleanCpf)) {
      cpfInput.setError("CPF inválido");
      valid = false;
    } else {
      cpfInput.setError(null);
    }

    const dateParts = birthDateInput.value.split("/");
    if (dateParts.length !== 3 || dateParts[0].length !== 2 || dateParts[1].length !== 2 || dateParts[2].length !== 4) {
      birthDateInput.setError("Data deve ser DD/MM/AAAA");
      valid = false;
    } else {
      const [, , year] = dateParts.map(Number);
      if (year < 1900 || year > new Date().getFullYear()) {
        birthDateInput.setError("Ano inválido");
        valid = false;
      } else {
        birthDateInput.setError(null);
      }
    }

    return valid;
  }, [cpfInput, birthDateInput]);

  // Verifica se menor tem vínculo parental ativo
  const checkMinorHasLink = useCallback(async (cpf: string): Promise<{ hasLink: boolean; parentId?: string }> => {
    const links = await getParentalLinks();
    const link = links.find((l) => l.minorCpf === cpf && l.status === "accepted");
    if (link) {
      return { hasLink: true, parentId: link.parentId };
    }
    return { hasLink: false };
  }, []);

  // Login direto para menores com vínculo
  const loginMinorWithLink = useCallback(async () => {
    const cleanCpf = cpfInput.value.replace(/\D/g, "");
    const mockData = {
      nivel: "ouro" as const,
      nome: "Usuário Verificado",
      email: "usuario@exemplo.com",
    };

    const loginResult = await loginWithGovBr(cleanCpf, mockData, birthDateInput.value);
    if (!loginResult.success) {
      setLoginError(loginResult.error || "Erro ao verificar");
      setStep("form");
    }
  }, [cpfInput.value, birthDateInput.value, loginWithGovBr]);

  // Continuar após validar CPF
  const handleContinue = useCallback(async () => {
    if (!handleValidate()) return;

    // Rate limiting - verifica antes de processar
    const cleanCpf = cpfInput.value.replace(/\D/g, "");
    const rateLimit = checkClientRateLimit("LOGIN_ATTEMPT", cleanCpf);

    if (!rateLimit.allowed) {
      const retryInSeconds = Math.ceil(rateLimit.resetIn / 1000);
      setRateLimitError(`Muitas tentativas. Tente novamente em ${retryInSeconds} segundos.`);
      setIsTransitioning(false);
      return;
    }

    setRateLimitError(null);
    setIsTransitioning(true);

    setTimeout(async () => {
      const age = calculateAge(birthDateInput.value);
      setDeclaredAge(age);

      if (age >= 18) {
        // Adulto: vai para verificação facial
        setStep("yoti");
        setIsTransitioning(false);
      } else {
        // Menor: verifica se tem vínculo parental
        const { hasLink } = await checkMinorHasLink(cleanCpf);

        if (hasLink) {
          // Menor com vínculo: login automático
          await loginMinorWithLink();
        } else {
          // Menor sem vínculo: mostra tela de parental
          setStep("parental");
          setIsTransitioning(false);
        }
      }
    }, 300);
  }, [handleValidate, birthDateInput, cpfInput, checkMinorHasLink, loginMinorWithLink]);

  // Voltar ao formulário
  const handleBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("form");
      setIsTransitioning(false);
    }, 200);
  }, []);

  // Login após verificação Yoti
  const handleYotiVerified = useCallback(async (result: YotiResult) => {
    if (!result.verified) {
      setLoginError("Verificação facial não aprovada. A idade estimada não corresponde.");
      setStep("form");
      return;
    }

    const cleanCpf = cpfInput.value.replace(/\D/g, "");
    const mockData = {
      nivel: "ouro" as const,
      nome: "Usuário Verificado",
      email: "usuario@exemplo.com",
    };

    const loginResult = await loginWithGovBr(cleanCpf, mockData, birthDateInput.value);
    if (!loginResult.success) {
      setLoginError(loginResult.error || "Erro ao verificar");
      setStep("form");
    }
  }, [cpfInput.value, birthDateInput.value, loginWithGovBr]);

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
                    ref={cpfInput.inputRef}
                    type="text"
                    value={cpfInput.value}
                    onChange={cpfInput.handleChange}
                    placeholder="000.000.000-00"
                    className={`w-full rounded-lg border ${cpfInput.error ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                    maxLength={14}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {cpfInput.error && <p className="text-red text-xs mt-1">{cpfInput.error}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    ref={birthDateInput.inputRef}
                    type="text"
                    value={birthDateInput.value}
                    onChange={birthDateInput.handleChange}
                    placeholder="DD/MM/AAAA"
                    className={`w-full rounded-lg border ${birthDateInput.error ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                    maxLength={10}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                  />
                  {birthDateInput.error && <p className="text-red text-xs mt-1">{birthDateInput.error}</p>}
                </div>

                {loginError && (
                  <p className="text-red text-sm text-center">{loginError}</p>
                )}

                {rateLimitError && (
                  <div className="bg-red/10 border border-red/30 rounded-lg p-3">
                    <p className="text-red text-sm text-center font-medium">{rateLimitError}</p>
                  </div>
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
                  disabled={!declarationChecked || isTransitioning}
                  className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    declarationChecked && !isTransitioning
                      ? "bg-neon text-background hover:opacity-90"
                      : "bg-neon/30 text-background/50 cursor-not-allowed"
                  }`}
                >
                  {isTransitioning ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Verificando...</span>
                    </>
                  ) : (
                    "Continuar"
                  )}
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
