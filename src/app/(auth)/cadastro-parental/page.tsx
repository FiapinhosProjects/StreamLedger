"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParentalLink } from "@/hooks/useParentalLink";
import { useInputMask, formatCpfValue } from "@/hooks/useInputMask";
import ConsentForm, { type ConsentData } from "@/components/auth/ConsentForm";
import ParentFaceVerification, { type FaceVerificationResult } from "@/components/auth/ParentFaceVerification";
import { validateCPF } from "@/lib/cpfValidation";

export default function CadastroParentalPage() {
  const router = useRouter();
  const { createParentAccount, createLink, parent } = useParentalLink();

  const [step, setStep] = useState<"login" | "face" | "vinculo" | "sucesso">("login");

  // Loading state para transições
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Dados do responsável
  const cpfInput = useInputMask({ formatFn: formatCpfValue });
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(null);

  // Dados do vínculo criado
  const [linkedMinor, setLinkedMinor] = useState<{ name: string; email: string } | null>(null);

  const handleParentLogin = useCallback(() => {
    const cleanCpf = cpfInput.value.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      cpfInput.setError("CPF deve ter 11 dígitos");
      return;
    }

    if (!validateCPF(cleanCpf)) {
      cpfInput.setError("CPF inválido");
      return;
    }

    cpfInput.setError(null);
    setIsTransitioning(true);

    // Simula pequeno delay para feedback visual
    setTimeout(() => {
      // Cria conta parental
      createParentAccount(cleanCpf, "Responsável Legal", "responsavel@exemplo.com", "ouro");

      // Vai para etapa de verificação facial
      setStep("face");
      setIsTransitioning(false);
    }, 300);
  }, [cpfInput, createParentAccount]);

  const handleFaceVerified = useCallback((result: FaceVerificationResult) => {
    if (!result.verified) {
      setStep("login");
      return;
    }

    setFaceResult(result);
    setIsTransitioning(true);

    // Simula delay antes de ir para vínculo
    setTimeout(() => {
      setStep("vinculo");
      setIsTransitioning(false);
    }, 300);
  }, []);

  const handleFaceCancel = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("login");
      setIsTransitioning(false);
    }, 200);
  }, []);

  const handleVinculoBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("face");
      setIsTransitioning(false);
    }, 200);
  }, []);

  const handleVinculo = useCallback((data: ConsentData) => {
    if (!parent) return;

    setIsTransitioning(true);

    setTimeout(async () => {
      const link = await createLink({
        minorCpf: data.minorCpf,
        minorName: data.minorName,
        minorEmail: data.minorEmail,
        minorBirthDate: data.minorBirthDate,
      });

      if (link) {
        setLinkedMinor({ name: data.minorName, email: data.minorEmail });
        setStep("sucesso");
      }
      setIsTransitioning(false);
    }, 300);
  }, [parent, createLink]);

  const handleLoginBack = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep("login");
      setIsTransitioning(false);
    }, 200);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-muted hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
      </header>

      {/* Conteúdo */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Loading overlay */}
          {isTransitioning && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-neon/30 border-t-neon rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted text-sm">Carregando...</p>
              </div>
            </div>
          )}

          {step === "login" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-neon mb-2">Cadastro do Responsável</h1>
                <p className="text-muted text-sm">
                  Crie sua conta para permitir o acesso de menores
                </p>
              </div>

              <div className="bg-card border border-neon/20 rounded-2xl p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                      Seu CPF
                    </label>
                    <input
                      ref={cpfInput.inputRef}
                      type="text"
                      value={cpfInput.value}
                      onChange={cpfInput.handleChange}
                      placeholder="000.000.000-00"
                      className={`w-full rounded-lg border ${cpfInput.error ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                      maxLength={14}
                    />
                    {cpfInput.error && <p className="text-red text-xs mt-1">{cpfInput.error}</p>}
                  </div>

                  <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3">
                    <p className="text-yellow text-xs">
                      <span className="font-semibold">Próximo passo:</span> Após inserir seu CPF,
                      você fará uma verificação facial para confirmar sua identidade.
                    </p>
                  </div>

                  <button
                    onClick={handleParentLogin}
                    disabled={isTransitioning}
                    className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                      isTransitioning
                        ? "bg-neon/30 text-background/50 cursor-not-allowed"
                        : "bg-neon text-background hover:opacity-90"
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
              </div>
            </>
          )}

          {step === "face" && (
            <div className="flex items-center justify-center">
              <button
                onClick={handleFaceCancel}
                className="absolute top-4 left-4 text-white/60 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <ParentFaceVerification
                onVerified={handleFaceVerified}
                onCancel={handleFaceCancel}
              />
            </div>
          )}

          {step === "vinculo" && (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-neon/10 border border-neon/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-neon mb-2">Vincular Menor</h1>
                <p className="text-muted text-sm">
                  Informe os dados do menor que deseja permitir acesso
                </p>
              </div>

              <ConsentForm
                onSubmit={handleVinculo}
                onCancel={handleLoginBack}
                onBack={handleVinculoBack}
              />
            </>
          )}

          {step === "sucesso" && (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-neon/10 border-2 border-neon/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-10 h-10 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-neon mb-2">Vínculo Criado!</h1>
                <p className="text-muted text-sm">
                  {linkedMinor?.name} agora tem acesso liberado ao StreamLedger
                </p>
              </div>

              <div className="bg-card border border-neon/20 rounded-2xl p-6 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-neon flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-muted">
                    O menor poderá acessar usando o CPF vinculado. O vínculo está ativo e salvo neste dispositivo.
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="block w-full py-3 rounded-xl bg-neon text-background font-semibold text-center hover:opacity-90 transition-all"
              >
                Ir para Dashboard
              </Link>
            </>
          )}

          {/* Footer legal */}
          <p className="text-center text-muted text-xs mt-8">
            Conforme Lei 15.211/2025 (ECA Digital)
            <br />
            Art. 299 Código Penal - Falsa declaração
          </p>
        </div>
      </div>
    </div>
  );
}
