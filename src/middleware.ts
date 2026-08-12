import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE = "gym_auth";
const PROFILE_COOKIE = "gym_profile";

type EdgeProfile = {
  id: string;
  pin: string;
};

function getEdgeProfiles(): EdgeProfile[] {
  const profiles: EdgeProfile[] = [];
  const juanPin = process.env.SITE_PIN?.trim();
  if (juanPin) profiles.push({ id: "juan", pin: juanPin });
  const lauraPin = (process.env.SITE_PIN_LAURA ?? "2026").trim();
  if (lauraPin) profiles.push({ id: "laura", pin: lauraPin });
  return profiles;
}

async function createAuthToken(pin: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("gym-tracker-auth"),
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function tokensMatch(
  token: string | undefined,
  pin: string,
): Promise<boolean> {
  if (!token) return false;
  const expected = await createAuthToken(pin);
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

async function resolveSession(
  authToken: string | undefined,
  profileId: string | undefined,
): Promise<EdgeProfile | null> {
  if (!authToken || !profileId) return null;
  const profile = getEdgeProfiles().find((p) => p.id === profileId);
  if (!profile) return null;
  if (!(await tokensMatch(authToken, profile.pin))) return null;
  return profile;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const profiles = getEdgeProfiles();

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (profiles.length === 0) {
    if (pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  const authToken = request.cookies.get(AUTH_COOKIE)?.value;
  const profileId = request.cookies.get(PROFILE_COOKIE)?.value;
  const session = await resolveSession(authToken, profileId);

  if (isPublic) {
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-gym-profile", session.id);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
