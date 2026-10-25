import { NextRequest, NextResponse } from "next/server";
import type { ProfilePatch } from "@/lib/nutrition/profile";
import { previewTargets } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../../guard";

/** Calcula los objetivos con cambios sin guardarlos (vista previa al cambiar de objetivo). */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await previewTargets(profile, (await request.json()) as ProfilePatch));
  } catch (error) {
    return errorResponse(error, "Error al calcular");
  }
}
