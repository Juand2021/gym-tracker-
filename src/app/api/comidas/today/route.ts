import { NextRequest, NextResponse } from "next/server";
import { todaySummary } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Lo consumido hoy vs objetivos, con las comidas del día. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await todaySummary(profile));
  } catch (error) {
    return errorResponse(error, "Error al calcular el día");
  }
}
