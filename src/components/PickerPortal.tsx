"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  children: ReactNode;
};

/**
 * Monta el modal en document.body para escapar stacking contexts
 * (p. ej. .card con backdrop-filter) que en iOS tapan el overlay.
 */
export function PickerPortal({ open, children }: Props) {
  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const { body, documentElement } = document;
    const prevBody = body.style.cssText;
    const prevHtmlOverflow = documentElement.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.cssText = prevBody;
      documentElement.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
