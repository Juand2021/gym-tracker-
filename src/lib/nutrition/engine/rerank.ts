import { structuredCompletion, type AiClient } from "../ai-client.ts";
import type { ParsedItem, Reranker } from "./pipeline.ts";
import type { FoodRecord } from "./types.ts";

/**
 * Cuando el alimento no está en el núcleo, el modelo elige entre los ~25 candidatos
 * de la búsqueda, o dice que ninguno sirve (mejor preguntar que inventar).
 */
export function makeLlmReranker(ai: AiClient): Reranker {
  return async (item: ParsedItem, candidates: FoodRecord[]) => {
    const list = candidates
      .map((c, i) => `${i}\t${c.name_es || c.name_en}${c.name_es && c.name_en ? ` / ${c.name_en}` : ""}\t${Math.round(c.per100g.kcal)} kcal/100 g`)
      .join("\n");
    const res = await structuredCompletion<{ index: number | null }>(ai, {
      system:
        "Eliges el alimento de la base que mejor corresponde a lo que comió la persona. " +
        "Fíjate en el estado (crudo/cocido) y el método (frito, asado…). Si ninguno corresponde razonablemente, responde null.",
      user: `Comió: ${item.name}${item.name_en ? ` (${item.name_en})` : ""}${item.method ? `, ${item.method}` : ""}${item.state ? `, ${item.state}` : ""}\n\nCandidatos:\n${list}`,
      schemaName: "food_choice",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["index"],
        properties: { index: { anyOf: [{ type: "integer" }, { type: "null" }] } },
      },
      reasoningEffort: "low",
    });
    return res.index === null ? null : (candidates[res.index]?.id ?? null);
  };
}
