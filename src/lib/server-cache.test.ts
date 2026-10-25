import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cachedRead, clearServerCache, forgetCached } from "./server-cache.ts";
import { isQuotaError } from "./firebase.ts";

describe("caché del servidor", () => {
  it("no vuelve a leer dentro de la ventana y sí tras olvidar el perfil", async () => {
    clearServerCache();
    let reads = 0;
    const load = async () => ++reads;
    assert.equal(await cachedRead("juan:workouts:80", load), 1);
    assert.equal(await cachedRead("juan:workouts:80", load), 1);
    forgetCached("laura");
    assert.equal(await cachedRead("juan:workouts:80", load), 1);
    forgetCached("juan");
    assert.equal(await cachedRead("juan:workouts:80", load), 2);
  });

  it("vence después del tiempo indicado", async () => {
    clearServerCache();
    let reads = 0;
    await cachedRead("juan:x", async () => ++reads, 0);
    await cachedRead("juan:x", async () => ++reads, 0);
    assert.equal(reads, 2);
  });

  it("un error no se guarda: el siguiente pedido vuelve a intentar", async () => {
    clearServerCache();
    await assert.rejects(cachedRead("juan:y", async () => Promise.reject(new Error("falló"))));
    assert.equal(await cachedRead("juan:y", async () => "ok"), "ok");
  });
});

describe("cuota de Firestore", () => {
  it("reconoce el error de cuota agotada", () => {
    assert.equal(isQuotaError(Object.assign(new Error("8 RESOURCE_EXHAUSTED: Quota exceeded."), { code: 8 })), true);
    assert.equal(isQuotaError(new Error("8 RESOURCE_EXHAUSTED: Quota exceeded.")), true);
    assert.equal(isQuotaError({ code: "resource-exhausted" }), true);
    assert.equal(isQuotaError(new Error("No encontrado")), false);
    assert.equal(isQuotaError(null), false);
  });
});
