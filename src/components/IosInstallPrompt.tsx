"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DISMISS_KEY = "fuerza_ios_pwa_dismissed_v1";

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIosSafari, setIsIosSafari] = useState(false);

  useEffect(() => {
    // Verificar si estamos en el cliente
    if (typeof window === "undefined") return;

    // Detectar si ya está en modo Standalone (PWA ya instalada y abierta desde inicio)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) {
      return;
    }

    // Detectar iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari =
      /safari/.test(ua) && !/crios|fxios|opios|edgios|mercury/.test(ua);

    setIsIosSafari(isIos && isSafari);

    // Verificar si el usuario ya lo cerró anteriormente en esta sesión
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (!dismissed && (isIos || process.env.NODE_ENV === "development")) {
      // Mostrar con un pequeño retraso agradable
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleDismiss() {
    setShowPrompt(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  if (!showPrompt) return null;

  return (
    <div
      role="dialog"
      aria-label="Instalar aplicación en iPhone"
      className="fixed inset-x-0 bottom-0 z-50 p-3.5 pb-[calc(1rem+env(safe-area-inset-bottom))] transition-all animate-in fade-in slide-in-from-bottom-6 duration-300"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-white/15 bg-[#121212]/92 p-4 text-[var(--ink)] shadow-2xl shadow-black/80 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/20 shadow-md shadow-orange-500/20">
              <Image
                src="/apple-touch-icon.png"
                alt="Fuerza App Icon"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                Acceso Rápido
              </p>
              <h3 className="font-[family-name:var(--font-display)] text-xl leading-tight tracking-[0.03em]">
                Instalar Fuerza en tu iPhone
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-[var(--muted)] hover:bg-white/20 hover:text-white active:scale-95 transition-all"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        </div>

        <p className="mt-2.5 text-xs text-[var(--muted)] leading-relaxed">
          Agrega Fuerza a tu pantalla de inicio para usarla a{" "}
          <strong className="text-white">pantalla completa</strong> sin barras
          de navegación ni URL de Safari.
        </p>

        <div className="mt-3 space-y-2 rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
              1
            </span>
            <p className="text-[var(--ink)]">
              Toca el botón{" "}
              <strong className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Compartir
                <svg
                  className="inline h-3.5 w-3.5 text-sky-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              </strong>{" "}
              en la barra inferior de Safari.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-white">
              2
            </span>
            <p className="text-[var(--ink)]">
              Selecciona{" "}
              <strong className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                Agregar a inicio
                <svg
                  className="inline h-3.5 w-3.5 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={handleDismiss}
            className="btn btn-primary min-h-[2.2rem] w-full text-xs font-bold tracking-[0.08em] shadow-md shadow-[var(--accent)]/30"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
