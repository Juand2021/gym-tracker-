import { NextRequest, NextResponse } from "next/server";
import { deleteOwnRecipe, recipeDetail } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../../guard";

type Params = { params: Promise<{ id: string }> };

/** Receta completa: ingredientes (con lo que hay en casa), pasos y porción ajustada al día. */
export async function GET(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    return NextResponse.json(await recipeDetail(profile, id));
  } catch (error) {
    return errorResponse(error, "Error al cargar la receta");
  }
}

/** Borra una receta propia o de la IA (las de la biblioteca no). */
export async function DELETE(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    await deleteOwnRecipe(profile, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Error al borrar la receta");
  }
}
