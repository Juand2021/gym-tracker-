import { NextRequest, NextResponse } from "next/server";
import { logRecipe, previewRecipeLog, type LogRecipeInput } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../../../guard";

type Params = { params: Promise<{ id: string }> };

/**
 * Registra una receta como comida, calculada en código (sin IA).
 * Con `preview: true` solo devuelve las cifras para la hoja de confirmación.
 */
export async function POST(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const body = (await request.json()) as LogRecipeInput & { preview?: boolean };
    if (body.preview) return NextResponse.json({ preview: await previewRecipeLog(profile, id, body) });
    return NextResponse.json({ meal: await logRecipe(profile, id, body) });
  } catch (error) {
    return errorResponse(error, "Error al registrar la receta");
  }
}
