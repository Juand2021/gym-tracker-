import { NextResponse } from "next/server";
import { isQuotaError, QUOTA_MESSAGE } from "@/lib/firebase";

/**
 * Si la base de datos llegó a su límite del día, responde 503 con un mensaje claro
 * (en vez del error técnico "8 RESOURCE_EXHAUSTED"). Si no, devuelve null.
 */
export function quotaResponse(error: unknown): NextResponse | null {
  if (!isQuotaError(error)) return null;
  console.warn("[firestore] cuota diaria agotada:", error instanceof Error ? error.message : error);
  return NextResponse.json({ error: QUOTA_MESSAGE, quota: true }, { status: 503, headers: { "Retry-After": "3600" } });
}
