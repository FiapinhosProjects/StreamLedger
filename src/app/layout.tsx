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
