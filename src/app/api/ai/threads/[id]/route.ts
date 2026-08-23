import { NextRequest, NextResponse } from "next/server";
import { deleteChatThread, getChatThread } from "@/lib/data";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: Params) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();

  const { id } = await params;

  try {
    const thread = await getChatThread(profile, id);
    if (!thread) {
      return NextResponse.json(
        { error: "Conversación no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener conversación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();

  const { id } = await params;

  try {
    await deleteChatThread(profile, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar conversación";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
