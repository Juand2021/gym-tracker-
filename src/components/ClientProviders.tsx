"use client";

import type { ReactNode } from "react";
import { RestTimerProvider } from "@/context/RestTimerContext";
import { RestTimerModal } from "@/components/RestTimerModal";
import { RestTimerFloatingWidget } from "@/components/RestTimerButton";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <RestTimerProvider>
      {children}
      <RestTimerModal />
      <RestTimerFloatingWidget />
    </RestTimerProvider>
  );
}
