"use client";

import { useId } from "react";

/** Hojas de vidrio de NutriVerse (provisional hasta logo-hojas-solo.png de Juan). */
export function NvLeaves({ size = 30, animated = false }: { size?: number; animated?: boolean }) {
  const id = `nvl${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={`nv-leaves ${animated ? "is-animated" : ""}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}g`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#c8f7d9" />
          <stop offset="0.45" stopColor="#5bd68a" />
          <stop offset="1" stopColor="#1e7a46" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#dfe5ea" />
          <stop offset="1" stopColor="#9fa8b2" />
        </linearGradient>
      </defs>
      {/* Hoja plateada detrás */}
      <path className="nv-leaf-b" d="M23 44C11 42 5 32 8.5 20 18 21 25 30 23 44z" fill={`url(#${id}s)`} stroke="rgba(90,100,112,.45)" strokeWidth="0.8" />
      <path d="M22 42c-3-6.6-7.6-12.4-12.4-19" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      {/* Hoja verde principal */}
      <path className="nv-leaf-a" d="M24 44C21 28 27 12 42 5c3.6 17-4 33-18 39z" fill={`url(#${id}g)`} stroke="rgba(20,90,50,.55)" strokeWidth="0.8" />
      <path d="M25 42c3.4-11.4 8.8-23 15.4-34" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      <path d="M29.6 29.4l-4.4-2.4M32.8 22l-4-3M36.2 15.4l-3-3.4" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
      <path d="M27 20c2.4-6 6.4-10.6 11.6-13.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <circle cx="37" cy="10.5" r="1.2" fill="#fff" />
    </svg>
  );
}

/** Logo completo: hojas + "NutriVerse" con "Verse" en verde. */
export function NvLogo({ size = 28 }: { size?: number }) {
  return (
    <span className="nv-logo">
      <span className="nv-logo-tile">
        <NvLeaves size={size} />
      </span>
      <span className="nv-logo-word">
        Nutri<span>Verse</span>
      </span>
    </span>
  );
}
