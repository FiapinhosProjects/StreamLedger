import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Link de pular navegação para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black focus:rounded-md"
      >
        Pular para o conteúdo principal
      </a>

      {/* Menu lateral */}
      <Sidebar />

      {/* Área principal do conteúdo */}
      <main
        id="main-content"
        className="flex-1 lg:ml-64 pt-16 lg:pt-0 overflow-y-auto min-h-screen p-6 lg:p-8"
      >
        {children}
      </main>
    </div>
  );
}
import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import SecurityProvider from "@/components/providers/SecurityProvider";
import ServiceWorkerProvider from "@/components/providers/ServiceWorkerProvider";
import InstallPromptProvider from "@/components/providers/InstallPromptProvider";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
      <ServiceWorkerProvider>
        <SecurityProvider>
          <InstallPromptProvider>{children}</InstallPromptProvider>
        </SecurityProvider>
      </ServiceWorkerProvider>
    </body>
    </html>
  );
}
