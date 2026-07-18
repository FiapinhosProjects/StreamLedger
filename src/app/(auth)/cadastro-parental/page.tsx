// ============================================
// cadastro-parental/page.tsx - Página de cadastro do responsável
// Responsável cria conta e vincula menor com verificação facial
// Conforme Lei Felca (Lei 15.211/2025)
// ============================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParentalLink } from "@/hooks/useParentalLink";
import ConsentForm, { type ConsentData } from "@/components/auth/ConsentForm";
import ParentFaceVerification, { type FaceVerificationResult } from "@/components/auth/ParentFaceVerification";
import { validateCPF, formatCPF } from "@/lib/cpfValidation";

export default function CadastroParentalPage() {
  const router = useRouter();
  const { createParentAccount, createLink, parent } = useParentalLink();

  // Etapas do fluxo
  const [step, setStep] = useState<"login" | "face" | "vinculo" | "sucesso">("login");

  // Dados do responsável
  const [cpf, setCpf] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [faceResult, setFaceResult] = useState<FaceVerificationResult | null>(null);

  // Dados do vínculo
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkedMinor, setLinkedMinor] = useState<{ name: string; email: string } | null>(null);

  const formatCpfInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      setCpf(formatCPF(numbers));
    }
  };

  const handleParentLogin = () => {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      setCpfError("CPF deve ter 11 dígitos");
      return;
    }

    if (!validateCPF(cleanCpf)) {
      setCpfError("CPF inválido");
      return;
    }

    setCpfError(null);

    // Cria conta parental
    createParentAccount(cleanCpf, "Responsável Legal", "responsavel@exemplo.com", "ouro");

    // Vai para etapa de verificação facial
    setStep("face");
  };

  const handleFaceVerified = (result: FaceVerificationResult) => {
    if (!result.verified) {
      setStep("login");
      return;
    }

    setFaceResult(result);

    // Se verificado, vai para etapa de vínculo
    setStep("vinculo");
  };

  const handleFaceCancel = () => {
    setStep("login");
  };

  const handleVinculo = (data: ConsentData) => {
    if (!parent) return;

    const link = createLink({
      minorCpf: data.minorCpf,
      minorName: data.minorName,
      minorEmail: data.minorEmail,
      minorBirthDate: data.minorBirthDate,
    });

    if (link) {
      setLinkCode(link.linkCode);
      setLinkedMinor({ name: data.minorName, email: data.minorEmail });
      setStep("sucesso");
    }
  };

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
          {/* Etapa 1: Login do responsável */}
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
                      type="text"
                      value={cpf}
                      onChange={(e) => formatCpfInput(e.target.value)}
                      placeholder="000.000.000-00"
                      className={`w-full rounded-lg border ${cpfError ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
                      maxLength={14}
                    />
                    {cpfError && <p className="text-red text-xs mt-1">{cpfError}</p>}
                  </div>

                  <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3">
                    <p className="text-yellow text-xs">
                      <span className="font-semibold">Próximo passo:</span> Após inserir seu CPF,
                      você fará uma verificação facial para confirmar sua identidade.
                    </p>
                  </div>

                  <button
                    onClick={handleParentLogin}
                    className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Etapa 2: Verificação facial */}
          {step === "face" && (
            <ParentFaceVerification
              onVerified={handleFaceVerified}
              onCancel={handleFaceCancel}
            />
          )}

          {/* Etapa 3: Vincular menor */}
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

              <ConsentForm onSubmit={handleVinculo} onCancel={() => setStep("login")} />
            </>
          )}

          {/* Etapa 4: Sucesso */}
          {step === "sucesso" && linkCode && (
            <>
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-neon/10 border-2 border-neon/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-10 h-10 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-neon mb-2">Vínculo Criado!</h1>
                <p className="text-muted text-sm">
                  Compartilhe o código abaixo com {linkedMinor?.name}
                </p>
              </div>

              <div className="bg-card border border-neon/20 rounded-2xl p-6 mb-6">
                <p className="text-muted text-sm mb-2 text-center">Código de vínculo:</p>
                <div className="bg-background border border-neon/30 rounded-xl p-4 text-center">
                  <span className="text-3xl font-bold text-neon tracking-widest">{linkCode}</span>
                </div>
                <p className="text-muted text-xs mt-4 text-center">
                  O menor deve inserir este código na tela de login.
                  <br />
                  O código expira em 7 dias.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linkCode);
                  }}
                  className="w-full py-3 rounded-xl border border-neon/20 font-semibold hover:bg-neon/10 transition-all"
                >
                  Copiar Código
                </button>

                <Link
                  href="/dashboard"
                  className="block w-full py-3 rounded-xl bg-neon text-background font-semibold text-center hover:opacity-90 transition-all"
                >
                  Ir para Dashboard
                </Link>
              </div>
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
