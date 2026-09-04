"use client";

import { useEffect, useState } from "react";
import { migrateToSecureStorage } from "@/lib/storage";
import { isCryptoAvailable } from "@/lib/crypto";

interface SecurityProviderProps {
  children: React.ReactNode;
}

export default function SecurityProvider({ children }: SecurityProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [securityStatus, setSecurityStatus] = useState<{
    cryptoAvailable: boolean;
    dataMigrated: boolean;
  }>({
    cryptoAvailable: false,
    dataMigrated: false,
  });

  useEffect(() => {
    async function initializeSecurity() {
      // Verifica disponibilidade de criptografia
      const cryptoOk = isCryptoAvailable();

      setSecurityStatus((prev) => ({
        ...prev,
        cryptoAvailable: cryptoOk,
      }));

      if (cryptoOk) {
        // Migra dados existentes para formato criptografado
        try {
          await migrateToSecureStorage();
          setSecurityStatus((prev) => ({
            ...prev,
            dataMigrated: true,
          }));
        } catch (error) {
          console.error("Erro na migração de dados:", error);
        }
      }

      setIsReady(true);
    }

    initializeSecurity();
  }, []);

  // Enquanto não está pronto, mostra loading mínimo (transparente)
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon/30 border-t-neon rounded-full animate-spin mx-auto mb-2" />
          <p className="text-muted text-xs">Inicializando segurança...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
