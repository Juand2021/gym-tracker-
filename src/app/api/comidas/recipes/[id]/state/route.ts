import { NextRequest, NextResponse } from "next/server";
import { updateRecipeState } from "@/lib/nutrition/kitchen/server";
import { comidasProfile, errorResponse } from "../../../guard";

type Params = { params: Promise<{ id: string }> };

/** Marcar una receta como probada, favorita o si le gustó. */
export async function PUT(request: NextRequest, { params }: Params) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  const { id } = await params;
  try {
    const body = (await request.json()) as { tried?: boolean; liked?: -1 | 0 | 1; favorite?: boolean };
    return NextResponse.json({ state: await updateRecipeState(profile, id, body) });
  } catch (error) {
    return errorResponse(error, "Error al guardar");
  }
}
