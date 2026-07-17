// ============================================
// ConsentForm.tsx - Termo de Consentimento Parental
// Formulário que responsável assina para permitir acesso do menor
// Conforme Lei Felca (Lei 15.211/2025)
// ============================================

"use client";

import { useState } from "react";
import { validateCPF, formatCPF, calculateAge, classifyUser } from "@/lib/cpfValidation";
import type { AgeGroup } from "@/lib/user-types";

interface ConsentFormProps {
  onSubmit: (data: ConsentData) => void;
  onCancel: () => void;
}

export interface ConsentData {
  minorCpf: string;
  minorName: string;
  minorBirthDate: string;
  minorEmail: string;
  consentGiven: boolean;
  ageGroup: AgeGroup;
}

export default function ConsentForm({ onSubmit, onCancel }: ConsentFormProps) {
  const [minorCpf, setMinorCpf] = useState("");
  const [minorName, setMinorName] = useState("");
  const [minorBirthDate, setMinorBirthDate] = useState("");
  const [minorEmail, setMinorEmail] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCpfInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      setMinorCpf(formatCPF(numbers));
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

    setMinorBirthDate(formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Valida CPF do menor
    const cleanCpf = minorCpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      newErrors.minorCpf = "CPF deve ter 11 dígitos";
    } else if (!validateCPF(cleanCpf)) {
      newErrors.minorCpf = "CPF inválido";
    }

    // Valida nome
    if (minorName.trim().length < 3) {
      newErrors.minorName = "Nome deve ter pelo menos 3 caracteres";
    }

    // Valida data
    const dateParts = minorBirthDate.split("/");
    if (dateParts.length !== 3 || dateParts[0].length !== 2 || dateParts[1].length !== 2 || dateParts[2].length !== 4) {
      newErrors.minorBirthDate = "Data deve ser DD/MM/AAAA";
    } else {
      const [, , year] = dateParts.map(Number);
      if (year < 1900 || year > new Date().getFullYear()) {
        newErrors.minorBirthDate = "Ano inválido";
      }
    }

    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(minorEmail)) {
      newErrors.minorEmail = "Email inválido";
    }

    // Valida consentimento
    if (!consentChecked) {
      newErrors.consent = "Você precisa aceitar o termo para continuar";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const age = calculateAge(minorBirthDate);
    const ageGroup = classifyUser(age);

    onSubmit({
      minorCpf: minorCpf.replace(/\D/g, ""),
      minorName: minorName.trim(),
      minorBirthDate,
      minorEmail: minorEmail.trim(),
      consentGiven: true,
      ageGroup,
    });
  };

  return (
    <div className="bg-card border border-neon/20 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-neon/5 border-b border-neon/20 p-4">
        <h2 className="text-lg font-bold text-neon">Termo de Responsabilidade Parental</h2>
        <p className="text-muted text-sm">Conforme Lei 15.211/2025 (ECA Digital)</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          {/* CPF do menor */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              CPF do Menor
            </label>
            <input
              type="text"
              value={minorCpf}
              onChange={(e) => formatCpfInput(e.target.value)}
              placeholder="000.000.000-00"
              className={`w-full rounded-lg border ${errors.minorCpf ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
              maxLength={14}
            />
            {errors.minorCpf && <p className="text-red text-xs mt-1">{errors.minorCpf}</p>}
          </div>

          {/* Nome do menor */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Nome Completo do Menor
            </label>
            <input
              type="text"
              value={minorName}
              onChange={(e) => setMinorName(e.target.value)}
              placeholder="Nome completo"
              className={`w-full rounded-lg border ${errors.minorName ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
            />
            {errors.minorName && <p className="text-red text-xs mt-1">{errors.minorName}</p>}
          </div>

          {/* Data de nascimento */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Data de Nascimento do Menor
            </label>
            <input
              type="text"
              value={minorBirthDate}
              onChange={(e) => formatDateInput(e.target.value)}
              placeholder="DD/MM/AAAA"
              className={`w-full rounded-lg border ${errors.minorBirthDate ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
              maxLength={10}
            />
            {errors.minorBirthDate && <p className="text-red text-xs mt-1">{errors.minorBirthDate}</p>}
          </div>

          {/* Email do menor */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1">
              Email do Menor (para notificação)
            </label>
            <input
              type="email"
              value={minorEmail}
              onChange={(e) => setMinorEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className={`w-full rounded-lg border ${errors.minorEmail ? "border-red" : "border-white/10"} bg-background px-3 py-2.5 text-sm outline-none focus:border-neon/50`}
            />
            {errors.minorEmail && <p className="text-red text-xs mt-1">{errors.minorEmail}</p>}
          </div>
        </div>

        {/* Termo de consentimento */}
        <div className="mt-6 p-4 bg-yellow/5 border border-yellow/20 rounded-lg">
          <label className="flex gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 w-4 h-4 accent-neon"
            />
            <div className="text-sm">
              <p className="font-medium text-white mb-1">
                Declaro que sou o responsável legal do menor identificado acima.
              </p>
              <p className="text-muted text-xs">
                Assumo total responsabilidade pelas informações prestadas, conforme Art. 299 do Código Penal
                (falsa declaração). Autorizo o menor a utilizar o StreamLedger com monitoramento de transações.
              </p>
            </div>
          </label>
          {errors.consent && <p className="text-red text-xs mt-2">{errors.consent}</p>}
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-white/20 text-white/80 font-medium hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-lg bg-neon text-background font-semibold hover:opacity-90 transition-all"
          >
            Vincular Menor
          </button>
        </div>
      </form>
    </div>
  );
}
