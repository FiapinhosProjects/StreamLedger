// ============================================
// GovBrLogin.tsx - Botão e modal de login Gov.br (mock)
// Simula fluxo de autenticação Gov.br para protótipo
// ============================================

"use client";

import { useState } from "react";
import { useGovBrMock } from "@/hooks/useAgeVerification";
import { formatCPF } from "@/lib/cpfValidation";

interface GovBrLoginProps {
  onLogin: (cpf: string, level: "bronze" | "prata" | "ouro", birthDate: string) => void;
  variant?: "button" | "modal";
}

export default function GovBrLogin({ onLogin, variant = "button" }: GovBrLoginProps) {
  const { isModalOpen, selectedLevel, setSelectedLevel, openModal, closeModal } = useGovBrMock();

  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11) {
      setError("CPF deve ter 11 dígitos");
      return;
    }

    if (birthDate.length !== 10) {
      setError("Data de nascimento inválida");
      return;
    }

    setError(null);
    onLogin(cleanCpf, selectedLevel, birthDate);
    closeModal();
    setCpf("");
    setBirthDate("");
  };

  const formatCpfInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      setCpf(formatCPF(numbers));
    }
  };

  const formatDateInput = (value: string) => {
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
  };

  if (variant === "modal") {
    return (
      <>
        <button
          onClick={openModal}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1a4ba3] hover:bg-[#1a4ba3]/90 rounded-xl transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8H9V7h6v2z"/>
          </svg>
          <span className="font-semibold">Entrar com Gov.br</span>
        </button>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-card border border-neon/20 rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Login Gov.br</h2>
                <button onClick={closeModal} className="text-white/60 hover:text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Aviso de demo */}
              <div className="bg-yellow/10 border border-yellow/30 rounded-lg p-3 mb-4">
                <p className="text-yellow text-xs">
                  <span className="font-semibold">⚠️ Modo Demonstração</span>
                  <br />
                  Este é um protótipo. Selecione o nível Gov.br para simular diferentes cenários.
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
                    onChange={(e) => formatCpfInput(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                    maxLength={14}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="text"
                    value={birthDate}
                    onChange={(e) => formatDateInput(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                    Nível Gov.br
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["bronze", "prata", "ouro"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedLevel(level)}
                        className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                          selectedLevel === level
                            ? level === "bronze"
                              ? "bg-[#cd7f32] border-[#cd7f32] text-white"
                              : level === "prata"
                              ? "bg-[#c0c0c0] border-[#c0c0c0] text-black"
                              : "bg-[#ffd700] border-[#ffd700] text-black"
                            : "border-white/20 hover:border-white/40"
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-yellow/70 mt-1">
                    Bronze: acesso bloqueado | Prata/Ouro: acesso liberado
                  </p>
                </div>

                {error && (
                  <p className="text-red text-sm text-center">{error}</p>
                )}

                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={openModal}
        className="flex items-center gap-3 px-4 py-3 bg-[#1a4ba3] hover:bg-[#1a4ba3]/90 rounded-xl transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm0-8H9V7h6v2z"/>
        </svg>
        <span className="font-semibold">Gov.br</span>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-neon/20 rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Login Gov.br</h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => formatCpfInput(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  maxLength={14}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="text"
                  value={birthDate}
                  onChange={(e) => formatDateInput(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                  Nível Gov.br
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bronze", "prata", "ouro"] as const).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSelectedLevel(level)}
                      className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                        selectedLevel === level
                          ? level === "bronze"
                            ? "bg-[#cd7f32] border-[#cd7f32] text-white"
                            : level === "prata"
                            ? "bg-[#c0c0c0] border-[#c0c0c0] text-black"
                            : "bg-[#ffd700] border-[#ffd700] text-black"
                          : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red text-sm text-center">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl bg-neon text-background font-semibold hover:opacity-90 transition-all"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
