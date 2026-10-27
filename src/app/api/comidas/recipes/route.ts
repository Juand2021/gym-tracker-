import { NextRequest, NextResponse } from "next/server";
import type { Recipe } from "@/lib/nutrition/kitchen/recipes";
import { proposeRecipeFor, readOwnRecipe, recipesView, saveOwnRecipe } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../guard";

export const maxDuration = 60;

/** Biblioteca de recetas con estado de despensa y kcal por porción. */
export async function GET(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    return NextResponse.json(await recipesView(profile));
  } catch (error) {
    return errorResponse(error, "Error al cargar las recetas");
  }
}

type Body =
  | { action: "read"; text: string }
  | { action: "propose"; kind?: Recipe["kind"] | null; wish?: string | null }
  | { action: "save"; recipe: Recipe };

/**
 * Recetas propias y de la IA:
 * - read: lee una receta escrita (vista previa, no guarda);
 * - propose: la IA propone una con lo que hay en casa (vista previa);
 * - save: guarda la receta de la vista previa.
 */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json()) as Body;
    if (body.action === "read") return NextResponse.json(await readOwnRecipe(profile, String(body.text ?? "")));
    if (body.action === "propose") {
      const kind = body.kind === "desayuno" || body.kind === "comida" || body.kind === "snack" ? body.kind : null;
      return NextResponse.json(await proposeRecipeFor(profile, kind, body.wish ?? null));
    }
    if (body.action === "save" && body.recipe) return NextResponse.json({ recipe: await saveOwnRecipe(profile, body.recipe) });
    return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
  } catch (error) {
    return errorResponse(error, "Error con la receta");
  }
}
