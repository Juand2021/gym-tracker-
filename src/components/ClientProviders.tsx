"use client";

import type { ReactNode } from "react";
import { AppSettingsProvider } from "@/context/AppSettingsContext";
import { RestTimerProvider } from "@/context/RestTimerContext";
import { RestTimerModal } from "@/components/RestTimerModal";
import { RestTimerFloatingWidget } from "@/components/RestTimerButton";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AppSettingsProvider>
      <RestTimerProvider>
        {children}
        <RestTimerModal />
        <RestTimerFloatingWidget />
      </RestTimerProvider>
    </AppSettingsProvider>
  );
}
