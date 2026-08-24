"use client";

import type { DayType } from "@/lib/routines";

interface MuscleGroupIconProps {
  group: DayType | string;
  className?: string;
}

export function MuscleGroupIcon({
  group,
  className = "h-16 w-16 sm:h-20 sm:w-20",
}: MuscleGroupIconProps) {
  const normalized = group.toLowerCase();

  // PECHO: Anatomía pectoral completa y definida (pectoral mayor, clavícula, esternón y corte de torso)
  if (normalized === "pecho") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-300 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.06)]`}
        aria-hidden="true"
      >
        {/* Cuello y Trapecio Superior */}
        <path
          d="M26 6L28 14H36L38 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        {/* Clavículas */}
        <path
          d="M16 15C22 17.5 28 19.5 32 21.5C36 19.5 42 17.5 48 15"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        {/* Deltoides Izquierdo de marco */}
        <path
          d="M16 15C10 17 6 22 7 29C8 33 11 35 14 34L15 26"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Deltoides Derecho de marco */}
        <path
          d="M48 15C54 17 58 22 57 29C56 33 53 35 50 34L49 26"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Pectoral Izquierdo Completo */}
        <path
          d="M16 17C15 25.5 18 33.5 30.5 32.5C31.5 28 31.5 23 31 21C26 18 20 17 16 17Z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Pectoral Derecho Completo */}
        <path
          d="M48 17C49 25.5 46 33.5 33.5 32.5C32.5 28 32.5 23 33 21C38 18 44 17 48 17Z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Líneas de Haz Superior de Pectorales */}
        <path
          d="M19 21.5C24 23.5 28 25.5 31 25.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <path
          d="M45 21.5C40 23.5 36 25.5 33 25.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {/* Hendidura del Esternón Central */}
        <line
          x1="32"
          y1="21.5"
          x2="32"
          y2="41"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        {/* Abdomen Superior / Serratos */}
        <path
          d="M23 37.5C25 36.5 29 36.5 31 37.5V46C29 47 25 47 23 46V37.5Z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        <path
          d="M41 37.5C39 36.5 35 36.5 33 37.5V46C35 47 39 47 41 46V37.5Z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Costillas / Serratos Laterales */}
        <path
          d="M15 38.5C18 41 20.5 43.5 20.5 48"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M49 38.5C46 41 43.5 43.5 43.5 48"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </svg>
    );
  }

  // ESPALDA: Anatomía dorsal completa (trapecios, deltoides posteriores, dorsales anchos en V y columna)
  if (normalized === "espalda") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-300 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.06)]`}
        aria-hidden="true"
      >
        {/* Cuello y Trapecio Superior */}
        <path
          d="M25 6L32 12L39 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {/* Trapecio Central Romboide */}
        <path
          d="M32 12L43 22L32 34L21 22L32 12Z"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Deltoides Posteriores */}
        <path
          d="M21 21C14 20 8 24 9 30C10 33 13 34 16 33L21 26"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.6"
        />
        <path
          d="M43 21C50 20 56 24 55 30C54 33 51 34 48 33L43 26"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.6"
        />
        {/* Dorsal Ancho Izquierdo (Ala) */}
        <path
          d="M21 26C13.5 30 12.5 41.5 24 47.5L30 40.5C28 35 25 30 21 26Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Dorsal Ancho Derecho (Ala) */}
        <path
          d="M43 26C50.5 30 51.5 41.5 40 47.5L34 40.5C36 35 39 30 43 26Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Columna Vertebral Central */}
        <line
          x1="32"
          y1="12"
          x2="32"
          y2="52"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeDasharray="3 3"
          strokeOpacity="0.8"
        />
        {/* Árbol de Navidad / Espalda Baja Lumbar */}
        <path
          d="M29 43L32 46.5L35 43"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <path
          d="M27 48.5L32 53L37 48.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
      </svg>
    );
  }

  // HOMBRO: Deltoides 3D potentes (cabeza frontal, lateral y posterior destacadas)
  if (normalized === "hombro") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-300 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.06)]`}
        aria-hidden="true"
      >
        {/* Silueta de Cabeza y Cuello */}
        <path
          d="M27 8C27 13 37 13 37 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        <path
          d="M23 16C28 17.5 36 17.5 41 16"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />

        {/* DELTOIDE IZQUIERDO (Hombro Potente) */}
        {/* Cabeza Frontal / Anterior */}
        <path
          d="M22 17C17 18 14 22.5 15 27.5C16 30.5 18 31.5 20 29.5L22 23.5Z"
          fill="currentColor"
          fillOpacity="0.36"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Cabeza Lateral / Medial (Volumen redondeado) */}
        <path
          d="M15 19C8.5 21 5.5 27 6.5 34C7.5 39.5 12.5 40.5 15.5 37.5C17 32 17.5 26 17.5 20"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Brazo / Inserción Bíceps */}
        <path
          d="M10.5 38.5C11.5 45.5 14.5 48.5 15.5 48.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* DELTOIDE DERECHO (Hombro Potente) */}
        {/* Cabeza Frontal / Anterior */}
        <path
          d="M42 17C47 18 50 22.5 49 27.5C48 30.5 46 31.5 44 29.5L42 23.5Z"
          fill="currentColor"
          fillOpacity="0.36"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Cabeza Lateral / Medial (Volumen redondeado) */}
        <path
          d="M49 19C55.5 21 58.5 27 57.5 34C56.5 39.5 51.5 40.5 48.5 37.5C47 32 46.5 26 46.5 20"
          fill="currentColor"
          fillOpacity="0.28"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Brazo / Inserción Bíceps */}
        <path
          d="M53.5 38.5C52.5 45.5 49.5 48.5 48.5 48.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* Referencia Pectoral de fondo */}
        <path
          d="M24 23.5C26 31.5 31 34.5 32 34.5C33 34.5 38 31.5 40 23.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
      </svg>
    );
  }

  // PIERNA: Anatomía de cuádriceps, rodillas y pantorrillas musculadas
  if (normalized === "pierna") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-300 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.06)]`}
        aria-hidden="true"
      >
        {/* Cadera / Cintura */}
        <path
          d="M18 10H46"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />

        {/* PIERNA IZQUIERDA */}
        {/* Vasto Lateral (Barrido externo del cuádriceps) */}
        <path
          d="M19 11C12.5 18 13.5 29.5 16.5 36.5C18 38.5 20.5 38.5 21.5 35.5C23.5 28 23.5 18 21.5 11H19Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Vasto Medial (Gota interna sobre la rodilla) */}
        <path
          d="M21.5 28.5C21.5 34.5 24.5 36.5 26.5 34.5C27.5 32.5 26.5 28.5 24.5 27.5L21.5 28.5Z"
          fill="currentColor"
          fillOpacity="0.38"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Recto Femoral (Línea central) */}
        <path
          d="M21 15C22 22 23 29 23 35"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        {/* Rodilla / Rótula */}
        <circle
          cx="20.5"
          cy="40.5"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.45"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Pantorrilla / Gemelo */}
        <path
          d="M16.5 43.5C14.5 48.5 16.5 54.5 17.5 57.5C18.5 57.5 22.5 57.5 22.5 55.5C23.5 51.5 23.5 46.5 22.5 43.5"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* PIERNA DERECHA */}
        {/* Vasto Lateral (Barrido externo del cuádriceps) */}
        <path
          d="M45 11C51.5 18 50.5 29.5 47.5 36.5C46 38.5 43.5 38.5 42.5 35.5C40.5 28 40.5 18 42.5 11H45Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Vasto Medial (Gota interna sobre la rodilla) */}
        <path
          d="M42.5 28.5C42.5 34.5 39.5 36.5 37.5 34.5C36.5 32.5 37.5 28.5 39.5 27.5L42.5 28.5Z"
          fill="currentColor"
          fillOpacity="0.38"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Recto Femoral (Línea central) */}
        <path
          d="M43 15C42 22 41 29 41 35"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.55"
        />
        {/* Rodilla / Rótula */}
        <circle
          cx="43.5"
          cy="40.5"
          r="2.2"
          fill="currentColor"
          fillOpacity="0.45"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        {/* Pantorrilla / Gemelo */}
        <path
          d="M47.5 43.5C49.5 48.5 47.5 54.5 46.5 57.5C45.5 57.5 41.5 57.5 41.5 55.5C40.5 51.5 40.5 46.5 41.5 43.5"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
}
