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

  // PECHO: Anatomía pectoral completa y definida (pectoral mayor, clavículas, esternón y marco del torso)
  if (normalized === "pecho") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-200 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)]`}
        aria-hidden="true"
      >
        {/* Cuello y Trapecio Superior */}
        <path
          d="M26 8L28 15H36L38 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
        {/* Clavículas */}
        <path
          d="M15 16C21 18.5 27 20.5 32 22C37 20.5 43 18.5 49 16"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        {/* Deltoides Izquierdo de marco */}
        <path
          d="M15 16C9 18 5 23 6 30C7 34 10 36 13 35L14 27"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Deltoides Derecho de marco */}
        <path
          d="M49 16C55 18 59 23 58 30C57 34 54 36 51 35L50 27"
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Pectoral Izquierdo Completo */}
        <path
          d="M15 18C14 26 17 34 29.5 33C30.5 28.5 30.5 24 30 21.5C25 19 19 18 15 18Z"
          fill="currentColor"
          fillOpacity="0.34"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Pectoral Derecho Completo */}
        <path
          d="M49 18C50 26 47 34 34.5 33C33.5 28.5 33.5 24 34 21.5C39 19 45 18 49 18Z"
          fill="currentColor"
          fillOpacity="0.34"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Líneas de Haz Superior de Pectorales */}
        <path
          d="M18 22.5C23 24.5 27 26.5 30 26.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        <path
          d="M46 22.5C41 24.5 37 26.5 34 26.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
        {/* Hendidura del Esternón Central */}
        <line
          x1="32"
          y1="22"
          x2="32"
          y2="42"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.9"
        />
        {/* Abdomen Superior / Serratos */}
        <path
          d="M22 38C24 37 28 37 30 38V47C28 48 24 48 22 47V38Z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        <path
          d="M42 38C40 37 36 37 34 38V47C36 48 40 48 42 47V38Z"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeOpacity="0.5"
        />
        {/* Costillas / Serratos Laterales */}
        <path
          d="M14 39C17 41.5 19.5 44 19.5 48.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
        <path
          d="M50 39C47 41.5 44.5 44 44.5 48.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.45"
        />
      </svg>
    );
  }

  // ESPALDA: Proporción balanceada idéntica al pecho, basada en el diagrama anatómico (Trapecio, deltoides posteriores, teres, dorsales y erectores)
  if (normalized === "espalda") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-200 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)]`}
        aria-hidden="true"
      >
        {/* Cuello / Nuca */}
        <path
          d="M28 8C28 11 30 12 32 12C34 12 36 11 36 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />

        {/* TRAPECIO SUPERIOR Y MEDIO (Manto dorsal central) */}
        <path
          d="M28 8C29 13 25 16 18 19C23 19.5 29 23.5 32 29C35 23.5 41 19.5 46 19C39 16 35 13 36 8H28Z"
          fill="currentColor"
          fillOpacity="0.32"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Surco central del trapecio */}
        <path
          d="M32 12V29"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        {/* Estrías musculares del trapecio */}
        <path
          d="M26 14C28 15 30 15.5 32 15.5C34 15.5 36 15 38 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.45"
        />
        <path
          d="M23 18C26 19.5 29 20.5 32 20.5C35 20.5 38 19.5 41 18"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.45"
        />

        {/* DELTOIDES POSTERIORES */}
        <path
          d="M18 19C13 19 9 22 8 27C9 30 12 31 15 30C17 26 18 22 18 19Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M46 19C51 19 55 22 56 27C55 30 52 31 49 30C47 26 46 22 46 19Z"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* TERES MAYOR Y MENOR / ESCÁPULAS */}
        <path
          d="M18 21L15 30C18 32 21 32.5 24 31.5L21 24C19 23 18 22 18 21Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M46 21L49 30C46 32 43 32.5 40 31.5L43 24C45 23 46 22 46 21Z"
          fill="currentColor"
          fillOpacity="0.2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* DORSAL ANCHO (Latissimus Dorsi / Las Alas en V) */}
        <path
          d="M15 30C10 33 11 41 19 45L26 39C24 35 23 32 23 32C20 33 17 32 15 30Z"
          fill="currentColor"
          fillOpacity="0.38"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M49 30C54 33 53 41 45 45L38 39C40 35 41 32 41 32C44 33 47 32 49 30Z"
          fill="currentColor"
          fillOpacity="0.38"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Estrías de las alas */}
        <path
          d="M16 35C18.5 36.5 21.5 38 24 39"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.5"
        />
        <path
          d="M48 35C45.5 36.5 42.5 38 40 39"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeOpacity="0.5"
        />

        {/* ERECTORES LUMBARES / ESPALDA BAJA */}
        <path
          d="M26 39L19 45C20 50 23 52 25 53C26 50 26 45 26 39Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M38 39L45 45C44 50 41 52 39 53C38 50 38 45 38 39Z"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <line
          x1="32"
          y1="29"
          x2="32"
          y2="53"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeDasharray="2.5 2.5"
          strokeOpacity="0.6"
        />

        {/* Silueta de brazos laterales */}
        <path
          d="M7 27C6 34 7 42 9 49"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
        <path
          d="M57 27C58 34 57 42 55 49"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />
      </svg>
    );
  }

  // HOMBRO: Brazo completo musculado con el Deltoides (Hombro) claramente resaltado y brillante
  if (normalized === "hombro") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-200 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_10px_rgba(255,255,255,0.08)]`}
        aria-hidden="true"
      >
        {/* Clavícula y cuello (Anclaje superior del hombro) */}
        <path
          d="M10 14C15 15.5 21 16.5 26 15"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />
        <path
          d="M12 20C16 23 20 25 22 28"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.35"
        />

        {/* DELTOIDES / HOMBRO (MÚSCULO PRINCIPAL RESALTADO) */}
        {/* Casquete deltoideo 3D completo con alto contraste */}
        <path
          d="M24 14C32 12 43 16 46 24C48 30 44 36 38 38.5C32.5 40.5 28 35.5 25 30C23 26 23 18 24 14Z"
          fill="currentColor"
          fillOpacity="0.48"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Separación de las 3 cabezas deltoideas: Anterior, Lateral y Posterior */}
        <path
          d="M32 14C31 22 30 30 33 38.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.85"
        />
        <path
          d="M39 16C41 23 42 30 39 37.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.8"
        />
        {/* Estría superior de acromion */}
        <path
          d="M28 17C34 16 39 18 42.5 22"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />

        {/* BÍCEPS (Brazo flexionado a 90 grados) */}
        <path
          d="M25 30C20 34 19 40 22 46C24 49 29 49 31 46L34 38.5"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Curva del pico del bíceps */}
        <path
          d="M23 37C22 41 23 44 26 46"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />

        {/* TRÍCEPS (Herradura trasera del brazo) */}
        <path
          d="M38 38.5C45 40.5 48 46 46 52C44 55 39 55 36 53L31 46"
          fill="currentColor"
          fillOpacity="0.16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* CODO (Punta del olécranon) */}
        <path
          d="M46 52L43 56L36 58"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.55"
        />

        {/* ANTEBRAZO Y PUÑO FLEXIONADO */}
        <path
          d="M22 46L14 49C10 50 8 47 10 44L17 40"
          fill="currentColor"
          fillOpacity="0.14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.6"
        />
        {/* Tendón del antebrazo */}
        <line
          x1="18"
          y1="43"
          x2="13"
          y2="47"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    );
  }

  // PIERNA: Diseño limpio, nítido y legible con bóxer deportivo y cuádriceps bien proporcionados sin líneas sobrepuestas
  if (normalized === "pierna") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} text-zinc-200 group-hover:text-white transition-all flex-shrink-0 drop-shadow-[0_2px_8px_rgba(255,255,255,0.06)]`}
        aria-hidden="true"
      >
        {/* BÓXER DEPORTIVO (Limpio y bien definido) */}
        {/* Cinturilla */}
        <path
          d="M19 12H45"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        {/* Cuerpo del bóxer */}
        <path
          d="M19 12L17 23C23 25 28 24.5 32 22C36 24.5 41 25 47 23L45 12H19Z"
          fill="currentColor"
          fillOpacity="0.3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Costura central */}
        <line
          x1="32"
          y1="12"
          x2="32"
          y2="22"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />

        {/* ===== MUSLO IZQUIERDO ===== */}
        {/* Silueta exterior y barrido del cuádriceps */}
        <path
          d="M17 23C12 29 13 38 17 46C18.5 48.5 21 48.5 22.5 46C24 37 24 28 22 23"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Músculo central (Recto femoral) */}
        <path
          d="M20 25C19 32 19 39 22 45"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
        {/* Gota interna (Vasto medial) */}
        <path
          d="M25 36C24.5 42 27 46 29 44C30 42 29 36 27 34L25 36Z"
          fill="currentColor"
          fillOpacity="0.45"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Rodilla izquierda */}
        <circle
          cx="22.5"
          cy="51"
          r="2"
          fill="currentColor"
          fillOpacity="0.4"
          stroke="currentColor"
          strokeWidth="1.6"
        />

        {/* ===== MUSLO DERECHO ===== */}
        {/* Silueta exterior y barrido del cuádriceps */}
        <path
          d="M47 23C52 29 51 38 47 46C45.5 48.5 43 48.5 41.5 46C40 37 40 28 42 23"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Músculo central (Recto femoral) */}
        <path
          d="M44 25C45 32 45 39 42 45"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Gota interna (Vasto medial) */}
        <path
          d="M39 36C39.5 42 37 46 35 44C34 42 35 36 37 34L39 36Z"
          fill="currentColor"
          fillOpacity="0.45"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* Rodilla derecha */}
        <circle
          cx="41.5"
          cy="51"
          r="2"
          fill="currentColor"
          fillOpacity="0.4"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return null;
}
