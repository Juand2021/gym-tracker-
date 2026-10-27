import type { ReactNode } from "react";
import { PlanesTabs } from "@/components/nutriverse/NvKitchen";

/** Planes: Hoy · Recetas · Despensa · Semana (docs/nutricion/06-planes-recetas.md §5). */
export default function PlanesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="nv-stack">
      <PlanesTabs />
      {children}
    </div>
  );
}
