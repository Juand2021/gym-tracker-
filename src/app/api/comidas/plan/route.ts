import { NextRequest, NextResponse } from "next/server";
import { recipePlan } from "@/lib/nutrition/kitchen/server";
import { planFor } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/**
 * Plan del día: una receta ajustada por cada comida que falta (Planes 2.0).
 * Si ninguna receta sirve (dieta o equipo), se agregan las opciones de alimentos sueltos de antes.
 */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const plan = await recipePlan(profile);
    if (plan.ok && plan.slots.length && plan.slots.every((s) => !s.pick)) {
      const old = await planFor(profile);
      return NextResponse.json({ ...plan, fallback: old.ok ? old.plan : null });
    }
    return NextResponse.json(plan);
  } catch (error) {
    return errorResponse(error, "Error al armar el plan");
  }
}
