import { NextRequest, NextResponse } from "next/server";
import { applyProfilePatch, todayInBogota, type ProfilePatch } from "@/lib/nutrition/profile";
import { getNutritionStore, profileView } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

/** Perfil completo (datos, objetivos, salud, nivel y logros). */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await profileView(profile));
  } catch (error) {
    return errorResponse(error, "Error al leer el perfil");
  }
}

/** Cambia datos del perfil u objetivo (los mismos campos de ProfilePatch). */
export async function PUT(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const patch = (await request.json()) as ProfilePatch;
    const store = getNutritionStore(profile);
    const { profile: next, errors } = applyProfilePatch(await store.getProfile(), patch, todayInBogota());
    if (errors.length) return NextResponse.json({ error: errors.join(" ") }, { status: 400 });
    await store.saveProfile(next);
    return NextResponse.json(await profileView(profile));
  } catch (error) {
    return errorResponse(error, "Error al guardar el perfil");
  }
}
