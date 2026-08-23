import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildAiContext } from "@/lib/data";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";

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
  const profile = profileFromRequest(request);
  if (!profile) return unauthorized();

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

    const context = await buildAiContext(profile);
    const instructions = [
      "Eres el Coach Inteligente de Entrenamiento y Fuerza en Gym Tracker.",
      "Hablas en español de forma directa, técnica y útil.",
      "ADAPTABILIDAD: Si la pregunta es corta y puntual, responde directamente en 1-2 párrafos. Si pide un análisis completo, estructura la respuesta en Resumen, Lo que va bien, Qué mejorar y Recomendaciones concretas.",
      "Respeta las convenciones de carga (mancuerna = una sola, máquina = pin, barra = barra + discos).",
      "Respeta el orden de ejecución registrado de cada sesión y no inventes series que no existan.",
      "Responde siempre en Markdown limpio y legible.",
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
