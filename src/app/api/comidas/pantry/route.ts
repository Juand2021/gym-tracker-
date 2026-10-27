import { NextRequest, NextResponse } from "next/server";
import { pantryView, updatePantry, type PantryPatch } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../guard";

/** Despensa: qué hay en casa y con qué se cocina. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await pantryView(profile));
  } catch (error) {
    return errorResponse(error, "Error al cargar la despensa");
  }
}

/** Agregar o quitar ingredientes (`add`, `remove`, `set`, o `text`: "compré pollo y huevos") y el equipo. */
export async function PUT(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json()) as PantryPatch;
    await updatePantry(profile, body);
    return NextResponse.json(await pantryView(profile));
  } catch (error) {
    return errorResponse(error, "Error al guardar la despensa");
  }
}
