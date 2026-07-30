// ============================================
// useParentalLink.ts - Hook de vínculo parental
// Gerencia vínculo entre responsável e menor
// ============================================

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getParentAccount,
  saveParentAccount,
  getParentalLinks,
  addParentalLink,
  updateParentalLink,
  addAuditEntry,
  type StoredParent,
  type StoredParentalLink,
} from "@/lib/storage";
import { validateCPF, calculateAge, classifyUser, generateLinkCode, generateExpirationDate } from "@/lib/cpfValidation";
import type { AgeGroup } from "@/lib/user-types";

interface ParentalState {
  parent: StoredParent | null;
  links: StoredParentalLink[];
  isLoading: boolean;
}

interface CreateLinkParams {
  minorCpf: string;
  minorName: string;
  minorEmail: string;
  minorBirthDate: string;
}

/**
 * Hook para gerenciar conta do responsável e vínculos
 */
export function useParentalLink() {
  const [state, setState] = useState<ParentalState>({
    parent: null,
    links: [],
    isLoading: true,
  });

  // Carrega dados do localStorage
  useEffect(() => {
    const parent = getParentAccount();
    const links = getParentalLinks();
    setState({ parent, links, isLoading: false });
  }, []);

  /**
   * Cria conta de responsável (após login Gov.br)
   */
  const createParentAccount = useCallback(
    (cpf: string, nome: string, email: string, govBrLevel: "bronze" | "prata" | "ouro") => {
      const parent: StoredParent = {
        id: Date.now().toString(),
        cpf,
        nome,
        email,
        govBrLevel,
        linkedMinors: [],
        createdAt: new Date().toISOString(),
      };

      saveParentAccount(parent);

      // Registra auditoria
      addAuditEntry({
        cpf,
        userType: "parent",
        action: "PARENT_ACCOUNT_CREATED",
        details: { nome, govBrLevel },
      });

      setState((prev) => ({ ...prev, parent }));
      return parent;
    },
    []
  );

  /**
   * Cria vínculo com menor
   * O vínculo é criado como "accepted" automaticamente, pois o responsável
   * está confirmando diretamente. Não precisa de aceite adicional.
   */
  const createLink = useCallback(
    (params: CreateLinkParams): StoredParentalLink | null => {
      if (!state.parent) return null;

      // Valida CPF do menor
      if (!validateCPF(params.minorCpf)) {
        return null;
      }

      // Calcula idade do menor
      const age = calculateAge(params.minorBirthDate);
      const ageGroup = classifyUser(age);

      // Cria vínculo como accepted (responsável confirmou diretamente)
      const link: StoredParentalLink = {
        id: Date.now().toString(),
        parentId: state.parent.id,
        minorCpf: params.minorCpf,
        minorName: params.minorName,
        minorEmail: params.minorEmail,
        minorAge: age,
        minorBirthDate: params.minorBirthDate,
        status: "accepted",
        linkCode: generateLinkCode(),
        createdAt: new Date().toISOString(),
        acceptedAt: new Date().toISOString(),
        expiresAt: generateExpirationDate(),
      };

      addParentalLink(link);

      // Registra auditoria
      addAuditEntry({
        cpf: state.parent.cpf,
        userType: "parent",
        action: "MINOR_LINK_CREATED",
        details: { minorAge: age, minorName: params.minorName, minorCpf: params.minorCpf },
        parentalLinkId: link.id,
      });

      setState((prev) => ({
        ...prev,
        links: [...prev.links, link],
        parent: prev.parent
          ? { ...prev.parent, linkedMinors: [...prev.parent.linkedMinors, params.minorCpf] }
          : null,
      }));

      return link;
    },
    [state.parent]
  );

  /**
   * Aceita vínculo (menor confirma)
   */
  const acceptLink = useCallback(
    (linkCode: string): boolean => {
      const links = getParentalLinks();
      const link = links.find((l) => l.linkCode === linkCode && l.status === "pending");

      if (!link) return false;

      // Atualiza status
      updateParentalLink(link.id, {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      });

      // Atualiza responsável com menor vinculado
      const parent = getParentAccount();
      if (parent) {
        saveParentAccount({
          ...parent,
          linkedMinors: [...parent.linkedMinors, link.minorCpf],
        });
      }

      // Registra auditoria
      addAuditEntry({
        cpf: link.minorCpf,
        userType: "minor",
        action: "MINOR_LINK_ACCEPTED",
        details: { parentId: link.parentId, age: link.minorAge },
        parentalLinkId: link.id,
      });

      // Atualiza estado
      setState((prev) => ({
        ...prev,
        links: prev.links.map((l) =>
          l.id === link.id ? { ...l, status: "accepted" as const, acceptedAt: new Date().toISOString() } : l
        ),
        parent: parent
          ? { ...parent, linkedMinors: [...parent.linkedMinors, link.minorCpf] }
          : null,
      }));

      return true;
    },
    []
  );

  /**
   * Recusa/rejeita vínculo
   */
  const rejectLink = useCallback((linkId: string) => {
    updateParentalLink(linkId, { status: "rejected" });

    addAuditEntry({
      cpf: "",
      userType: "parent",
      action: "MINOR_LINK_REJECTED",
      details: { linkId },
      parentalLinkId: linkId,
    });

    setState((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === linkId ? { ...l, status: "rejected" as const } : l)),
    }));
  }, []);

  /**
   * Remove vínculo
   */
  const removeLink = useCallback((linkId: string) => {
    const links = getParentalLinks();
    const link = links.find((l) => l.id === linkId);

    if (!link) return;

    const parent = getParentAccount();
    if (parent) {
      saveParentAccount({
        ...parent,
        linkedMinors: parent.linkedMinors.filter((cpf) => cpf !== link.minorCpf),
      });
    }

    // Remove da lista (filtrando)
    const updated = links.filter((l) => l.id !== linkId);
    localStorage.setItem("streamLedger_parental_links", JSON.stringify(updated));

    setState((prev) => ({
      ...prev,
      links: prev.links.filter((l) => l.id !== linkId),
      parent: parent
        ? { ...parent, linkedMinors: parent.linkedMinors.filter((cpf) => cpf !== link.minorCpf) }
        : null,
    }));
  }, []);

  /**
   * Verifica se menor está vinculado a algum responsável
   */
  const isMinorLinked = useCallback((minorCpf: string): StoredParentalLink | null => {
    const links = getParentalLinks();
    return links.find((l) => l.minorCpf === minorCpf && l.status === "accepted") || null;
  }, []);

  /**
   * Obtém links pendentes
   */
  const getPendingLinks = useCallback((): StoredParentalLink[] => {
    return state.links.filter((l) => l.status === "pending");
  }, [state.links]);

  /**
   * Obtém links aceitos
   */
  const getAcceptedLinks = useCallback((): StoredParentalLink[] => {
    return state.links.filter((l) => l.status === "accepted");
  }, [state.links]);

  return {
    ...state,
    createParentAccount,
    createLink,
    acceptLink,
    rejectLink,
    removeLink,
    isMinorLinked,
    getPendingLinks,
    getAcceptedLinks,
  };
}

/**
 * Hook para configurar notificações parentais
 */
export function useParentalNotifications() {
  const [prefs, setPrefs] = useState({
    alertAllTransactions: true,
    threshold: 5000, // R$ 50,00 em centavos
    emailEnabled: true,
  });

  useEffect(() => {
    const parent = getParentAccount();
    if (parent?.notificationPrefs) {
      setPrefs(parent.notificationPrefs as typeof prefs);
    }
  }, []);

  const updatePrefs = useCallback((updates: Partial<typeof prefs>) => {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);

    const parent = getParentAccount();
    if (parent) {
      saveParentAccount({
        ...parent,
        notificationPrefs: newPrefs as StoredParent["notificationPrefs"],
      });
    }
  }, [prefs]);

  return { prefs, updatePrefs };
}
