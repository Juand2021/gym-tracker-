import type { CoreFood, FoodRecord, PortionUnit } from "./types.ts";

/**
 * Convierte lo que dice la persona en gramos, en este orden de confianza:
 *   1. gramos dichos ("300 g de arroz")
 *   2. porción del núcleo colombiano para esa unidad ("1 arepa" → 70 g)
 *   3. porción por defecto del núcleo si no dijo unidad
 *   4. porción del USDA con esa unidad
 *   5. unidad genérica (cucharada 15 g, vaso 250 g…)
 *   6. estimación del modelo de IA (marcada como supuesto)
 */

export type PortionRequest = {
  grams?: number | null;
  /** De dónde salen los gramos: dichos por la persona (por defecto) o de la plantilla del plato. */
  gramsFrom?: "said" | "template";
  quantity?: number | null;
  unit?: PortionUnit | null;
  /** Tamaño dicho: pequeño/mediano/grande. */
  size?: "pequeno" | "mediano" | "grande" | null;
  /** Gramos que estimó el LLM cuando no hay otra fuente. */
  llmGrams?: number | null;
};

export type GramsBasis = "said" | "template" | "core" | "core_default" | "usda" | "generic" | "llm" | "fallback" | "recipe";

export type PortionResult = { grams: number; basis: GramsBasis; note: string };

/** Pesos genéricos para unidades caseras (Colombia). */
export const GENERIC_UNIT_GRAMS: Partial<Record<PortionUnit, number>> = {
  cucharadita: 5,
  cucharada: 15,
  cucharon: 120,
  pocillo: 200,
  taza: 240,
  vaso: 250,
  copa: 150,
  lata: 330,
  botella: 330,
  trago: 30,
  scoop: 30,
  sobre: 10,
  punado: 30,
  tajada: 30,
  rebanada: 25,
  porcion: 150,
  plato: 300,
  bola: 70,
  paquete: 40,
};

const SIZE_FACTOR = { pequeno: 0.7, mediano: 1, grande: 1.4 } as const;

function r(x: number) {
  return Math.round(x);
}

export function resolveGrams(req: PortionRequest, core?: CoreFood, record?: FoodRecord): PortionResult {
  if (req.grams && req.grams > 0) {
    if (req.gramsFrom === "template") return { grams: req.grams, basis: "template", note: "Porción típica del plato" };
    return { grams: req.grams, basis: "said", note: "Gramos que dijiste" };
  }

  const qty = req.quantity && req.quantity > 0 ? req.quantity : 1;
  const size = req.size ? SIZE_FACTOR[req.size] : 1;
  // "media" como unidad = media porción del alimento, salvo que el núcleo la defina (media de aguardiente).
  let unit = req.unit ?? null;

  if (core) {
    const byUnit = unit && core.portions.find((p) => p.unit === unit);
    if (byUnit) return { grams: r(byUnit.grams * qty * size), basis: "core", note: `${qty} ${unit} ≈ ${r(byUnit.grams)} g c/u` };
    if (unit === "media") {
      const def = core.portions.find((p) => p.unit === core.defaultUnit) ?? core.portions[0];
      if (def) return { grams: r(def.grams * 0.5 * qty * size), basis: "core", note: `Media ${core.defaultUnit}` };
    }
    // "3 pericos" sin unidad = 3 unidades (si el alimento se cuenta por unidad).
    if (!unit && req.quantity && req.quantity > 0) {
      const each = core.portions.find((p) => p.unit === "unidad");
      if (each) return { grams: r(each.grams * qty * size), basis: "core", note: `${qty} unidad ≈ ${r(each.grams)} g c/u` };
    }
    if (!unit || unit === "unidad" || unit === "porcion") {
      const def = core.portions.find((p) => p.unit === core.defaultUnit) ?? core.portions[0];
      if (def) return { grams: r(def.grams * qty * size), basis: "core_default", note: `Porción típica: ${r(def.grams)} g` };
    }
  }

  // Fuera del núcleo, el estimado de la IA conoce el plato ("un rollo de sushi") mejor que
  // la pieza genérica del USDA ("1 piece" = 30 g).
  if (!core && req.llmGrams && req.llmGrams > 0 && (!unit || unit === "unidad" || unit === "porcion" || unit === "plato")) {
    return { grams: r(req.llmGrams), basis: "llm", note: "Cantidad estimada por la IA" };
  }

  if (record && (unit || req.quantity)) {
    const usda = unit
      ? record.portions.find((p) => p.unit === unit)
      : (record.portions.find((p) => p.unit === "unidad") ?? record.portions.find((p) => p.unit === "porcion"));
    if (usda) return { grams: r(usda.grams * qty * size), basis: "usda", note: `${usda.label} (USDA)` };
  }

  if (unit === "media") unit = "porcion";
  const generic = unit ? GENERIC_UNIT_GRAMS[unit] : undefined;
  if (generic && !(req.llmGrams && (unit === "porcion" || unit === "plato" || unit === "unidad"))) {
    return { grams: r(generic * qty * size), basis: "generic", note: `${qty} ${unit} ≈ ${generic} g (medida genérica)` };
  }

  if (req.llmGrams && req.llmGrams > 0) return { grams: r(req.llmGrams), basis: "llm", note: "Cantidad estimada por la IA" };

  const typical = record?.portions.find((p) => p.unit === "porcion");
  if (typical) return { grams: r(typical.grams * qty * size), basis: "usda", note: typical.label };

  return { grams: r(150 * qty * size), basis: "fallback", note: "Porción estándar supuesta (150 g)" };
}
