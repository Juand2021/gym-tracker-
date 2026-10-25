"use client";

import { useId, type ReactNode } from "react";

/**
 * Íconos de NutriVerse (docs/nutricion/04-frontend.md §6): objetos con volumen, en capas.
 * Cada ícono tiene cuerpo con degradado (plata o verde), contorno, detalles y brillo especular,
 * todos con la luz desde arriba a la izquierda. Se leen a 20–28 px.
 */

export type IconName =
  | "home" | "stats" | "plan" | "profile" | "plus" | "water" | "flame" | "leaf" | "bell"
  | "chevronL" | "chevronR" | "chevronD" | "close" | "trash" | "copy" | "edit" | "check" | "send"
  | "sparkle" | "trophy" | "streak" | "bowl" | "target" | "scale" | "heart" | "settings" | "history"
  | "logout" | "protein" | "carbs" | "fat" | "chat" | "info" | "ruler" | "calendar" | "party" | "shield" | "apps";

type Tone = "silver" | "green" | "white" | "ink";

/** g = ids de degradados: b cuerpo, s brillo, d detalle, k contorno. */
type G = { b: string; s: string; d: string; k: string; a: string };

const ICONS: Record<IconName, (g: G) => ReactNode> = {
  home: (g) => (
    <>
      {/* Mini velocímetro: el inicio de NutriVerse */}
      <path d="M4 22a12 12 0 0 1 24 0v1.5a2.5 2.5 0 0 1-2.5 2.5h-19A2.5 2.5 0 0 1 4 23.5z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M7.5 21.5a8.5 8.5 0 0 1 17 0" fill="none" stroke={g.d} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="2.4 2.2" />
      <path d="M16 22l5.2-6.4" stroke={g.a} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="16" cy="22" r="2.4" fill={g.a} stroke="#fff" strokeWidth="0.9" />
      <path d="M7 14.5a11 11 0 0 1 8-4.4" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  stats: (g) => (
    <>
      <rect x="4" y="15" width="6" height="12" rx="2" fill={g.b} stroke={g.k} strokeWidth="1.1" />
      <rect x="13" y="9" width="6" height="18" rx="2" fill={g.a} stroke={g.k} strokeWidth="1.1" />
      <rect x="22" y="12" width="6" height="15" rx="2" fill={g.b} stroke={g.k} strokeWidth="1.1" />
      <path d="M5.5 17v4M14.5 11v5M23.5 14v4" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 7.5l7 2.5 6-5 10 3" fill="none" stroke={g.d} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="17" cy="5" r="1.6" fill="#fff" stroke={g.d} strokeWidth="1" />
    </>
  ),
  plan: (g) => (
    <>
      <rect x="5" y="4" width="22" height="24" rx="4" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <rect x="11" y="2.5" width="10" height="4" rx="2" fill={g.a} stroke={g.k} strokeWidth="0.9" />
      <path d="M9.5 13l2 2 3.5-4M9.5 20.5l2 2 3.5-4" fill="none" stroke={g.a} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 13h5M18 20.5h5" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7.5 7v6" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  profile: (g) => (
    <>
      <circle cx="16" cy="11" r="6" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M5 27.5c0-5.8 4.9-9.5 11-9.5s11 3.7 11 9.5z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M12.3 8.4a4 4 0 0 1 3.4-1.7" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.5 25a7.5 7.5 0 0 1 4-4.4" fill="none" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M19 22.5c1.6-.9 3.6-.4 4.4 1.2-1.2 1.2-3.3 1.4-4.4-1.2z" fill={g.a} />
    </>
  ),
  plus: (g) => (
    <>
      <path d="M13.5 5.5a2.5 2.5 0 0 1 5 0v8h8a2.5 2.5 0 0 1 0 5h-8v8a2.5 2.5 0 0 1-5 0v-8h-8a2.5 2.5 0 0 1 0-5h8z" fill={g.b} stroke={g.k} strokeWidth="1" />
      <path d="M15 6v7M6 15h6" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  water: (g) => (
    <>
      <path d="M16 3.5c4.8 6 9 10.4 9 15.5a9 9 0 0 1-18 0c0-5.1 4.2-9.5 9-15.5z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M8.5 19.5c2.5-1.6 4.8-1.6 7.5 0s5 1.6 7.5 0v.5a7.5 7.5 0 0 1-15 0z" fill={g.a} opacity="0.9" />
      <path d="M11 13c1-2 2.2-3.6 3.4-5.2" fill="none" stroke={g.s} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="11.5" cy="20.5" r="1.1" fill="#fff" opacity="0.9" />
    </>
  ),
  flame: (g) => (
    <>
      <path d="M16 3c1.2 4.2 7.8 7.4 7.8 15a7.8 7.8 0 0 1-15.6 0c0-3.6 1.8-5.8 3.5-7.4.2 2.4 1.2 3.7 2.6 4.2C14 11.2 14.2 7 16 3z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M16 15c2.6 2.4 4 4.2 4 6.4a4 4 0 0 1-8 0c0-2.1 1.6-3.7 4-6.4z" fill={g.a} />
      <path d="M11.5 16.5c-.6 1-.9 2.1-.9 3.3" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  leaf: (g) => (
    <>
      <path d="M26.5 4.5C14 4 5.5 10.2 5.5 19.5c0 2.6.8 4.6 2 6 9.6.4 17.5-5.6 19-21z" fill={g.a} stroke={g.k} strokeWidth="1.1" />
      <path d="M7.5 25.5C12 19.5 16.5 14 23 8.5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
      <path d="M12.6 19.4l-3.2-1.2M16 15.6l-2.4-3M19.2 12.4l-.6-3.4M14.3 17.4l4 .7" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M9 14.5c1.6-3.4 5-5.8 9.4-6.8" fill="none" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  bell: (g) => (
    <>
      <path d="M16 4a7.5 7.5 0 0 1 7.5 7.5v5.4l2.4 3.6a1.5 1.5 0 0 1-1.2 2.3H7.3a1.5 1.5 0 0 1-1.2-2.3l2.4-3.6v-5.4A7.5 7.5 0 0 1 16 4z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M12.6 25.5a3.5 3.5 0 0 0 6.8 0z" fill={g.a} />
      <path d="M11.5 9.5a5 5 0 0 1 3-2.7" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  chevronL: (g) => <path d="M19.5 7l-8 9 8 9" fill="none" stroke={g.d} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  chevronR: (g) => <path d="M12.5 7l8 9-8 9" fill="none" stroke={g.d} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  chevronD: (g) => <path d="M8 12.5l8 8 8-8" fill="none" stroke={g.d} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />,
  close: (g) => (
    <>
      <circle cx="16" cy="16" r="12" fill={g.b} stroke={g.k} strokeWidth="1.1" />
      <path d="M11.5 11.5l9 9M20.5 11.5l-9 9" stroke={g.d} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8 12a9 9 0 0 1 5-4.6" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  trash: (g) => (
    <>
      <path d="M7.5 9.5h17l-1.4 16a2.5 2.5 0 0 1-2.5 2.3h-9.2a2.5 2.5 0 0 1-2.5-2.3z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <rect x="5" y="6" width="22" height="4" rx="2" fill={g.a} stroke={g.k} strokeWidth="1" />
      <path d="M13 3.8h6" stroke={g.k} strokeWidth="2" strokeLinecap="round" />
      <path d="M13 14v9M16 14v9M19 14v9" stroke={g.d} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12.5l.8 10" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  copy: (g) => (
    <>
      <rect x="10" y="10" width="17" height="17" rx="4" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M21.5 6.5A3.5 3.5 0 0 0 18 4H8a4 4 0 0 0-4 4v10a3.5 3.5 0 0 0 2.5 3.4" fill="none" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18.5 14.5v8M14.5 18.5h8" stroke={g.a} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12.5 13v4" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  edit: (g) => (
    <>
      <path d="M20.5 5.5l6 6L13 25l-7.5 1.5L7 19z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M18 8l6 6" stroke={g.d} strokeWidth="1.6" />
      <path d="M20.5 5.5l2-2a2.2 2.2 0 0 1 3.1 0l2.9 2.9a2.2 2.2 0 0 1 0 3.1l-2 2z" fill={g.a} stroke={g.k} strokeWidth="1" />
      <path d="M7 19l6 6-7.5 1.5z" fill={g.d} />
      <path d="M10.5 18.5l8-8" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  check: (g) => (
    <>
      <circle cx="16" cy="16" r="12" fill={g.a} stroke={g.k} strokeWidth="1.1" />
      <path d="M10 16.5l4 4 8-9" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.6 12.5a9 9 0 0 1 5-5" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  send: (g) => (
    <>
      <path d="M4.5 14.5L26.5 5l-6.8 22-5-8.2z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M14.7 18.8L26.5 5" stroke={g.d} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 14.2l12-5" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  sparkle: (g) => (
    <>
      <path d="M14 3l2.4 7.4L24 13l-7.6 2.6L14 23l-2.4-7.4L4 13l7.6-2.6z" fill={g.a} stroke={g.k} strokeWidth="1" strokeLinejoin="round" />
      <path d="M24 18l1.2 3.3 3.3 1.2-3.3 1.2L24 27l-1.2-3.3-3.3-1.2 3.3-1.2z" fill={g.b} stroke={g.k} strokeWidth="0.9" strokeLinejoin="round" />
      <path d="M11 11.5l2-.7" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  trophy: (g) => (
    <>
      <path d="M9 4h14v7.5a7 7 0 0 1-14 0z" fill={g.a} stroke={g.k} strokeWidth="1.2" />
      <path d="M9 6.5H5.5a4 4 0 0 0 4.2 6.2M23 6.5h3.5a4 4 0 0 1-4.2 6.2" fill="none" stroke={g.d} strokeWidth="1.6" />
      <path d="M14 18h4v4h-4z" fill={g.b} stroke={g.k} strokeWidth="1" />
      <rect x="9.5" y="22" width="13" height="5.5" rx="2" fill={g.b} stroke={g.k} strokeWidth="1.1" />
      <path d="M12 6.5v4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.85" />
    </>
  ),
  streak: (g) => (
    <>
      <path d="M16 2.5c1.2 4.2 8.5 7.6 8.5 16a8.5 8.5 0 0 1-17 0c0-3.9 2-6.3 3.8-8 .2 2.6 1.3 4 2.8 4.6C13.8 11 14 6.5 16 2.5z" fill={g.a} stroke={g.k} strokeWidth="1.2" />
      <path d="M16 15.5c2.8 2.6 4.3 4.6 4.3 7a4.3 4.3 0 0 1-8.6 0c0-2.3 1.7-4 4.3-7z" fill="#fff" opacity="0.85" />
      <path d="M11 17c-.7 1.1-1 2.4-1 3.7" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  bowl: (g) => (
    <>
      <path d="M3.5 15h25a12.5 12.5 0 0 1-25 0z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M8 15c.5-3.5 3-6 6-6.5M15 15c0-4 2.4-7.4 6-8.4M21 15c.6-2.6 2.4-4.4 4.6-5" fill="none" stroke={g.a} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="11.5" cy="12" r="2" fill={g.a} />
      <path d="M7 18.5a9 9 0 0 0 4.5 5" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M11 28h10" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  target: (g) => (
    <>
      <circle cx="16" cy="16" r="12.5" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <circle cx="16" cy="16" r="8" fill="none" stroke={g.d} strokeWidth="1.6" />
      <circle cx="16" cy="16" r="3.6" fill={g.a} stroke={g.k} strokeWidth="0.9" />
      <path d="M16 16l9-9M22 7h3v3" fill="none" stroke={g.k} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12a9.5 9.5 0 0 1 4-4.3" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  scale: (g) => (
    <>
      <rect x="4" y="5" width="24" height="23" rx="6" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M9.5 14a6.5 6.5 0 0 1 13 0z" fill="#fff" stroke={g.d} strokeWidth="1.2" />
      <path d="M16 14l2.4-3.6" stroke={g.a} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M7 9a4 4 0 0 1 3-2" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M10 23h12" stroke={g.d} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  heart: (g) => (
    <>
      <path d="M16 27S4 19.6 4 11.6A6.6 6.6 0 0 1 16 8a6.6 6.6 0 0 1 12 3.6C28 19.6 16 27 16 27z" fill={g.a} stroke={g.k} strokeWidth="1.2" />
      <path d="M6 15h5l2-3.5 3 7 2.2-4H26" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.2 10a4 4 0 0 1 3.3-2.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  settings: (g) => (
    <>
      <path d="M13.6 3.5h4.8l.8 3.4 2.3 1 3-1.8 3.4 3.4-1.8 3 1 2.3 3.4.8v4.8l-3.4.8-1 2.3 1.8 3-3.4 3.4-3-1.8-2.3 1-.8 3.4h-4.8l-.8-3.4-2.3-1-3 1.8-3.4-3.4 1.8-3-1-2.3-3.4-.8v-4.8l3.4-.8 1-2.3-1.8-3 3.4-3.4 3 1.8 2.3-1z" fill={g.b} stroke={g.k} strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="4.6" fill={g.a} stroke={g.k} strokeWidth="1" />
      <path d="M7.6 11a9.5 9.5 0 0 1 3.6-4" fill="none" stroke={g.s} strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  history: (g) => (
    <>
      <circle cx="17" cy="16" r="11" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M17 9.5V16l4.4 2.8" fill="none" stroke={g.a} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 13.5l3 3.5 3.4-3.2" fill="none" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 10.5a9 9 0 0 1 4-3.6" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  logout: (g) => (
    <>
      <path d="M17 4H8a3 3 0 0 0-3 3v18a3 3 0 0 0 3 3h9z" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M14 16h13M22.5 11l5 5-5 5" fill="none" stroke={g.a} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8v7" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  protein: (g) => (
    <>
      {/* Muslo de pollo */}
      <path d="M19.5 4.5c4.6 0 8 3.4 8 7.8 0 5.6-5.3 8.4-9.4 8.4l-4.8 4.8a2.8 2.8 0 1 1-3.9 3.6 2.8 2.8 0 1 1-3.4-4.1 2.8 2.8 0 1 1 3.8-3.6l4.7-4.7c0-4.4 2.2-12.2 9-12.2z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M16 12.5c.6-3 2.6-5 5.2-5.3" fill="none" stroke={g.s} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.5 17.5c2.6.4 6-1.2 7-4.2" fill="none" stroke={g.d} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  carbs: (g) => (
    <>
      {/* Espiga */}
      <path d="M16 29V9" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <path d={`M16 ${23 - i * 4.5}c-4.2 0-6-2.4-6.4-5.4 3.8 0 6.4 2 6.4 5.4z`} fill={g.b} stroke={g.k} strokeWidth="0.9" />
          <path d={`M16 ${23 - i * 4.5}c4.2 0 6-2.4 6.4-5.4-3.8 0-6.4 2-6.4 5.4z`} fill={g.a} stroke={g.k} strokeWidth="0.9" />
        </g>
      ))}
      <path d="M16 9c-1.8-1.6-1.8-4 0-6 1.8 2 1.8 4.4 0 6z" fill={g.a} stroke={g.k} strokeWidth="0.9" />
    </>
  ),
  fat: (g) => (
    <>
      {/* Aguacate */}
      <path d="M16 3.5c4.4 0 6.4 5.2 8 9.6 1.9 5.3.3 14.4-8 14.4s-9.9-9.1-8-14.4C9.6 8.7 11.6 3.5 16 3.5z" fill={g.a} stroke={g.k} strokeWidth="1.2" />
      <path d="M16 8c3.2 0 4.4 4.2 5.4 7.4 1.3 4.3-.6 9.1-5.4 9.1s-6.7-4.8-5.4-9.1C11.6 12.2 12.8 8 16 8z" fill={g.b} />
      <circle cx="16" cy="18.5" r="3.6" fill={g.d} stroke={g.k} strokeWidth="0.9" />
      <circle cx="14.8" cy="17.3" r="1" fill="#fff" opacity="0.8" />
      <path d="M11 10.5c.7-2 1.7-3.6 3-4.6" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  chat: (g) => (
    <>
      <path d="M16 4c6.9 0 12 4.4 12 10s-5.1 10-12 10c-1.4 0-2.7-.2-3.9-.5L6 26.5l1.6-5.2C5.3 19.5 4 17 4 14 4 8.4 9.1 4 16 4z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="11" cy="14" r="1.7" fill={g.a} />
      <circle cx="16" cy="14" r="1.7" fill={g.a} />
      <circle cx="21" cy="14" r="1.7" fill={g.a} />
      <path d="M8 9.5a8.5 8.5 0 0 1 5-3" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  info: (g) => (
    <>
      <circle cx="16" cy="16" r="12" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M16 14.5v7.5" stroke={g.a} strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="16" cy="10" r="1.8" fill={g.a} />
      <path d="M8 12a9 9 0 0 1 5-4.6" fill="none" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  ruler: (g) => (
    <>
      <rect x="2.5" y="11" width="27" height="10" rx="3" fill={g.b} stroke={g.k} strokeWidth="1.2" transform="rotate(-35 16 16)" />
      <path d="M9.3 18.6l-1.7-2.4M12.7 16.2l-2.4-3.4M16 13.9l-1.7-2.4M19.4 11.5l-2.4-3.4M22.7 9.1l-1.7-2.4" stroke={g.a} strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  calendar: (g) => (
    <>
      <rect x="4" y="6" width="24" height="22" rx="5" fill={g.b} stroke={g.k} strokeWidth="1.2" />
      <path d="M4 12.5h24V11a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5z" fill={g.a} />
      <path d="M10 3.5v5M22 3.5v5" stroke={g.k} strokeWidth="2" strokeLinecap="round" />
      <rect x="9" y="16" width="4" height="4" rx="1.2" fill={g.d} />
      <rect x="14" y="16" width="4" height="4" rx="1.2" fill={g.d} opacity="0.5" />
      <rect x="19" y="16" width="4" height="4" rx="1.2" fill={g.d} opacity="0.5" />
    </>
  ),
  party: (g) => (
    <>
      <path d="M7 5h11l-1.6 10.5a3.9 3.9 0 0 1-7.8 0z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8.2 11h9.4l-1.2 4.6a3.4 3.4 0 0 1-7 0z" fill={g.a} />
      <path d="M12.5 19.5v6M9 27h7" stroke={g.d} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 9l2-3M25 13l3.2-1M23.5 17.5l2.6 1.6" stroke={g.a} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M9.5 7.5l.5 5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </>
  ),
  shield: (g) => (
    <>
      <path d="M16 3.5l10 3.8v7.6c0 6.4-4.4 11-10 13.6C10.4 25.9 6 21.3 6 14.9V7.3z" fill={g.b} stroke={g.k} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M11.5 15.5l3.2 3.2 6-6.6" fill="none" stroke={g.a} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9.5v5" stroke={g.s} strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  apps: (g) => (
    <>
      <rect x="4" y="4" width="10.5" height="10.5" rx="3.2" fill={g.a} stroke={g.k} strokeWidth="1" />
      <rect x="17.5" y="4" width="10.5" height="10.5" rx="3.2" fill={g.b} stroke={g.k} strokeWidth="1" />
      <rect x="4" y="17.5" width="10.5" height="10.5" rx="3.2" fill={g.b} stroke={g.k} strokeWidth="1" />
      <rect x="17.5" y="17.5" width="10.5" height="10.5" rx="3.2" fill={g.b} stroke={g.k} strokeWidth="1" />
      <path d="M6.5 7v3" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
};

const PALETTE: Record<Tone, { b: [string, string, string]; a: [string, string]; d: string; k: string }> = {
  silver: { b: ["#ffffff", "#e3e7eb", "#b9c0c8"], a: ["#6fdc98", "#23864c"], d: "#5d6670", k: "rgba(70,80,92,.55)" },
  green: { b: ["#d9fbe6", "#7fd9a2", "#2b9658"], a: ["#ffffff", "#c9f4da"], d: "#1e6e41", k: "rgba(18,80,44,.6)" },
  white: { b: ["#ffffff", "#f2fbf5", "#cdeedb"], a: ["#ffffff", "#e8fff0"], d: "#ffffff", k: "rgba(255,255,255,.85)" },
  ink: { b: ["#f6f8f9", "#d7dce1", "#9aa3ad"], a: ["#4bc57e", "#1e6e41"], d: "#3c444c", k: "rgba(40,48,56,.6)" },
};

export function NvIcon({ name, size = 24, tone = "silver", className = "", title }: { name: IconName; size?: number; tone?: Tone; className?: string; title?: string }) {
  const raw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const id = `nvi${raw}`;
  const p = PALETTE[tone];
  const g: G = { b: `url(#${id}b)`, s: "rgba(255,255,255,.95)", d: p.d, k: p.k, a: `url(#${id}a)` };
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={`nv-icon ${className}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id={`${id}b`} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor={p.b[0]} />
          <stop offset="0.55" stopColor={p.b[1]} />
          <stop offset="1" stopColor={p.b[2]} />
        </linearGradient>
        <linearGradient id={`${id}a`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor={p.a[0]} />
          <stop offset="1" stopColor={p.a[1]} />
        </linearGradient>
      </defs>
      {ICONS[name](g)}
    </svg>
  );
}
