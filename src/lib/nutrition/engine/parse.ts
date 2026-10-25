import { structuredCompletion, type AiClient } from "../ai-client.ts";
import { CORE_FOODS, DISH_TEMPLATES } from "./core-foods.ts";
import type { MealParser, ParsedItem } from "./pipeline.ts";
import { PORTION_UNITS } from "./types.ts";

/**
 * Lector de comidas con gpt-5-mini (Structured Outputs estricto).
 * El modelo solo descompone y cuantifica; los nutrientes los calcula el código.
 */

const METHODS = ["frito", "apanado", "salteado", "asado", "plancha", "sudado", "guisado", "hervido", "horneado", "crudo"];
const CORE_KEYS = CORE_FOODS.map((f) => f.key);

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

export const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "name_en", "core_key", "quantity", "unit", "grams", "grams_from", "size", "state", "method", "from_dish", "confidence", "assumption", "llm_grams"],
        properties: {
          name: { type: "string" },
          name_en: { type: "string" },
          core_key: nullable({ type: "string", enum: CORE_KEYS }),
          quantity: nullable({ type: "number" }),
          unit: nullable({ type: "string", enum: [...PORTION_UNITS] }),
          grams: nullable({ type: "number" }),
          grams_from: nullable({ type: "string", enum: ["said", "template"] }),
          size: nullable({ type: "string", enum: ["pequeno", "mediano", "grande"] }),
          state: nullable({ type: "string", enum: ["crudo", "cocido"] }),
          method: nullable({ type: "string", enum: METHODS }),
          from_dish: nullable({ type: "string" }),
          confidence: { type: "number" },
          assumption: nullable({ type: "string" }),
          llm_grams: nullable({ type: "number" }),
        },
      },
    },
  },
};

function coreCatalog(): string {
  return CORE_FOODS.map((f) => {
    const units = f.portions.map((p) => `${p.unit} ${p.grams} g`).join(", ");
    return `${f.key}: ${f.name} | dicen: ${f.aliases.slice(0, 4).join(", ")} | ${units}`;
  }).join("\n");
}

function dishCatalog(): string {
  return DISH_TEMPLATES.map(
    (d) =>
      `${d.key} (${d.aliases.slice(0, 3).join(", ")}): ` +
      d.components.map((c) => `${c.slot}=${c.coreKey} ${c.grams} g${c.optional ? " (opcional)" : ""}${c.alternatives ? ` [o ${c.alternatives.join("/")}]` : ""}`).join("; "),
  ).join("\n");
}

export const PARSE_SYSTEM = `Eres el lector de comidas de una app de nutrición para un usuario colombiano.
Recibes lo que comió, escrito como habla (español de Colombia), y lo separas en alimentos individuales.

Reglas:
1. Un ítem por alimento o bebida. No inventes alimentos que no dijo, salvo los componentes de un plato de la lista de platos.
2. core_key: usa la clave del catálogo si el alimento corresponde (aunque lo diga distinto). Si nada encaja, null y escribe name_en al estilo USDA (ej. "Chicken thigh, fried") y llm_grams con tu mejor estimado.
3. Cantidades:
   - grams solo si la persona dijo gramos o ml (1 ml = 1 g). Entonces grams_from = "said", quantity y unit = null.
   - Si no dijo gramos: quantity + unit (unidades del catálogo: unidad, porcion, plato, vaso, pocillo, cucharada, tajada, presa, botella, trago, media…). No conviertas tú a gramos; el código lo hace. grams = null.
   - "media de aguardiente" = quantity 1, unit "media". "media taza" = quantity 0.5, unit "taza". "2 huevos" = quantity 2, unit "unidad".
   - size: pequeno/mediano/grande solo si lo dijo.
4. Platos de la lista (corrientazo, calentado, salchipapa…): devuelve sus componentes como ítems separados, cada uno con from_dish = clave del plato, grams = gramos de la plantilla y grams_from = "template". Si la persona cambia un componente ("con cerdo"), usa la alternativa; si dice "sin sopa", omítelo. Los opcionales se incluyen salvo que diga que no. Si da gramos de un componente, usa esos con grams_from = "said".
5. method: solo si lo dijo o el nombre lo implica (frito, apanado, salteado, asado, plancha, sudado…). NO agregues aceite como ítem aparte: el código lo suma según el método. Sí agrega salsas, aderezos, azúcar o aceite si la persona los menciona.
6. "sin azúcar", "sin X": no incluyas X.
7. confidence 0–1: qué tan seguro estás del alimento y la cantidad. assumption: frase corta en español simple si supusiste algo importante (ej. "Supuse arroz blanco"), o null.

Catálogo de alimentos (clave: nombre | cómo lo dicen | porciones):
${coreCatalog()}

Platos (componentes con gramos por defecto):
${dishCatalog()}`;

type RawItem = Omit<ParsedItem, "core_key"> & { core_key: string | null };

export function makeLlmParser(ai: AiClient): MealParser {
  return async (text) => {
    const res = await structuredCompletion<{ items: RawItem[] }>(ai, {
      system: PARSE_SYSTEM,
      user: text,
      schemaName: "meal_items",
      schema: PARSE_SCHEMA,
      reasoningEffort: "low",
    });
    return res.items.map((it) => ({ ...it, confidence: Math.max(0, Math.min(1, it.confidence ?? 0.7)) }));
  };
}
