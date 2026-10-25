import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { NvShell } from "@/components/nutriverse/NvShell";
import { nvFont } from "@/components/nutriverse/font";
import "./nutriverse.css";

export const metadata: Metadata = {
  title: "NutriVerse",
  description: "Registra lo que comes hablando y mantén tu objetivo.",
  manifest: "/nutriverse.webmanifest",
  icons: {
    icon: [{ url: "/nutriverse/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/nutriverse/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "NutriVerse" },
};

export const viewport: Viewport = {
  themeColor: "#eef1f3",
  colorScheme: "light",
};

/** NutriVerse: app aparte de Fuerza (misma sesión), clara y de vidrio. */
export default function NutriVerseLayout({ children }: { children: ReactNode }) {
  return (
    <div className={nvFont.variable}>
      <NvShell>{children}</NvShell>
    </div>
  );
}
