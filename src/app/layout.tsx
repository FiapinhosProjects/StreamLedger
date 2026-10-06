import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import SecurityProvider from "@/components/providers/SecurityProvider";
import ServiceWorkerProvider from "@/components/providers/ServiceWorkerProvider";
import InstallPromptProvider from "@/components/providers/InstallPromptProvider";
import AccessibilityProvider from "@/components/providers/AccessibilityProvider";
import AccessibilityMenu from "@/components/a11y/AccessibilityMenu";
import {
  STORAGE_KEY as A11Y_STORAGE_KEY,
  FONT_SCALE_MULTIPLIER,
  THEMES as A11Y_THEMES,
  VERSION as A11Y_VERSION,
} from "@/lib/accessibility-storage";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "StreamLedger",
  description: "Dashboard financeiro para streamers",
  manifest: "/manifest.json",
  icons: { icon: "/assets/favicon.png", apple: "/assets/favicon.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StreamLedger",
  },
  openGraph: {
    title: "StreamLedger",
    description: "Dashboard financeiro para streamers",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d0d0d",
};

// Script anti-FOUC: lê o localStorage SÍNCRONO antes do React montar e aplica
// o tema + font-scale ao <html>. Sem isso, o usuário veria o tema neon padrão
// por ~200ms antes do swap (flash). Serializado via JSON.stringify nos valores
// da constants para garantir a mesma chave/validação do accessibility-storage.ts.
const a11yAntiFoilScript = `
(function(){
  try {
    var KEY = ${JSON.stringify(A11Y_STORAGE_KEY)};
    var VERSION = ${JSON.stringify(A11Y_VERSION)};
    var THEMES = ${JSON.stringify(A11Y_THEMES)};
    var FONT_MULT = ${JSON.stringify(FONT_SCALE_MULTIPLIER)};
    var DEFAULT_THEME = "neon";
    var DEFAULT_SCALE = "m";
    var raw = localStorage.getItem(KEY);
    var theme = DEFAULT_THEME;
    var scale = DEFAULT_SCALE;
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && p.version === VERSION && typeof p.theme === "string" && THEMES.indexOf(p.theme) >= 0) theme = p.theme;
        if (p && typeof p.fontScale === "string" && FONT_MULT[p.fontScale] !== undefined) scale = p.fontScale;
      } catch (e) {}
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--sl-app-font-scale", String(FONT_MULT[scale]));
  } catch (e) {}
})();
`.trim();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: a11yAntiFoilScript }}
        />
      </head>
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <ServiceWorkerProvider>
          <SecurityProvider>
            <InstallPromptProvider>
              <AccessibilityProvider>
                {children}
                <AccessibilityMenu />
              </AccessibilityProvider>
            </InstallPromptProvider>
          </SecurityProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
