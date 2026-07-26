// ============================================
// login/page.tsx - Página de verificação de idade
// Usa AgeGate para fluxo completo: CPF → Yoti → Dashboard
// Conforme Lei 15.211/2025
// ============================================

"use client";

import AgeGate from "@/components/auth/AgeGate";

export default function LoginPage() {
  return (
    <AgeGate>
      <div />
    </AgeGate>
  );
}
