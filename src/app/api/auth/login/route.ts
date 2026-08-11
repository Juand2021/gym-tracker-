import { NextRequest, NextResponse } from "next/server";
import {
  createAuthToken,
  getAuthCookieName,
  verifyPin,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!process.env.SITE_PIN) {
    return NextResponse.json(
      { error: "SITE_PIN no configurado en el servidor" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { pin?: string };
  const pin = body.pin?.trim() ?? "";

  if (!verifyPin(pin)) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: getAuthCookieName(),
    value: createAuthToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
