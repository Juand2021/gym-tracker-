import { NextResponse } from "next/server";
import { getAuthCookieName, getProfileCookieName, isSecureRequest } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });
  const clear = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureRequest(request),
    path: "/",
    maxAge: 0,
  };
  response.cookies.set({ name: getAuthCookieName(), value: "", ...clear });
  response.cookies.set({ name: getProfileCookieName(), value: "", ...clear });
  return response;
}
