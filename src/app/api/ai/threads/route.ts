import { NextRequest, NextResponse } from "next/server";
import { createChatThread, listChatThreads } from "@/lib/data";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

export async function GET(request: NextRequest) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();

  try {
    const threads = await listChatThreads(profile);
    return NextResponse.json({ threads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener conversaciones";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();

  try {
    const body = (await request.json().catch(() => ({}))) as {
      title?: string;
      message?: string;
    };

    const initialMessage = body.message?.trim()
      ? { role: "user" as const, content: body.message.trim() }
      : undefined;

    const thread = await createChatThread(
      profile,
      body.title?.trim() || (initialMessage ? initialMessage.content.slice(0, 32) : "Nueva conversación"),
      initialMessage,
    );

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear conversación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
