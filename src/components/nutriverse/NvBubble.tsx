"use client";

import { useId, type ReactNode } from "react";

/**
 * Burbujas de comida (§6.3): esfera de vidrio con la comida adentro.
 * Cuando lleguen las imágenes de 04b-ficha-recursos.md, se copian a public/nutriverse/
 * y se agrega su nombre a NV_ASSETS: la burbuja usa la imagen en vez del dibujo.
 */
export const NV_ASSETS = new Set<string>([
  // "burbuja-desayuno", "burbuja-almuerzo", ...
]);

export type BubbleKind = "desayuno" | "almuerzo" | "cena" | "snack" | "fiesta" | "agua" | "plato";

type D = { id: string };

const ART: Record<BubbleKind, (d: D) => ReactNode> = {
  desayuno: ({ id }) => (
    <>
      {/* Arepa con huevo pericos y pocillo de chocolate */}
      <ellipse cx="28" cy="40" rx="17" ry="7" fill={`url(#${id}plate)`} />
      <ellipse cx="25" cy="35" rx="12" ry="7.5" fill="#e7c27a" stroke="#c99b4d" strokeWidth="0.8" />
      <ellipse cx="25" cy="34" rx="9" ry="5" fill="#f4d679" />
      <circle cx="22" cy="33" r="1.4" fill="#e45b3f" />
      <circle cx="27.5" cy="35" r="1.2" fill="#3fa565" />
      <circle cx="26" cy="32" r="1.1" fill="#e45b3f" />
      <path d="M38 27h8v6a4 4 0 0 1-8 0z" fill="#fff" stroke="#c4cad1" strokeWidth="0.8" />
      <ellipse cx="42" cy="27.4" rx="3.6" ry="1.1" fill="#7a4a2c" />
      <path d="M46 28.5a2 2 0 0 1 0 3.5" fill="none" stroke="#c4cad1" strokeWidth="1" />
    </>
  ),
  almuerzo: ({ id }) => (
    <>
      {/* Bandeja: arroz, fríjoles, carne, maduro y ensalada */}
      <ellipse cx="32" cy="38" rx="20" ry="9" fill={`url(#${id}plate)`} />
      <ellipse cx="24" cy="35" rx="7" ry="4" fill="#fbfaf4" stroke="#e3e0d4" strokeWidth="0.6" />
      <ellipse cx="34" cy="31.5" rx="6" ry="3.3" fill="#7b2f22" />
      <circle cx="32.5" cy="31" r="0.9" fill="#a5493a" />
      <circle cx="35.5" cy="32" r="0.8" fill="#a5493a" />
      <path d="M33 37.5c3-2.6 8.6-2.6 11 .2-2.6 2.8-8.4 2.8-11-.2z" fill="#8b5136" />
      <path d="M40 31.5c2-1.6 5-1.4 6.4.4-1.6 1.8-4.6 1.8-6.4-.4z" fill="#f0a73c" stroke="#d07f1f" strokeWidth="0.5" />
      <circle cx="21" cy="40" r="2.6" fill="#55b86f" />
      <circle cx="24.5" cy="41" r="2.2" fill="#e04a3a" />
      <circle cx="18.5" cy="37.5" r="2" fill="#7fd08f" />
    </>
  ),
  cena: ({ id }) => (
    <>
      {/* Pechuga con ensalada */}
      <ellipse cx="32" cy="38" rx="19" ry="8.5" fill={`url(#${id}plate)`} />
      <path d="M22 35c2-5 12-6 15-1.5 1.6 2.6-1.6 5.6-7 5.6-5 0-9-1.4-8-4.1z" fill="#e2b06c" stroke="#bb8344" strokeWidth="0.7" />
      <path d="M25 34.5l9-1.5M25.5 37l9-1.4" stroke="#b07434" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx="40" cy="36" r="3.4" fill="#4caf63" />
      <circle cx="43.5" cy="38.5" r="2.8" fill="#6fd085" />
      <circle cx="38.5" cy="40.5" r="2.2" fill="#e84b3a" />
      <circle cx="44" cy="34" r="1.6" fill="#f5d04a" />
    </>
  ),
  snack: () => (
    <>
      {/* Frutas */}
      <path d="M18 33c0-6 5-9 9-8 3 .8 3.6 4 1.8 8.6C26.6 39 18 40 18 33z" fill="#f7b733" stroke="#de8f19" strokeWidth="0.7" />
      <path d="M28 27c5-6 13-4.6 15 0-4.4-1.6-10.6-1.4-15 0z" fill="#f4dc63" stroke="#cdb12e" strokeWidth="0.7" />
      <path d="M33 30c4.6-1.6 9.4 1 9.6 5.4.2 4.6-5.4 7-9 4.4-3.4-2.4-4.4-8.4-.6-9.8z" fill="#e8344a" stroke="#b81f33" strokeWidth="0.7" />
      <path d="M37.6 30.2c.6-1.6 2-2.6 3.6-2.6" stroke="#2f9a55" strokeWidth="1.4" strokeLinecap="round" />
      {[[35, 34], [38.5, 33], [36.5, 37.5], [40, 37]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill="#ffe08a" />
      ))}
      <circle cx="24" cy="40" r="3.4" fill="#f7a33a" />
    </>
  ),
  fiesta: () => (
    <>
      {/* Cerveza y copa */}
      <path d="M20 22h12l-1.4 20a2 2 0 0 1-2 1.8h-5.2a2 2 0 0 1-2-1.8z" fill="#f4b73a" stroke="#c88a17" strokeWidth="0.8" />
      <path d="M19.4 19.5c1-2.4 4-2.8 5.4-1.4 1.4-1.8 5-1.4 6 .8 1.6.2 2 2.6.6 3.4H19.6c-1.6-.6-1.6-2.4-.2-2.8z" fill="#fffaf0" />
      {[[23, 30], [26, 35], [28, 27], [24.5, 39]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.8" fill="#fff6d0" />
      ))}
      <path d="M36 26h10l-2 7a3 3 0 0 1-6 0z" fill="#dff1ff" stroke="#a8bfd0" strokeWidth="0.8" />
      <path d="M37.4 29h7.2l-1 3.6a2.6 2.6 0 0 1-5 0z" fill="#bfe3f7" />
      <path d="M41 36v6M38 43h6" stroke="#a8bfd0" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  agua: () => (
    <>
      {/* Agua con menta y limón */}
      <path d="M32 14c6.4 8 12 13.6 12 20.4a12 12 0 0 1-24 0c0-6.8 5.6-12.4 12-20.4z" fill="#bfe6f6" stroke="#8ec8de" strokeWidth="0.9" />
      <path d="M22 34c3.4-2 6.6-2 10 0s6.6 2 10 0a10 10 0 0 1-20 0z" fill="#7fcbe6" />
      <circle cx="36" cy="37" r="4" fill="#f2e86c" stroke="#d2c63a" strokeWidth="0.8" />
      <path d="M36 33v8M32 37h8M33.2 34.2l5.6 5.6M38.8 34.2l-5.6 5.6" stroke="#fff7a8" strokeWidth="0.6" />
      <path d="M26 30c2-3 5-3.6 6-2.4-1.4 2.6-4.2 3.4-6 2.4z" fill="#3fae64" />
    </>
  ),
  plato: ({ id }) => (
    <>
      <ellipse cx="32" cy="38" rx="19" ry="8.5" fill={`url(#${id}plate)`} />
      <path d="M22 36c1-6 8-9 12-7 5 2.4 9 1 9 5s-6 6-11 6-10.6-1-10-4z" fill="#7fd08f" />
      <circle cx="29" cy="33" r="2.4" fill="#e84b3a" />
      <circle cx="36" cy="35" r="2" fill="#f5d04a" />
    </>
  ),
};

