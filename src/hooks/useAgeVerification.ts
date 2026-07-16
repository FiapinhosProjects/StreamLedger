// ============================================
// useAgeVerification.ts - Hook de verificação de idade
// Gerencia estado de autenticação e verificação conforme Lei Felca
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCurrentUser,
  saveCurrentUser,
  clearCurrentUser,
  addAuditEntry,
  type StoredUser,
} from "@/lib/storage";
import {
  validateCPF,
  calculateAge,
  classifyUser,
  generateRandomBirthDate,
  formatCPF,
} from "@/lib/cpfValidation";
import type { GovBrLevel, AgeGroup } from "@/lib/user-types";

interface AgeVerificationState {
  isLoading: boolean;
  isVerified: boolean;
  user: StoredUser | null;
  needsParentalConsent: boolean;
}

interface MockGovBrData {
  nivel: GovBrLevel;
  nome: string;
  email: string;
}

/**
 * Hook principal para verificação de idade
 */
export function useAgeVerification() {
  const [state, setState] = useState<AgeVerificationState>({
    isLoading: true,
    isVerified: false,
    user: null,
    needsParentalConsent: false,
  });

  // Para testes: NÃO carrega do localStorage
  // Sempre começa deslogado para facilitar testes
  useEffect(() => {
    // Comentado para testes - descomente em produção
    // const user = getCurrentUser();
    // if (user && user.verified) {
    //   setState({
    //     isLoading: false,
    //     isVerified: true,
    //     user,
    //     needsParentalConsent: user.ageGroup !== "adult" && !user.linkedParentId,
    //   });
    // } else {
    setState((prev) => ({ ...prev, isLoading: false }));
    // }
  }, []);

  /**
   * Simula login via Gov.br (mock para protótipo)
   * Em produção, isso seria substituído por OAuth real
   */
  const loginWithGovBr = useCallback(
    (cpf: string, mockData: MockGovBrData, birthDate: string) => {
      // Valida CPF
      if (!validateCPF(cpf)) {
        return { success: false, error: "CPF inválido" };
      }

      // Calcula idade
      const age = calculateAge(birthDate);
      const ageGroup = classifyUser(age);

      // Cria usuário verificado
      const user: StoredUser = {
        cpf,
        nome: mockData.nome,
        email: mockData.email,
        birthDate,
        ageGroup,
        govBrLevel: mockData.nivel,
        consentGiven: age >= 18,
        linkedParentId: undefined,
        verified: true,
        verifiedAt: new Date().toISOString(),
      };

      // Salva no localStorage
      saveCurrentUser(user);

      // Registra auditoria
      addAuditEntry({
        cpf,
        userType: ageGroup === "adult" ? "adult" : "minor",
        action: ageGroup === "adult" ? "AGE_GROUP_CLASSIFIED" : "AGE_GROUP_CLASSIFIED",
        details: { age, ageGroup, govBrLevel: mockData.nivel },
      });

      // Atualiza estado
      setState({
        isLoading: false,
        isVerified: true,
        user,
        needsParentalConsent: ageGroup !== "adult",
      });

      return { success: true, user };
    },
    []
  );

  /**
   * Logout - limpa usuário verificado
   */
  const logout = useCallback(() => {
    clearCurrentUser();
    setState({
      isLoading: false,
      isVerified: false,
      user: null,
      needsParentalConsent: false,
    });
  }, []);

  /**
   * Define vínculo parental (após aprovação do responsável)
   */
  const setParentalLink = useCallback((parentId: string) => {
    const user = getCurrentUser();
    if (user) {
      const updated = { ...user, linkedParentId: parentId };
      saveCurrentUser(updated);
      setState((prev) => ({
        ...prev,
        user: updated,
        needsParentalConsent: false,
      }));
    }
  }, []);

  return {
    ...state,
    loginWithGovBr,
    logout,
    setParentalLink,
  };
}

/**
 * Hook para simular seleção de nível Gov.br (mock)
 */
export function useGovBrMock() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<GovBrLevel>("bronze");

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Simula Gov.br login com dados mockados
  const simulateLogin = useCallback(
    (level: GovBrLevel, cpf: string, birthDate: string): MockGovBrData => {
      const names: Record<GovBrLevel, string> = {
        bronze: "Usuário Bronze",
        prata: "Maria Silva",
        ouro: "João Santos",
      };

      const emails: Record<GovBrLevel, string> = {
        bronze: "bronze@exemplo.com",
        prata: "maria.silva@exemplo.com",
        ouro: "joao.santos@exemplo.com",
      };

      return {
        nivel: level,
        nome: names[level],
        email: emails[level],
      };
    },
    []
  );

  return {
    isModalOpen,
    selectedLevel,
    setSelectedLevel,
    openModal,
    closeModal,
    simulateLogin,
  };
}

/**
 * Hook para gerenciar estado de verificação via CPF
 */
export function useCPFVerification() {
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpfError, setCpfError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  const formatCpfInput = useCallback((value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      setCpf(formatCPF(numbers));
    }
  }, []);

  const formatDateInput = useCallback((value: string) => {
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
  }, []);

  const validate = useCallback(() => {
    let valid = true;

    // Valida CPF
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

    // Valida data de nascimento
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

  const getAgeGroup = useCallback((): AgeGroup | null => {
    if (!validateCPF(cpf) || !birthDate) return null;
    const age = calculateAge(birthDate);
    return classifyUser(age);
  }, [cpf, birthDate]);

  const reset = useCallback(() => {
    setCpf("");
    setBirthDate("");
    setCpfError(null);
    setBirthDateError(null);
  }, []);

  return {
    cpf,
    setCpf: formatCpfInput,
    birthDate,
    setBirthDate: formatDateInput,
    cpfError,
    birthDateError,
    validate,
    getAgeGroup,
    reset,
    calculateAge: (date: string) => calculateAge(date),
  };
}
