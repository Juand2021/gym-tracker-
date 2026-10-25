import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { runNutritionTool } from "@/lib/nutrition/chat-tools";
import { makeToolContext } from "@/lib/nutrition/server";
import { comidasProfile, errorResponse } from "../guard";

export const maxDuration = 60;

/** "¿Qué pido?": compara 2–4 opciones sin guardar nada. */
export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json()) as { options?: string[] };
    const options = (body.options ?? []).map((o) => String(o).trim()).filter(Boolean).slice(0, 4);
    if (options.length < 1) return NextResponse.json({ error: "Escribe al menos una opción" }, { status: 400 });
    const ctx = await makeToolContext(profile, null, randomUUID());
    if (!ctx) return NextResponse.json({ error: "La IA o la base de alimentos no están disponibles" }, { status: 503 });
    return NextResponse.json(await runNutritionTool("consultar_opciones", { opciones: options }, ctx));
  } catch (error) {
    return errorResponse(error, "Error al comparar");
  }
}
