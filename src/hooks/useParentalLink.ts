"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getParentAccount,
  saveParentAccount,
  getParentalLinks,
  addParentalLink,
  updateParentalLink,
  saveParentalLinks,
  addAuditEntry,
  migrateToSecureStorage,
  type StoredParent,
  type StoredParentalLink,
} from "@/lib/storage";
import {
  validateCPF,
  calculateAge,
  classifyUser,
  generateLinkCode,
  generateExpirationDate,
} from "@/lib/cpfValidation";
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

  // Inicialização: migra dados legados e carrega do storage
  useEffect(() => {
    let mounted = true;

    async function init() {
      await migrateToSecureStorage();

      if (!mounted) return;

      const [parent, links] = await Promise.all([
        getParentAccount(),
        getParentalLinks(),
      ]);

      if (mounted) {
        setState({ parent, links, isLoading: false });
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Cria conta de responsável (após login Gov.br)
   */
  const createParentAccount = useCallback(
    async (cpf: string, nome: string, email: string, govBrLevel: "bronze" | "prata" | "ouro") => {
      const parent: StoredParent = {
        id: Date.now().toString(),
        cpf,
        nome,
        email,
        govBrLevel,
        linkedMinors: [],
        createdAt: new Date().toISOString(),
      };

      await saveParentAccount(parent);

      // Registra auditoria (criptografada)
      await addAuditEntry({
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
    async (params: CreateLinkParams): Promise<StoredParentalLink | null> => {
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

      await addParentalLink(link);

      // Registra auditoria (criptografada)
      await addAuditEntry({
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
    async (linkCode: string): Promise<boolean> => {
      const links = await getParentalLinks();
      const link = links.find((l) => l.linkCode === linkCode && l.status === "pending");

      if (!link) return false;

      // Atualiza status
      await updateParentalLink(link.id, {
        status: "accepted",
        acceptedAt: new Date().toISOString(),
      });

      // Atualiza responsável com menor vinculado
      const parent = await getParentAccount();
      if (parent) {
        await saveParentAccount({
          ...parent,
          linkedMinors: [...parent.linkedMinors, link.minorCpf],
        });
      }

      // Registra auditoria (criptografada)
      await addAuditEntry({
        cpf: link.minorCpf,
        userType: "minor",
        action: "MINOR_LINK_ACCEPTED",
        details: { parentId: link.parentId, age: link.minorAge },
        parentalLinkId: link.id,
      });

      // Atualiza estado
      const updatedLinks = await getParentalLinks();
      setState((prev) => ({
        ...prev,
        links: updatedLinks,
        parent,
      }));

      return true;
    },
    []
  );

  /**
   * Recusa/rejeita vínculo
   */
  const rejectLink = useCallback(
    async (linkId: string) => {
      await updateParentalLink(linkId, { status: "rejected" });

      await addAuditEntry({
        cpf: "",
        userType: "parent",
        action: "MINOR_LINK_REJECTED",
        details: { linkId },
        parentalLinkId: linkId,
      });

      const updatedLinks = await getParentalLinks();
      setState((prev) => ({
        ...prev,
        links: updatedLinks,
      }));
    },
    []
  );

  /**
   * Remove vínculo
   */
  const removeLink = useCallback(
    async (linkId: string) => {
      const links = await getParentalLinks();
      const link = links.find((l) => l.id === linkId);

      if (!link) return;

      const parent = await getParentAccount();
      if (parent) {
        await saveParentAccount({
          ...parent,
          linkedMinors: parent.linkedMinors.filter((cpf) => cpf !== link.minorCpf),
        });
      }

      // Atualiza storage com lista filtrada (criptografado)
      await saveParentalLinks(links.filter((l) => l.id !== linkId));

      setState((prev) => ({
        ...prev,
        links: prev.links.filter((l) => l.id !== linkId),
        parent: parent
          ? { ...parent, linkedMinors: parent.linkedMinors.filter((cpf) => cpf !== link.minorCpf) }
          : null,
      }));
    },
    []
  );

  /**
   * Verifica se menor está vinculado a algum responsável
   */
  const isMinorLinked = useCallback(
    async (minorCpf: string): Promise<StoredParentalLink | null> => {
      const links = await getParentalLinks();
      return links.find((l) => l.minorCpf === minorCpf && l.status === "accepted") || null;
    },
    []
  );

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
    let mounted = true;

    async function load() {
      const parent = await getParentAccount();
      if (mounted && parent?.notificationPrefs) {
        setPrefs(parent.notificationPrefs as typeof prefs);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePrefs = useCallback(
    async (updates: Partial<typeof prefs>) => {
      const newPrefs = { ...prefs, ...updates };
      setPrefs(newPrefs);

      const parent = await getParentAccount();
      if (parent) {
        await saveParentAccount({
          ...parent,
          notificationPrefs: newPrefs as StoredParent["notificationPrefs"],
        });
      }
    },
    [prefs]
  );

  return { prefs, updatePrefs };
}
