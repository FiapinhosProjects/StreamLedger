// ============================================
// Chatbot.tsx — Widget de chat flutuante (FAB + janela)
// Inclui: histórico, typing indicator, confirmação de transação
// ============================================

"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { useChatbot, type ChatMessage, type ParsedTransaction } from "@/hooks/useChatbot";

// ---------------------------------------------------
// Props
// ---------------------------------------------------

interface ChatbotProps {
  /** Callback chamado quando o usuário confirma uma transação.
   *  Recebe o formato de storage (title, amount, type, category). */
  onConfirm: (transaction: {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
  }) => void;
}

// ---------------------------------------------------
// Componente principal
// ---------------------------------------------------

export default function Chatbot({ onConfirm }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, isTyping, messagesEndRef, sendMessage, clearHistory } =
    useChatbot();

  // Foca no input quando abre o chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* ---------------------------------------- */}
      {/* Janela de Chat (abre/fecha com FAB)      */}
      {/* ---------------------------------------- */}
      <div
        className={`fixed bottom-20 right-6 z-[90] flex flex-col rounded-2xl border border-neon/25 bg-card shadow-[0_0_40px_rgba(93,255,155,0.12)] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen
            ? "w-[380px] h-[560px] opacity-100 scale-100"
            : "w-0 h-0 opacity-0 scale-75 pointer-events-none"
        }`}
        style={{ maxWidth: "calc(100vw - 48px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-neon/15 bg-header px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Avatar do bot */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-neon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              {/* Indicador online */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon border-2 border-header" />
            </div>

            <div>
              <p className="text-sm font-semibold text-white leading-tight">
                Assistente Financeiro
              </p>
              <p className="text-xs text-neon/70">Gemini-powered</p>
            </div>
          </div>

          {/* Ações do header */}
          <div className="flex items-center gap-1">
            {/* Limpar histórico */}
            <button
              onClick={clearHistory}
              title="Limpar conversa"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            {/* Minimizar */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Fechar chat"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onConfirm={onConfirm}
              onCancel={() => {/* msg descartada pelo usuário */}}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Ref para scroll automático */}
          <div ref={messagesEndRef} />
        </div>

        {/* Campo de entrada */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-neon/15 px-4 py-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Recebi 80 de sub..."
            maxLength={300}
            className="flex-1 rounded-xl border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon text-background transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>

      {/* ---------------------------------------- */}
      {/* Botão FAB flutuante                      */}
      {/* ---------------------------------------- */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
        className={`fixed bottom-6 right-6 z-[95] flex items-center justify-center w-14 h-14 rounded-full
          bg-neon text-background shadow-[0_0_20px_rgba(93,255,155,0.4)]
          transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(93,255,155,0.6)]
          active:scale-95 ${
            isOpen ? "rotate-0" : ""
          }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}

        {/* Badge de notificação quando fechado e有新消息 */}
        {!isOpen && messages.length <= 1 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon" />
          </span>
        )}
      </button>
    </>
  );
}

// ---------------------------------------------------
// Sub-componente: Balão de mensagem
// ---------------------------------------------------

interface ChatBubbleProps {
  message: ChatMessage;
  onConfirm: (tx: {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
  }) => void;
  onCancel: () => void;
}

function ChatBubble({ message, onConfirm, onCancel }: ChatBubbleProps) {
  const isUser = message.role === "user";

  // Detecta se a mensagem contém uma proposta de transação
  const hasConfirmation = !!message.storageTransaction;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
          isUser
            ? "rounded-tr-sm bg-neon/15 border border-neon/20 text-white"
            : "rounded-tl-sm bg-white/5 border border-white/10 text-white/90"
        }`}
      >
        {/* Conteúdo textual */}
        <p className={hasConfirmation ? "mb-3" : ""}>{message.content}</p>

        {/* Botões de confirmação (apenas mensagens do assistente com transação) */}
        {hasConfirmation && !isUser && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => onConfirm(message.storageTransaction!)}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-neon text-background hover:opacity-90 transition-all active:scale-95"
            >
              ✓ Confirmar
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-white/20 text-white/70 hover:bg-white/5 transition-all active:scale-95"
            >
              ✕ Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------
// Sub-componente: Indicador de digitação
// ---------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
