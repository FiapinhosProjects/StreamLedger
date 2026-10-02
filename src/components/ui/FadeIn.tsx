"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Props que o FadeIn recebe
// children: conteúdo que será animado
// className: classes CSS extras (opcional)
// delay: tempo de espera antes de animar, em segundos (opcional)
export default function FadeIn({ children, className = "", delay = 0 }: FadeInProps) {
  // Referência ao elemento HTML para observar
  const ref = useRef<HTMLDivElement>(null);

  // Controla se o elemento já apareceu na tela
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Observa quando o elemento aparece na tela (scroll)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Marca como montado no próximo tick
    const mountTimer = setTimeout(() => setMounted(true), 0);

    const timeout = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(el);
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(el);

      return () => observer.disconnect();
    }, 50);

    return () => {
      clearTimeout(mountTimer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        mounted
          ? {
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s ease-out ${delay}s`,
          }
          : {}
      }
    >
      {children}
    </div>
  );
}
