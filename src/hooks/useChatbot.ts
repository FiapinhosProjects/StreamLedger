"use client";

import { useState, useRef, useCallback } from "react";

// ---------------------------------------------------
// Types
// ---------------------------------------------------

export interface ParsedTransaction {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
}

export interface StorageTransaction {
  id?: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** Texto original do usuário (para retry em erro) */
  originalText?: string;
  /** Transações extraídas pela IA */
  transactions: Array<{
    parsed: ParsedTransaction;
    storage: StorageTransaction;
    status: "pending" | "confirmed" | "dismissed";
  }>;
}

// ---------------------------------------------------
// Mapping de categorias do chatbot → storage
// ---------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  Doação: "Donates",
  Sub: "Twitch Subs",
  Patrocínio: "Donates",
  Equipamento: "Setup",
  Software: "Software",
  Outros: "Geral",
};

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseTransaction(
  parsed: ParsedTransaction
): StorageTransaction | null {
  const tipoStorage =
    parsed.tipo === "entrada" ? "income" : "expense";

  const safeTitle = String(parsed.descricao ?? "")
    .slice(0, 100)
    .replace(/"/g, "'")
    .trim();
  const safeAmount = Number(parsed.valor);
  const safeCategory = CATEGORY_MAP[String(parsed.categoria)] ?? "Geral";

  if (
    !["entrada", "saida"].includes(parsed.tipo) ||
    isNaN(safeAmount) ||
    safeAmount <= 0 ||
    !safeTitle
  ) {
    return null;
  }

  return {
    title: safeTitle,
    amount: safeAmount,
    type: tipoStorage as "income" | "expense",
    category: safeCategory,
  };
}

// ---------------------------------------------------
// Hook
// ---------------------------------------------------

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid("welcome"),
      role: "assistant",
      content: "Olá! 👋 Sou o assistente financeiro do StreamLedger.\n\nMe conte sua transação em linguagem natural. Pode incluir várias de uma vez!\n• *Recebi 80 de sub e gastei 200 no headset*\n• *Doação de 50 e assinatura VPN de 30*\n\nQuando eu entender, vou te pedir confirmação antes de salvar cada uma.",
      timestamp: new Date(),
      transactions: [],
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState("Digitando...");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const userMsg: ChatMessage = {
        id: uid("user"),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
        transactions: [],
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setTypingMessage("Iniciando...");
      scrollToBottom();

      const typingTimer = setTimeout(
        () => setTypingMessage("Processando transações..."),
        3_000
      );

      try {
        const res = await fetch("/api/chatbot/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
          signal: AbortSignal.timeout(35_000),
        });

        if (!res.ok) {
          let errorMessage = "Erro do servidor. Tente novamente.";
          try {
            const errData = await res.json();
            errorMessage = errData.error ?? errorMessage;
          } catch { /* usa genérica */ }
          throw Object.assign(new Error(errorMessage), { retryText: text.trim() });
        }

        let data: { success: boolean; transactions?: ParsedTransaction[]; error?: string };
        try {
          data = await res.json();
        } catch {
          throw Object.assign(new Error("Resposta inválida do servidor."), {
            retryText: text.trim(),
          });
        }

        if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
          const built = data.transactions
            .map((parsed) => {
              const storage = parseTransaction(parsed);
              return storage ? { parsed, storage, status: "pending" as const } : null;
            })
            .filter(Boolean) as Array<{
              parsed: ParsedTransaction;
              storage: StorageTransaction;
              status: "pending" | "confirmed" | "dismissed";
            }>;

          if (built.length === 0) {
            throw Object.assign(
              new Error(
                "Dados das transações inválidos. Tente novamente."
              ),
              { retryText: text.trim() }
            );
          }

          const total = built.length;
          const intro =
            total === 1
              ? "Encontrei 1 transação!"
              : `Encontrei ${total} transações! Confirme cada uma abaixo.`;

          const assistantMsg: ChatMessage = {
            id: uid("assistant"),
            role: "assistant",
            content: intro,
            timestamp: new Date(),
            transactions: built,
          };

          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          const assistantMsg: ChatMessage = {
            id: uid("assistant"),
            role: "assistant",
            content:
              (data.error ?? "Não consegui identificar transações.") +
              "\n\nDica: mencione um valor e se é entrada ou saída.\nExemplo: *'Recebi 50 de doação'* ou *'Gastei 200 no headset'*",
            timestamp: new Date(),
            transactions: [],
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch (err) {
        const e = err as Error & { retryText?: string };
        const assistantMsg: ChatMessage = {
          id: uid("assistant"),
          role: "assistant",
          content: e.message ?? "Houve um erro. Tente novamente.",
          timestamp: new Date(),
          transactions: [],
          originalText: e.retryText,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        clearTimeout(typingTimer);
        setIsTyping(false);
        setTypingMessage("Digitando...");
        scrollToBottom();
      }
    },
    [scrollToBottom]
  );

  // Confirma uma transação específica dentro de uma mensagem
  const confirmTransaction = useCallback(
    (messageId: string, storage: StorageTransaction) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            transactions: m.transactions.map((t) =>
              t.storage.title === storage.title &&
              t.storage.amount === storage.amount
                ? { ...t, status: "confirmed" as const }
                : t
            ),
          };
        })
      );
    },
    []
  );

  // Atualiza o id de uma transação confirmada (após salvar no storage)
  const updateTransactionId = useCallback(
    (messageId: string, storage: StorageTransaction, id: number) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          return {
            ...m,
            transactions: m.transactions.map((t) =>
              t.storage.title === storage.title &&
              t.storage.amount === storage.amount
                ? { ...t, storage: { ...t.storage, id } }
                : t
            ),
          };
        })
      );
    },
    []
  );

  // Descarta uma transação específica dentro de uma mensagem
  const dismissTransaction = useCallback((messageId: string, storage: StorageTransaction) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        return {
          ...m,
          transactions: m.transactions.map((t) =>
            t.storage.title === storage.title &&
            t.storage.amount === storage.amount
              ? { ...t, status: "dismissed" as const }
              : t
          ),
        };
      })
    );
  }, []);

  // Descarta mensagem inteira (erro)
  const dismissMessage = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, content: "Transação cancelada. Fique à vontade para fazer outra! 😊", transactions: [] }
          : m
      )
    );
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: uid("welcome"),
        role: "assistant",
        content: "Histórico limpo! Me conte suas transações. 😊",
        timestamp: new Date(),
        transactions: [],
      },
    ]);
  }, []);

  return {
    messages,
    isTyping,
    typingMessage,
    messagesEndRef,
    sendMessage,
    clearHistory,
    dismissMessage,
    confirmTransaction,
    dismissTransaction,
    updateTransactionId,
    scrollToBottom,
  };
}
