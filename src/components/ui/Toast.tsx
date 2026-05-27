// ============================================
// Toast.tsx - Notificação temporária na tela
// Aparece no canto inferior direito e some após 3 segundos
// ============================================

"use client";

import { useEffect, useState } from "react";

// Props (propriedades) que o Toast recebe
interface ToastProps {
  message: string;           // Texto que aparece no toast
  visible: boolean;          // Se deve mostrar ou não
  onClose: () => void;       // Função chamada quando o toast fecha
  variant?: "success" | "error"; // Cor: verde (sucesso) ou vermelho (erro)
}

export default function Toast({ message, visible, onClose, variant = "success" }: ToastProps) {
  // Controla a animação de entrada/saída
  const [show, setShow] = useState(false);

  // Quando o toast fica visível, inicia o timer para fechar
  useEffect(() => {
    if (visible) {
      // Mostra o toast com animação
      setShow(true);

      // Depois de 3 segundos, esconde com animação
      const timer = setTimeout(() => {
        setShow(false);
        // Espera a animação de saída (300ms) antes de chamar onClose
        setTimeout(onClose, 300);
      }, 3000);

      // Limpa o timer se o componente desmontar
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  // Se não está visível e não está animando, não renderiza nada
  if (!visible && !show) return null;

  // Define se é a variante de erro (vermelho)
  const isError = variant === "error";

  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2 rounded-xl border bg-card px-4 py-3 transition-all duration-300 ${
        isError
          ? "border-red/30 shadow-[0_0_20px_rgba(255,68,102,0.15)]"
          : "border-neon/30 shadow-[0_0_20px_rgba(93,255,155,0.15)]"
      } ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Ícone do toast */}
      <span className={`text-lg ${isError ? "text-red" : "text-neon"}`}>
        {isError ? "✖" : "✓"}
      </span>

      {/* Mensagem do toast */}
      <span className="text-sm font-medium text-white">{message}</span>
    </div>
  );
}
