"use client";

import type { DayType } from "@/lib/routines";

interface MuscleGroupIconProps {
  group: DayType | string;
  className?: string;
}

export function MuscleGroupIcon({
  group,
  className = "h-11 w-11",
}: MuscleGroupIconProps) {
  const normalized = group.toLowerCase();

  if (normalized === "pecho") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-white/60 group-hover:text-white transition-colors flex-shrink-0`}
        aria-hidden="true"
      >
        {/* Clavículas */}
        <path
          d="M13 14C18 16 22 18 24 19.5C26 18 30 16 35 14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        {/* Pectoral Izquierdo */}
        <path
          d="M12 17C12 25.5 17.5 29 23 28C23.5 24.5 23.5 21.5 23 18.5C19 16.5 15 16.5 12 17Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Pectoral Derecho */}
        <path
          d="M36 17C36 25.5 30.5 29 25 28C24.5 24.5 24.5 21.5 25 18.5C29 16.5 33 16.5 36 17Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Esternón / Línea Central */}
        <line
          x1="24"
          y1="19.5"
          x2="24"
          y2="34"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {/* Contorno Torso / Costillas */}
        <path
          d="M15 32.5C17.5 35 21 36 24 36C27 36 30.5 35 33 32.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    );
  }

  if (normalized === "espalda") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-white/60 group-hover:text-white transition-colors flex-shrink-0`}
        aria-hidden="true"
      >
        {/* Trapecios / Cuello base */}
        <path
          d="M18 12L24 16L30 12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        {/* Columna vertebral */}
        <line
          x1="24"
          y1="16"
          x2="24"
          y2="36"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray="2.5 2.5"
          strokeOpacity="0.45"
        />
        {/* Trapecio Central Romboide */}
        <path
          d="M24 16L31 22.5L24 28.5L17 22.5L24 16Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Dorsal Izquierdo (Lat) */}
        <path
          d="M17 22.5C11.5 25.5 12.5 33 18.5 35.5L23 31.5"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dorsal Derecho (Lat) */}
        <path
          d="M31 22.5C36.5 25.5 35.5 33 29.5 35.5L25 31.5"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (normalized === "hombro") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-white/60 group-hover:text-white transition-colors flex-shrink-0`}
        aria-hidden="true"
      >
        {/* Cuello y Trapecio Superior */}
        <path
          d="M20 13C20 15.5 28 15.5 28 13"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M17 17.5H31"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
        {/* Deltoide Izquierdo (Hombro) */}
        <path
          d="M17 17.5C11 17.5 7.5 21.5 8.5 27C9.5 31 13.5 31 15.5 29C17 25 17 21 17 17.5Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Deltoide Derecho (Hombro) */}
        <path
          d="M31 17.5C37 17.5 40.5 21.5 39.5 27C38.5 31 34.5 31 32.5 29C31 25 31 21 31 17.5Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Líneas de brazo / bíceps */}
        <path
          d="M12.5 31.5C12.5 35 14.5 37 15.5 37"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        <path
          d="M35.5 31.5C35.5 35 33.5 37 32.5 37"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    );
  }

  if (normalized === "pierna") {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-white/60 group-hover:text-white transition-colors flex-shrink-0`}
        aria-hidden="true"
      >
        {/* Cuádriceps / Muslo Izquierdo */}
        <path
          d="M14.5 12C11.5 18 12.5 26.5 14.5 30.5C15.5 32.5 18.5 32.5 19.5 29.5C20.5 24.5 20.5 17 18.5 12H14.5Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Cuádriceps / Muslo Derecho */}
        <path
          d="M33.5 12C36.5 18 35.5 26.5 33.5 30.5C32.5 32.5 29.5 32.5 28.5 29.5C27.5 24.5 27.5 17 29.5 12H33.5Z"
          fill="currentColor"
          fillOpacity="0.18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Rodillas */}
        <circle cx="17" cy="34" r="1.3" fill="currentColor" fillOpacity="0.6" />
        <circle cx="31" cy="34" r="1.3" fill="currentColor" fillOpacity="0.6" />
        {/* Gemelos / Pantorrillas */}
        <path
          d="M15.5 36.5C14.5 39.5 15.5 42.5 16.5 43.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M32.5 36.5C33.5 39.5 32.5 42.5 31.5 43.5"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </svg>
    );
  }

  return null;
}
