import { structuredCompletion, type AiClient } from "../ai-client.ts";
import { CORE_FOODS, DISH_TEMPLATES } from "./core-foods.ts";
import { expandDish, type MealParser, type ParsedItem } from "./pipeline.ts";
import { PORTION_UNITS } from "./types.ts";

/**
 * Lector de comidas con gpt-5-mini (Structured Outputs estricto).
 * El modelo solo descompone y cuantifica; los nutrientes los calcula el código.
 */

const METHODS = ["frito", "apanado", "salteado", "asado", "plancha", "sudado", "guisado", "hervido", "horneado", "crudo"];
const CORE_KEYS = CORE_FOODS.map((f) => f.key);
const DISH_KEYS = DISH_TEMPLATES.map((d) => d.key);
const SLOTS = [...new Set(DISH_TEMPLATES.flatMap((d) => d.components.map((c) => c.slot)))];

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: "null" }] });

export const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["dishes", "items"],
  properties: {
    dishes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["dish_key", "quantity", "swaps", "omit", "grams_said"],
        properties: {
          dish_key: { type: "string", enum: DISH_KEYS },
          quantity: nullable({ type: "number" }),
          swaps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["slot", "core_key"],
              properties: { slot: { type: "string", enum: SLOTS }, core_key: { type: "string", enum: CORE_KEYS } },
            },
          },
          omit: { type: "array", items: { type: "string", enum: SLOTS } },
          grams_said: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["slot", "grams"],
              properties: { slot: { type: "string", enum: SLOTS }, grams: { type: "number" } },
            },
          },
        },
      },
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "name_en", "core_key", "quantity", "unit", "grams", "size", "state", "method", "confidence", "assumption", "llm_grams"],
        properties: {
          name: { type: "string" },
          name_en: { type: "string" },
          core_key: nullable({ type: "string", enum: CORE_KEYS }),
          quantity: nullable({ type: "number" }),
          unit: nullable({ type: "string", enum: [...PORTION_UNITS] }),
          grams: nullable({ type: "number" }),
          size: nullable({ type: "string", enum: ["pequeno", "mediano", "grande"] }),
          state: nullable({ type: "string", enum: ["crudo", "cocido"] }),
          method: nullable({ type: "string", enum: METHODS }),
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
1. Un ítem por alimento o bebida. No inventes alimentos que no dijo.
2. core_key: usa la clave del catálogo si el alimento corresponde (aunque lo diga distinto). Si nada encaja, null y escribe name_en al estilo USDA (ej. "Chicken thigh, fried") y llm_grams con tu mejor estimado.
3. Cantidades:
   - grams solo si la persona dijo gramos o ml (1 ml = 1 g). Entonces quantity y unit = null.
   - Si no dijo gramos: quantity + unit (unidades del catálogo: unidad, porcion, plato, vaso, pocillo, cucharada, tajada, presa, botella, trago, media…). No conviertas tú a gramos; el código lo hace. grams = null.
   - "media de aguardiente" = quantity 1, unit "media". "media taza" = quantity 0.5, unit "taza". "2 huevos" = quantity 2, unit "unidad".
   - Si NO dijo cantidad ("con aguacate", "arroz con frijoles"), deja quantity = null y unit = null: el código usa la porción típica colombiana. No pongas "1 unidad" por tu cuenta.
   - size: pequeno/mediano/grande solo si lo dijo (o "poquito" = pequeno, "harto" = grande).
4. Platos de la lista (corrientazo, calentado, salchipapa…): NO los descompongas tú. Ponlos en "dishes" con su dish_key; el código agrega los componentes de la plantilla (incluidos los opcionales).
   - swaps: si cambia un componente ("corrientazo de cerdo" → slot proteina = cerdo_asado; "con lentejas" → principio = lentejas; "jugo de lulo" sigue siendo jugo_fruta_agua).
   - omit: componentes que dijo que no hubo ("sin sopa" → sopa; "jugo sin azúcar" → azucar_jugo).
   - grams_said: solo si dio gramos de un componente.
   - quantity: número de platos (null = 1).
   - Lo que pidió aparte del plato (una gaseosa extra, un postre) va en "items".
   - Si la persona enumera todos los ingredientes con sus gramos, ponlos como ítems normales y no uses "dishes".
5. method: solo si lo dijo o el nombre lo implica (frito, apanado, salteado, asado, plancha, sudado…). NO agregues aceite como ítem aparte: el código lo suma según el método. Sí agrega salsas, aderezos, azúcar o aceite si la persona los menciona.
6. "sin azúcar", "sin X": no incluyas X.
7. confidence 0–1: qué tan seguro estás del alimento y la cantidad. assumption: frase corta en español simple si supusiste algo importante (ej. "Supuse arroz blanco"), o null.

Catálogo de alimentos (clave: nombre | cómo lo dicen | porciones):
${coreCatalog()}

Platos (componentes con gramos por defecto):
${dishCatalog()}`;

type RawItem = Omit<ParsedItem, "core_key"> & { core_key: string | null };
type RawDish = {
  dish_key: string;
  quantity: number | null;
  swaps: { slot: string; core_key: string }[];
  omit: string[];
  grams_said: { slot: string; grams: number }[];
};

export function makeLlmParser(ai: AiClient): MealParser {
  return async (text) => {
    const res = await structuredCompletion<{ dishes: RawDish[]; items: RawItem[] }>(ai, {
      system: PARSE_SYSTEM,
      user: text,
      schemaName: "meal_items",
      schema: PARSE_SCHEMA,
      reasoningEffort: "low",
    });
    const fromDishes = res.dishes.flatMap((d) =>
      expandDish(d.dish_key, {
        overrides: Object.fromEntries(d.swaps.map((x) => [x.slot, x.core_key])),
        omit: d.omit,
        grams: Object.fromEntries(d.grams_said.map((x) => [x.slot, x.grams])),
        factor: d.quantity && d.quantity > 0 ? d.quantity : 1,
      }),
    );
    const items = res.items.map((it) => ({ ...it, grams_from: "said" as const, confidence: Math.max(0, Math.min(1, it.confidence ?? 0.7)) }));
    return [...fromDishes, ...items];
  };
}
