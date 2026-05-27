import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Headers de segurança do site
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Política de segurança de conteúdo (CSP)
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "media-src 'self'",
              "connect-src 'self'",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            // Previne que o navegador tente adivinhar o tipo do arquivo
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            // Impede que o site seja carregado dentro de um iframe
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            // Controla quais informações são enviadas no header Referer
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
