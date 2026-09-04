"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import { useChatbot, type ChatMessage, type StorageTransaction } from "@/hooks/useChatbot";

// ---------------------------------------------------
// Props
// ---------------------------------------------------

interface ChatbotProps {
  onConfirm: (tx: StorageTransaction) => StorageTransaction | void;
  onDelete: (tx: StorageTransaction) => void;
}

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function formatTime(date: Date): string {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Transforma texto com **bold** e \n em JSX inline */
function parseContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.includes("**")) {
      const boldStart = remaining.indexOf("**");
      const boldEnd = remaining.indexOf("**", boldStart + 2);
      if (boldEnd === -1) break;

      if (boldStart > 0) {
        parts.push(remaining.slice(0, boldStart));
      }
      parts.push(
        <strong key={`b-${lineIdx}-${keyIdx++}`}>
          {remaining.slice(boldStart + 2, boldEnd)}
        </strong>
      );
      remaining = remaining.slice(boldEnd + 2);
    }

    if (remaining || parts.length === 0) {
      parts.push(remaining);
    }

    return (
      <span key={`line-${lineIdx}`}>
        {parts.map((p, i) => (
          <span key={i}>{p}</span>
        ))}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ---------------------------------------------------
// TransactionCard — um card por transação
// ---------------------------------------------------

interface TransactionCardProps {
  storage: StorageTransaction;
  tipoLabel: string;
  isIncome: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onDelete?: () => void;
  confirmed?: boolean;
  dismissed?: boolean;
}

function TransactionCard({
  storage,
  tipoLabel,
  isIncome,
  onConfirm,
  onDismiss,
  onDelete,
  confirmed,
  dismissed,
}: TransactionCardProps) {
  if (dismissed) return null;

  if (confirmed) {
    return (
      <div className="mb-2 rounded-xl border border-green-400/20 bg-green-400/5 p-3 text-xs">
        <div className="flex items-start justify-between gap-2">
          <span className="text-green-400/80">
            ✓ <span className="font-medium text-green-400">{storage.title}</span> —{" "}
            {storage.amount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}{" "}
            salvo!
          </span>
          {onDelete && (
            <button
              onClick={onDelete}
              title="Excluir transação"
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-red/60 hover:text-red hover:bg-red/10 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      {/* Badge tipo + valor */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
            isIncome
              ? "text-green-400 border-green-400/30 bg-green-400/10"
              : "text-red border-red/30 bg-red/10"
          }`}
        >
          {isIncome ? "↑ Receita" : "↓ Despesa"}
        </span>
        <span className="text-sm font-bold text-white">
          {storage.amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </span>
      </div>

      {/* Campos */}
      <div className="space-y-1 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-white/40 w-16 flex-shrink-0">Descrição:</span>
          <span className="text-white/90 font-medium">{storage.title}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/40 w-16 flex-shrink-0">Tipo:</span>
          <span className={isIncome ? "text-green-400" : "text-red"}>{tipoLabel}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-white/40 w-16 flex-shrink-0">Categoria:</span>
          <span className="text-white/70">{storage.category}</span>
        </div>
      </div>

      {/* Botões */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={onConfirm}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-neon text-background hover:opacity-90 transition-all active:scale-95"
        >
          ✓ Salvar
        </button>
        <button
          onClick={onDismiss}
          className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-white/20 text-white/60 hover:bg-white/5 transition-all active:scale-95"
        >
          ✕ Ignorar
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------
// ChatBubble
// ---------------------------------------------------

interface ChatBubbleProps {
  message: ChatMessage;
  onConfirm: (tx: StorageTransaction) => void;
  onDelete: (tx: StorageTransaction) => void;
  onConfirmTx: (msgId: string, tx: StorageTransaction) => void;
  onDismissTx: (msgId: string, tx: StorageTransaction) => void;
  onRetry: (text: string) => void;
}

function ChatBubble({
  message,
  onDelete,
  onConfirmTx,
  onDismissTx,
  onRetry,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const hasTransactions =
    message.role === "assistant" && message.transactions.length > 0;
  const hasRetry = message.role === "assistant" && !!message.originalText;

  const pendingCount = message.transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const allDone =
    message.transactions.length > 0 && pendingCount === 0;

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "rounded-tr-sm bg-neon/15 border border-neon/20 text-white"
            : "rounded-tl-sm bg-white/5 border border-white/10 text-white/90"
        }`}
      >
        {/* Texto de intro (para mensagens com transações) */}
        {message.content && (!hasTransactions || message.content !== "assistant") && (
          <p className="mb-2 whitespace-pre-wrap">{parseContent(message.content)}</p>
        )}

        {/* Cards de transação */}
        {message.transactions.map((tx, idx) => (
          <TransactionCard
            key={idx}
            storage={tx.storage}
            tipoLabel={tx.parsed.tipo === "entrada" ? "Entrada" : "Saída"}
            isIncome={tx.parsed.tipo === "entrada"}
            confirmed={tx.status === "confirmed"}
            dismissed={tx.status === "dismissed"}
            onConfirm={() => onConfirmTx(message.id, tx.storage)}
            onDismiss={() => onDismissTx(message.id, tx.storage)}
            onDelete={tx.status === "confirmed" ? () => onDelete(tx.storage) : undefined}
          />
        ))}

        {/* Mensagem de todas confirmadas */}
        {allDone && (
          <p className="text-xs text-neon/70 italic text-center mt-1">
            Todas as transações foram salvas! 🎉
          </p>
        )}

        {/* Retry em erro */}
        {hasRetry && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-red/80 mb-2">Não consegui processar. 😕</p>
            <button
              onClick={() => onRetry(message.originalText!)}
              className="w-full py-1.5 px-3 rounded-lg text-xs font-medium border border-red/30 text-red/80 hover:bg-red/10 hover:border-red/50 transition-all"
            >
              🔄 Tentar novamente
            </button>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <span className="text-[10px] text-white/30 mt-1 px-1">
        {formatTime(message.timestamp)}
      </span>
    </div>
  );
}

// ---------------------------------------------------
// Componente principal
// ---------------------------------------------------

export default function Chatbot({ onConfirm, onDelete }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [charCount, setCharCount] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isTyping,
    typingMessage,
    messagesEndRef,
    sendMessage,
    clearHistory,
    confirmTransaction,
    dismissTransaction,
    updateTransactionId,
  } = useChatbot();

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
    setCharCount(0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Janela de Chat */}
      <div
        className={`fixed bottom-20 right-6 z-[90] flex flex-col rounded-2xl border border-neon/25 bg-card shadow-[0_0_40px_rgba(93,255,155,0.12)] transition-all duration-300 ease-out origin-bottom-right ${
          isOpen ? "w-[380px] h-[560px] opacity-100 scale-100" : "w-0 h-0 opacity-0 scale-75 pointer-events-none"
        }`}
        style={{ maxWidth: "calc(100vw - 48px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-neon/15 bg-header px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-neon border-2 border-header" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Assistente Financeiro</p>
              <p className="text-xs text-neon/70">Gemini-powered</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearHistory} title="Limpar conversa"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button onClick={() => setIsOpen(false)} aria-label="Fechar chat"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              onConfirm={onConfirm}
              onDelete={onDelete}
              onConfirmTx={(msgId, tx) => {
                confirmTransaction(msgId, tx);
                const saved = onConfirm(tx);
                if (saved && typeof saved === "object" && "id" in saved) {
                  updateTransactionId(msgId, tx, saved.id as number);
                }
              }}
              onDismissTx={dismissTransaction}
              onRetry={(text) => sendMessage(text)}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                  <span className="text-xs text-white/40 italic">{typingMessage}</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Campo de entrada */}
        <div className="flex-shrink-0 border-t border-neon/15 px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value.slice(0, 300));
                  setCharCount(e.target.value.length);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ex: Recebi 80 de sub..."
                rows={1}
                className="w-full rounded-xl border border-white/10 bg-background px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/20 transition-colors resize-none focus:ring-0 focus:shadow-none"
                style={{ minHeight: "42px", maxHeight: "120px" }}
              />
              <div className="text-right mt-0.5">
                <span className={`text-[10px] ${charCount > 260 ? "text-yellow" : "text-white/30"}`}>
                  {charCount}/300
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-neon text-background transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 self-start mt-1"
              aria-label="Enviar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
        className="fixed bottom-6 right-6 z-[95] flex items-center justify-center w-14 h-14 rounded-full
          bg-neon text-background shadow-[0_0_20px_rgba(93,255,155,0.4)]
          transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(93,255,155,0.6)]
          active:scale-95"
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

        {/* Badge de notificação */}
        {!isOpen && messages.filter((m) => m.role === "assistant" && m.id !== messages[0]?.id).length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-neon" />
          </span>
        )}
      </button>
    </>
  );
}
