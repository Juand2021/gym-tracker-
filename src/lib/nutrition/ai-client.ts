import OpenAI from "openai";

export type AiClient = {
  client: OpenAI;
  model: string;
  provider: "azure" | "openai";
};

/** Mismo criterio que el Coach IA: Azure primero, OpenAI como respaldo. */
export function getNutritionAiClient(): AiClient | null {
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (azureKey && azureEndpoint) {
    return {
      client: new OpenAI({ apiKey: azureKey, baseURL: azureEndpoint }),
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-mini",
      provider: "azure",
    };
  }
  if (openAiKey) {
    return {
      client: new OpenAI({ apiKey: openAiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      provider: "openai",
    };
  }
  return null;
}

/**
 * Pide al modelo una respuesta que cumpla un JSON Schema estricto y la devuelve parseada.
 * Los modelos gpt-5 no aceptan temperature distinta de 1, por eso no se envía.
 */
export async function structuredCompletion<T>(
  ai: AiClient,
  opts: {
    system: string;
    user: string;
    schemaName: string;
    schema: Record<string, unknown>;
    reasoningEffort?: "minimal" | "low" | "medium" | "high";
  },
): Promise<T> {
  const completion = await ai.client.chat.completions.create({
    model: ai.model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.user },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: opts.schemaName, strict: true, schema: opts.schema },
    },
    ...(opts.reasoningEffort ? { reasoning_effort: opts.reasoningEffort } : {}),
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Respuesta vacía del modelo");
  return JSON.parse(content) as T;
}
