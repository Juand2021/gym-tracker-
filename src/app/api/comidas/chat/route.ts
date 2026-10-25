import { NextRequest, NextResponse } from "next/server";
import { sendComidasMessage } from "@/lib/nutrition/comidas-chat";
import { comidasProfile, errorResponse } from "../guard";

// Una comida: modelo + motor de comidas + respuesta (≈10 s). Margen amplio.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const profile = comidasProfile(request);
  if (profile instanceof NextResponse) return profile;
  try {
    const body = (await request.json()) as { chatId?: string; message?: string };
    const text = body.message?.trim();
    if (!text) return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 });
    const chat = await sendComidasMessage(profile, body.chatId ?? null, text);
    return NextResponse.json({ chat });
  } catch (error) {
    return errorResponse(error, "Error al procesar el mensaje");
  }
}
