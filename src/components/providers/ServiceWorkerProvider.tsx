"use client";

import { useEffect } from "react";

interface ServiceWorkerProviderProps {
  children: React.ReactNode;
}

/**
 * Registra o service worker do app (PWA shell + offline + install prompt).
 *
 * O banner de "atualização disponível" foi removido: o app não roda deploys
 * com frequência que justifique um prompt pro usuário, e o modal atrapalha
 * mais do que ajudar. O SW ainda é registrado para preservar o comportamento
 * de PWA (instalável, manifest, cache de assets estáticos).
 */
export default function ServiceWorkerProvider({
  children,
}: ServiceWorkerProviderProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[SW] Falha ao registrar service worker:", err);
      });
  }, []);

  return <>{children}</>;
}