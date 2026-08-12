import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAiContext } from "@/lib/data";

function getAiClient() {
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const openAiKey = process.env.OPENAI_API_KEY;

  if (azureKey && azureEndpoint) {
    return {
      client: new OpenAI({
        apiKey: azureKey,
        baseURL: azureEndpoint,
      }),
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-mini",
      provider: "azure" as const,
    };
  }

  if (openAiKey) {
    return {
      client: new OpenAI({ apiKey: openAiKey }),
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      provider: "openai" as const,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const ai = getAiClient();
    if (!ai) {
      return NextResponse.json(
        {
          error:
            "IA no configurada. Añade AZURE_OPENAI_API_KEY + AZURE_OPENAI_ENDPOINT (o OPENAI_API_KEY) en .env.local.",
        },
        { status: 503 },
      );
    }

    const body = (await request.json()) as { question?: string };
    const question =
      body.question?.trim() ||
      "Analiza mi progreso, si estoy estancado y qué debería cambiar en mi rutina.";

    const context = await buildAiContext();
    const instructions = [
      "Eres un entrenador de fuerza práctico y claro.",
      "Hablas en español, de forma directa y útil para un principiante/intermedio.",
      "Usa solo los datos del historial del usuario.",
      "Responde siempre en Markdown limpio y legible.",
      "Usa exactamente estas secciones con encabezados ## :",
      "## Resumen",
      "## Lo que va bien",
      "## Qué mejorar",
      "## Recomendaciones",
      "En 'Lo que va bien' y 'Qué mejorar' usa listas con viñetas.",
      "En 'Recomendaciones' usa lista numerada con acciones concretas (cargas, reps, ejercicios, frecuencia).",
      "Puedes usar **negritas** para ejercicios, pesos o cifras clave.",
      "No uses HTML. No envuelvas toda la respuesta en un bloque de código.",
      "Si hay pocos datos, dilo en el resumen y da consejos generales prudentes.",
      "No inventes series o pesos que no aparezcan en el historial.",
      "Respeta la convención de pesos del usuario (mancuerna = una sola, no sumes pares).",
      "Respecta el ORDEN DE EJECUCIÓN de cada sesión: el listado va de primero a último tal como entrenó.",
      "En espalda, lo normal es empezar por dominadas/jalón/remo y cerrar con bíceps/antebrazo; no digas que empezó por bíceps si esos ejercicios aparecen al final.",
      "Si comentas el orden de la rutina, usa la secuencia numerada de la sesión o de la plantilla.",
    ].join(" ");

    const input = `${question}\n\n---\nDATOS:\n${context}`;

    // Azure Foundry / Responses API (como en tu ejemplo)
    try {
      const response = await ai.client.responses.create({
        model: ai.model,
        instructions,
        input,
      });

      const analysis =
        response.output_text?.trim() ||
        "No pude generar un análisis.";

      return NextResponse.json({ analysis, provider: ai.provider });
    } catch {
      // Fallback a chat.completions si responses no está disponible
      const completion = await ai.client.chat.completions.create({
        model: ai.model,
        temperature: 0.4,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: input },
        ],
      });

      const analysis =
        completion.choices[0]?.message?.content?.trim() ||
        "No pude generar un análisis.";

      return NextResponse.json({ analysis, provider: ai.provider });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
