// ============================================
// useChatbot.ts — Hook de gerenciamento do chatbot
// Controla mensagens, estado de digitação e fluxo de confirmação
// ============================================

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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Transação extraída pela IA (presente apenas quando content
   *  contém a mensagem de confirmação) */
  parsedTransaction?: ParsedTransaction;
  /** Transação já convertida para o formato do storage */
  storageTransaction?: {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
  };
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
// Hook
// ---------------------------------------------------

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá! 👋 Sou o assistente financeiro do StreamLedger.\n\nMe conte sua transação em linguagem natural, por exemplo:\n• *Recebi 80 reais de subs hoje*\n• *Gastei 250 no headset novo*\n\nQuando eu entender, vou te pedir uma confirmação antes de salvar.",
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rola para o final sempre que as mensagens mudam
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Envia mensagem do usuário
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);
      setError(null);
      scrollToBottom();

      try {
        const res = await fetch("/api/chatbot/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text.trim() }),
        });

        const data = await res.json();

        if (data.success) {
          const parsed: ParsedTransaction = data.transaction;

          const tipoStorage =
            parsed.tipo === "entrada" ? "income" : "expense";

          const storageTransaction = {
            title: parsed.descricao,
            amount: parsed.valor,
            type: tipoStorage as "income" | "expense",
            category: CATEGORY_MAP[parsed.categoria] ?? "Geral",
          };

          // Mensagem de confirmação com a transação extraída
          const tipoLabel = parsed.tipo === "entrada" ? "Entrada" : "Saída";
          const valorFmt = parsed.valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          });
          const dataFmt = new Date(parsed.data + "T00:00:00").toLocaleDateString(
            "pt-BR"
          );

          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              `Entendi! Aqui estão os dados que extraí:\n\n` +
              `📌 **Tipo:** ${tipoLabel}\n` +
              `💬 **Descrição:** ${parsed.descricao}\n` +
              `💰 **Valor:** ${valorFmt}\n` +
              `🏷 **Categoria:** ${parsed.categoria}\n` +
              `📅 **Data:** ${dataFmt}\n\n` +
              `Posso salvar essa transação? 🤔`,
            parsedTransaction: parsed,
            storageTransaction,
          };

          setMessages((prev) => [...prev, assistantMsg]);
        } else {
          // Mensagem amigável quando a IA não entende
          const assistantMsg: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content:
              `Ops! ${data.error}\n\n` +
              `Dica: mencione um **valor** e se é uma **entrada** ou **saída**.\n` +
              `Exemplo: *"Recebi 50 reais de doação"*`,
          };
          setMessages((prev) => [...prev, assistantMsg]);
        }
      } catch {
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            "Houve um erro de conexão. Tente novamente em alguns instantes. 😅",
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } finally {
        setIsTyping(false);
        scrollToBottom();
      }
    },
    [scrollToBottom]
  );

  // Limpa o histórico
  const clearHistory = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Histórico limpo! Me conte sua próxima transação. 😊",
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isTyping,
    error,
    messagesEndRef,
    sendMessage,
    clearHistory,
    scrollToBottom,
  };
}
