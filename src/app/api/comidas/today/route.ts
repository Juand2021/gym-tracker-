import { NextRequest, NextResponse } from "next/server";
import { daySummary } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Lo de hoy (alias de /api/comidas/day sin fecha). */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await daySummary(profile));
  } catch (error) {
    return errorResponse(error, "Error al calcular el día");
  }
}
