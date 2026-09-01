// ============================================
// ServiceWorkerProvider — Registra o Service Worker
// Detecta updates e notifica o usuário
// ============================================

"use client";

import { useEffect, useState } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

export default function ServiceWorkerProvider({
  children,
}: ServiceWorkerProviderProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    async function registerSW() {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        setRegistration(reg);

        // Detecta quando um novo SW está pronto
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Novo SW instalado mas ainda não ativado
              setUpdateAvailable(true);
            }
          });
        });
      } catch (err) {
        console.warn("[SW] Falha ao registrar service worker:", err);
      }
    }

    registerSW();

    // Escuta mensagens do SW (ex: SKIP_WAITING)
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "REFRESH_PAGE") {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, []);

  const applyUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage("SKIP_WAITING");
      setUpdateAvailable(false);
    }
  };

  return (
    <>
      {children}
      {updateAvailable && (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "#111",
            border: "1px solid #5dff9b",
            borderRadius: "0.75rem",
            padding: "0.875rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            boxShadow: "0 0 20px rgba(93,255,155,0.2)",
            maxWidth: "min(90vw, 400px)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
          role="alert"
        >
          <span style={{ fontSize: "1.25rem" }}>🔄</span>
          <div style={{ flex: 1 }}>
            <p
              style={{
                color: "#ffffff",
                fontWeight: 600,
                fontSize: "0.875rem",
                lineHeight: 1.4,
              }}
            >
              Atualização disponível
            </p>
            <p
              style={{
                color: "#888",
                fontSize: "0.75rem",
                marginTop: "0.125rem",
              }}
            >
              Nova versão do app pronta para instalar.
            </p>
          </div>
          <button
            onClick={applyUpdate}
            style={{
              background: "#5dff9b",
              color: "#0a0a0a",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontWeight: 700,
              fontSize: "0.8125rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Atualizar
          </button>
        </div>
      )}
    </>
  );
}
