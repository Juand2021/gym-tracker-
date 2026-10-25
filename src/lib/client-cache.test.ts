import assert from "node:assert/strict";
import { describe, it } from "node:test";

// sessionStorage simulado para Node
const store = new Map<string, string>();
(globalThis as unknown as { window: unknown }).window = {
  sessionStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  },
};

const { clearSession, fetchJsonCached, invalidateCachedJson, isCachedFresh, readCachedJson, readSession, writeSession } = await import(
  "./client-cache.ts"
);

describe("client-cache", () => {
  it("guarda y lee valores de la sesión", () => {
    writeSession("historial:filter", "pecho");
    assert.equal(readSession("historial:filter"), "pecho");
    assert.equal(readSession("no-existe"), undefined);
  });

  it("invalida una URL y sus subrutas", () => {
    writeSession("data:/api/workouts", { workouts: [] });
    writeSession("data:/api/workouts/abc", { workout: {} });
    writeSession("data:/api/body-weight", { entries: [] });
    invalidateCachedJson("/api/workouts");
    assert.equal(readCachedJson("/api/workouts"), undefined);
    assert.equal(readCachedJson("/api/workouts/abc"), undefined);
    assert.deepEqual(readCachedJson("/api/body-weight"), { entries: [] });
  });

  it("cerrar sesión borra toda la memoria", () => {
    writeSession("ia:thread", "t1");
    clearSession();
    assert.equal(readSession("ia:thread"), undefined);
    assert.equal(store.size, 0);
  });

  it("no vuelve a pedir una URL guardada hace menos de 60 s, y sí después de invalidarla", async () => {
    clearSession();
    let calls = 0;
    (globalThis as unknown as { fetch: unknown }).fetch = async () => {
      calls++;
      return { ok: true, status: 200, json: async () => ({ workouts: [calls] }) };
    };
    const a = await fetchJsonCached<{ workouts: number[] }>("/api/workouts");
    const b = await fetchJsonCached<{ workouts: number[] }>("/api/workouts");
    assert.equal(calls, 1);
    assert.equal(b.fromCache, true);
    assert.deepEqual(b.data, a.data);
    assert.equal(isCachedFresh("/api/workouts", 60_000, Date.now() + 61_000), false);
    invalidateCachedJson("/api/workouts");
    await fetchJsonCached("/api/workouts");
    assert.equal(calls, 2);
  });

  it("si el servidor falla no guarda la respuesta de error", async () => {
    clearSession();
    (globalThis as unknown as { fetch: unknown }).fetch = async () => ({ ok: false, status: 503, json: async () => ({ error: "límite" }) });
    const r = await fetchJsonCached("/api/body-weight");
    assert.equal(r.ok, false);
    assert.equal(r.status, 503);
    assert.equal(readCachedJson("/api/body-weight"), undefined);
  });
});
