"use client";

import { useEffect, useState, useCallback } from "react";

interface InstallPromptProviderProps {
  children: React.ReactNode;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const SESSION_KEY = "sl_install_prompt_dismissed";

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return (
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) && window.matchMedia("(hover: none)").matches
  );
}

function canPromptInstall(): boolean {
  // Navegadores que emitem beforeinstallprompt
  return (
    typeof window !== "undefined" &&
    "beforeinstallprompt" in window
  );
}

export default function InstallPromptProvider({
  children,
}: InstallPromptProviderProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mobile = isMobile();
    const promptable = canPromptInstall();

    setIsMobileDevice(mobile);

    if (!mobile || !promptable) return;

    // Se já foi dispensado nesta sessão, não mostrar
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;

    // Escuta o evento nativo do Chrome/Edge
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowModal(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: se depois de 3s o beforeinstallprompt não disparou,
    // mas estamos em mobile e SW já está registrado, mostra mesmo assim.
    // O beforeinstallprompt não dispara no Safari nem em dev localhost.
    const swReady = navigator.serviceWorker?.controller?.state !== "installing";

    const fallbackTimer = setTimeout(() => {
      // Mostra se ainda não mostrou (evento pode não ter disparado em dev)
      if (!showModal && !sessionStorage.getItem(SESSION_KEY)) {
        setShowModal(true);
      }
    }, 3000);

    setReady(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Feedback imediato quando o SW está ativo (app carregou completamente)
  useEffect(() => {
    if (!isMobileDevice) return;

    const sw = navigator.serviceWorker;
    if (!sw) return;

    const handler = () => {
      // SW activated — se ainda não mostramos nada, mostra agora
      if (!showModal && !sessionStorage.getItem(SESSION_KEY)) {
        setShowModal(true);
      }
    };

    sw.addEventListener("controllerchange", handler);
    return () => sw.removeEventListener("controllerchange", handler);
  }, [isMobileDevice]);

  // Se a flag de dismissed mudou, não mostra mais
  useEffect(() => {
    if (showModal) return;
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;
  }, [showModal]);

  const handleInstall = useCallback(async () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setShowModal(false);

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setShowModal(false);
  }, []);

  if (!isMobileDevice || !showModal) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <InstallModal
        onInstall={handleInstall}
        onDismiss={handleDismiss}
        hasNativePrompt={!!deferredPrompt}
      />
    </>
  );
}


interface InstallModalProps {
  onInstall: () => void;
  onDismiss: () => void;
  hasNativePrompt: boolean;
}

function InstallModal({ onInstall, onDismiss, hasNativePrompt }: InstallModalProps) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalar StreamLedger"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "1.5rem",
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(6px)",
        fontFamily: "var(--font-montserrat), system-ui, sans-serif",
        animation: "slFadeIn 0.25s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <style>{`
        @keyframes slFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .sl-modal-btn-primary:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .sl-modal-btn-primary:active {
          transform: scale(0.97);
        }
        .sl-modal-btn-ghost:hover {
          background: rgba(255,255,255,0.06);
        }
        .sl-modal-btn-ghost:active {
          transform: scale(0.97);
        }
      `}</style>

      <div
        style={{
          background: "#141414",
          border: "1px solid rgba(93,255,155,0.25)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          width: "100%",
          maxWidth: "360px",
          boxShadow:
            "0 0 60px rgba(93,255,155,0.1), 0 25px 80px rgba(0,0,0,0.7)",
          animation: "slSlideUp 0.32s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.875rem",
            marginBottom: "1.125rem",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(93,255,155,0.15), rgba(93,255,155,0.05))",
              border: "1px solid rgba(93,255,155,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            <img
              src="/assets/favicon.png"
              alt=""
              width={36}
              height={36}
              style={{ borderRadius: "10px", display: "block" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              style={{
                color: "#ffffff",
                fontSize: "1rem",
                fontWeight: 700,
                margin: 0,
                marginBottom: "0.2rem",
                lineHeight: 1.3,
              }}
            >
              Instalar StreamLedger
            </h2>
            <p
              style={{
                color: "#777",
                fontSize: "0.8rem",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Acesso rápido e funcionamento offline — direto da sua tela inicial.
            </p>
          </div>

          <button
            onClick={onDismiss}
            aria-label="Fechar"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#444",
              padding: "0.25rem",
              flexShrink: 0,
              fontSize: "1.1rem",
              lineHeight: 1,
              borderRadius: "6px",
              transition: "color 0.15s, background 0.15s",
            }}
          >
            ✕
          </button>
        </div>

        {/* Features */}
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: "0 0 1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.45rem",
          }}
        >
          {[
            { icon: "⚡", label: "Funciona 100% offline" },
            { icon: "🚀", label: "Mais rápido que o navegador" },
            { icon: "📱", label: "Ícone na tela inicial" },
          ].map(({ icon, label }) => (
            <li
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                color: "#999",
                fontSize: "0.8125rem",
              }}
            >
              <span style={{ fontSize: "0.875rem", flexShrink: 0 }}>{icon}</span>
              {label}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: "0.625rem",
          }}
        >
          <button
            onClick={onDismiss}
            className="sl-modal-btn-ghost"
            style={{
              flex: 1,
              padding: "0.7rem 0.75rem",
              borderRadius: "0.7rem",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "transparent",
              color: "#666",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            Mais tarde
          </button>
          <button
            onClick={onInstall}
            className="sl-modal-btn-primary"
            style={{
              flex: 2,
              padding: "0.7rem 0.75rem",
              borderRadius: "0.7rem",
              border: "none",
              background: "linear-gradient(135deg, #5dff9b, #3ddc84)",
              color: "#0a0a0a",
              fontSize: "0.8125rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.18s",
              boxShadow: "0 0 24px rgba(93,255,155,0.25)",
            }}
          >
            {hasNativePrompt
              ? "Instalar agora"
              : isIOS
              ? "Ver instruções"
              : "Instalar"}
          </button>
        </div>

        {/* Dica contextual */}
        <p
          style={{
            textAlign: "center",
            color: "#444",
            fontSize: "0.7rem",
            margin: "0.75rem 0 0",
            lineHeight: 1.5,
          }}
        >
          {isIOS
            ? "Toque em Compartilhar → Adicionar à Tela Inicial"
            : hasNativePrompt
            ? "Toque em Instalar na prompt do navegador"
            : "Ou abra o menu do navegador e escolha \"Instalar app\""}
        </p>
      </div>
    </div>
  );
}
