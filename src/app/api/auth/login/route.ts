import { NextRequest, NextResponse } from "next/server";
import {
  createAuthTokenForPin,
  getAuthCookieName,
  getProfileCookieName,
  hasAnySitePinConfigured,
  verifyPin,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!hasAnySitePinConfigured()) {
    return NextResponse.json(
      { error: "Ningún PIN configurado en el servidor" },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { pin?: string };
  const pin = body.pin?.trim() ?? "";
  const profile = verifyPin(pin);

  if (!profile) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    profile: { id: profile.id, displayName: profile.displayName },
  });

  const cookieBase = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  response.cookies.set({
    name: getAuthCookieName(),
    value: createAuthTokenForPin(profile.pin),
    ...cookieBase,
  });
  response.cookies.set({
    name: getProfileCookieName(),
    value: profile.id,
    ...cookieBase,
  });

  return response;
}
