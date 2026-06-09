// ============================================
// FadeIn.tsx - Componente de animação de entrada
// Faz o conteúdo aparecer suavemente de baixo pra cima
// quando o elemento fica visível na tela
// ============================================

"use client";

import { useEffect, useRef, useState } from "react";

// Props que o FadeIn recebe
// children: conteúdo que será animado
// className: classes CSS extras (opcional)
// delay: tempo de espera antes de animar, em segundos (opcional)
export default function FadeIn({ children, className = "", delay = 0 }: any) {
  // Referência ao elemento HTML para observar
  const ref = useRef<HTMLDivElement>(null);

  // Controla se o elemento já apareceu na tela
  const [visible, setVisible] = useState(true);

  // Observa quando o elemento aparece na tela (scroll)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // IntersectionObserver detecta quando o elemento entra na viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          // Para de observar depois que já apareceu
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 } // Dispara quando 10% do elemento está visível
    );

    observer.observe(el);

    // Limpa o observer quando o componente desmonta
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}
