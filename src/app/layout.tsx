import type { Metadata, Viewport } from "next";
import { Barlow, Bebas_Neue } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppNav } from "@/components/AppNav";
import { ClientProviders } from "@/components/ClientProviders";
import "./globals.css";

const body = Barlow({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Fuerza — Gym Tracker",
  description:
    "Registra entrenos, peso corporal y obtén recomendaciones con IA.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fuerza",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#070707",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${body.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ClientProviders>
          <AppNav />
          <main className="mx-auto w-full min-w-0 max-w-lg flex-1 overflow-x-clip px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-4">
            {children}
          </main>
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
