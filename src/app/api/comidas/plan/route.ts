import { NextRequest, NextResponse } from "next/server";
import { planFor } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Plan del día: qué y cuánto comer en lo que queda. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await planFor(profile));
  } catch (error) {
    return errorResponse(error, "Error al armar el plan");
  }
}