/** Una burbuja de vidrio con comida. size en px. */
export function NvBubble({ kind, size = 56, className = "" }: { kind: BubbleKind; size?: number; className?: string }) {
  const id = `nvb${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const asset = `burbuja-${kind}`;
  return (
    <span className={`nv-bubble ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      {NV_ASSETS.has(asset) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/nutriverse/${asset}.png`} alt="" width={size} height={size} />
      ) : (
        <svg viewBox="0 0 64 64" width={size} height={size}>
          <defs>
            <radialGradient id={`${id}glass`} cx="0.35" cy="0.3" r="0.75">
              <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#eef3f6" stopOpacity="0.35" />
              <stop offset="0.86" stopColor="#c5cdd5" stopOpacity="0.45" />
              <stop offset="1" stopColor="#fff" stopOpacity="0.9" />
            </radialGradient>
            <linearGradient id={`${id}plate`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#d5dbe0" />
            </linearGradient>
            <clipPath id={`${id}clip`}>
              <circle cx="32" cy="32" r="28" />
            </clipPath>
          </defs>
          {/* Fondo interior de la esfera (un poco más oscuro abajo, como el vidrio grueso) */}
          <circle cx="32" cy="32" r="28" fill="#f3f6f8" />
          <g clipPath={`url(#${id}clip)`}>{ART[kind]({ id })}</g>
          {/* Vidrio: cuerpo, borde, brillos y menisco */}
          <circle cx="32" cy="32" r="28" fill={`url(#${id}glass)`} />
          <circle cx="32" cy="32" r="28.2" fill="none" stroke="rgba(255,255,255,.95)" strokeWidth="1.4" />
          <circle cx="32" cy="32" r="27" fill="none" stroke="rgba(120,135,150,.25)" strokeWidth="1" />
          <path d="M13 24a21 21 0 0 1 14-14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <ellipse cx="20" cy="17" rx="3" ry="1.6" fill="#fff" transform="rotate(-40 20 17)" />
          <path d="M44 52a21 21 0 0 0 9-10" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </svg>
      )}
    </span>
  );
}

export function bubbleFor(moment: string): BubbleKind {
  return (["desayuno", "almuerzo", "cena", "snack", "fiesta"] as const).includes(moment as never) ? (moment as BubbleKind) : "plato";
}
