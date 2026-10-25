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

const { clearSession, invalidateCachedJson, readCachedJson, readSession, writeSession } = await import(
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
});
