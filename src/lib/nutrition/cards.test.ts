import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardFromTool } from "./cards.ts";

describe("tarjetas del chat", () => {
  it("borrador desde analizar_comida", () => {
    const c = cardFromTool("analizar_comida", {
      borrador_id: "b1",
      fecha: "2026-10-25",
      momento: "almuerzo",
      alimentos: [{ alimento: "arroz", gramos: 180, kcal: 275.4, proteina_g: 5.8, supuesto: "porción típica" }],
      totales: { kcal: 275, protein_g: 5.8 },
      dia_si_se_guarda: { objetivo_kcal: 1880, consumido_kcal: 900 },
    });
    assert.equal(c?.type, "draft");
    if (c?.type !== "draft") return;
    assert.equal(c.items[0].kcal, 275);
    assert.equal(c.items[0].note, "porción típica");
    assert.equal(c.status, "pending");
    assert.equal(c.dayTarget, 1880);
  });
  it("comparación: recomienda la de más proteína por kcal que no se pasa", () => {
    const c = cardFromTool("consultar_opciones", {
      restante_hoy: { restante_kcal: 600 },
      objetivo: "deficit",
      opciones: [
        { opcion: "salchipapa", kcal: 1120, proteina_g: 28 },
        { opcion: "pollo con ensalada", kcal: 490, proteina_g: 47 },
      ],
    });
    assert.equal(c?.type === "compare" && c.best, 1);
  });
  it("sin tarjeta si hubo error o la herramienta no tiene", () => {
    assert.equal(cardFromTool("analizar_comida", { error: "x" }), null);
    assert.equal(cardFromTool("descartar_borrador", { descartado: true }), null);
  });
});
