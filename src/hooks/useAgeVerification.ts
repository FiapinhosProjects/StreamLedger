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
  getParentalLinks,
  type StoredUser,
} from "@/lib/storage";
import {
  validateCPF,
  calculateAge,
  classifyUser,
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
 * Verifica se menor tem vínculo parental ativo
 */
function checkMinorHasLink(cpf: string): { hasLink: boolean; parentId?: string } {
  const links = getParentalLinks();
  const link = links.find((l) => l.minorCpf === cpf && l.status === "accepted");

  if (link) {
    return { hasLink: true, parentId: link.parentId };
  }
  return { hasLink: false };
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

      // Verifica se menor tem vínculo parental ativo
      const { hasLink, parentId } = checkMinorHasLink(cpf);

      // Se é menor mas tem vínculo ativo, libera acesso
      const isAdult = age >= 18;
      const hasParentalLink = hasLink && !isAdult;

      // Cria usuário verificado
      const user: StoredUser = {
        cpf,
        nome: mockData.nome,
        email: mockData.email,
        birthDate,
        ageGroup,
        govBrLevel: mockData.nivel,
        consentGiven: isAdult || hasParentalLink,
        linkedParentId: hasParentalLink ? parentId : undefined,
        verified: true,
        verifiedAt: new Date().toISOString(),
      };

      // Salva no localStorage
      saveCurrentUser(user);

      // Registra auditoria
      addAuditEntry({
        cpf,
        userType: isAdult ? "adult" : "minor",
        action: isAdult ? "ADULT_LOGIN" : (hasParentalLink ? "MINOR_WITH_LINK" : "MINOR_WITHOUT_LINK"),
        details: { age, ageGroup, govBrLevel: mockData.nivel, hasParentalLink, parentId },
      });

      // Atualiza estado
      setState({
        isLoading: false,
        isVerified: true,
        user,
        // Menor sem vínculo precisa de consentimento parental
        needsParentalConsent: !isAdult && !hasParentalLink,
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
   * Define vínculo parental manualmente (após responsável criar)
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
