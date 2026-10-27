import { NextRequest, NextResponse } from "next/server";
import { snackSuggestions } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../guard";

/** "Tengo hambre": snacks que caben en lo que queda del día. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await snackSuggestions(profile));
  } catch (error) {
    return errorResponse(error, "Error al buscar snacks");
  }
}
