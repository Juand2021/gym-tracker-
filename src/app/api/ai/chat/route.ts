import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  appendChatMessage,
  buildAiContext,
  createChatThread,
  getChatThread,
} from "@/lib/data";
import { profileFromRequest, unauthorized } from "@/lib/request-profile";
import type { ChatMessage } from "@/lib/types";

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

function generateCleanTitle(prompt: string): string {
  const clean = prompt
    .replace(/[¿?¡!]/g, "")
    .trim();
  if (clean.length <= 36) return clean.charAt(0).toUpperCase() + clean.slice(1);
  const words = clean.split(/\s+/);
  return words.slice(0, 5).join(" ") + "...";
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

    const body = (await request.json()) as {
      threadId?: string;
      message: string;
    };

    const userMessage = body.message?.trim();
    if (!userMessage) {
      return NextResponse.json(
        { error: "El mensaje no puede estar vacío" },
        { status: 400 },
      );
    }

    let thread = body.threadId
      ? await getChatThread(profile, body.threadId)
      : null;

    const isNew = !thread;
    if (!thread) {
      const generatedTitle = generateCleanTitle(userMessage);
      thread = await createChatThread(profile, generatedTitle);
    }

    // 1. Guardar mensaje del usuario
    const userAppend = await appendChatMessage(
      profile,
      thread.id,
      { role: "user", content: userMessage },
      isNew ? generateCleanTitle(userMessage) : undefined,
    );

    if (userAppend) {
      thread = userAppend.thread;
    }

    // 2. Construir contexto y memoria conversacional
    const context = await buildAiContext(profile);
    const systemPrompt = [
      "Eres el Coach Inteligente de Entrenamiento y Analítica de Fuerza en Gym Tracker.",
      "Hablas en español con un tono motivador, técnico, directo y estructurado.",
      "Tienes acceso completo en tiempo real a los entrenamientos, pesos reales, orden de ejercicios y métricas calculadas del atleta.",
      "",
      "REGLAS CRÍTICAS DE CONVERSACIÓN Y PRECISIÓN:",
      "1. ADAPTABILIDAD Y CONCISIÓN (MUY IMPORTANTE): Responde en estricta proporción a lo que el usuario pregunta.",
      "   - Si el usuario hace una PREGUNTA CORTA O PUNTUAL (ej: '¿qué agarre uso?', '¿cuánto descanso?', '¿qué músculo trabaja X?', '¿debo usar cinturón?'), da una RESPUESTA CORTA, PRECISA Y DIRECTA (1-3 párrafos o puntos clave). NO vuelvas a re-analizar toda su rutina, NO listes todo su historial y NO agregues información no solicitada.",
      "   - Si el usuario pide un PLAN COMPLETO, AUDITORÍA GLOBAL O RECOMENDACIÓN DE RUTINA (ej: 'diseña una rutina de 4 días', 'analiza mi progreso general', '¿cómo mejoro mi volumen de espalda?'), entonces sí entrega una respuesta amplia y estructurada, usando tablas Markdown (Ejercicio | Series | Reps | RIR | Notas) y justificación biomecánica.",
      "2. MEMORIA CONVERSACIONAL REAL: Mantén el hilo de la conversación. Si el usuario responde a una pregunta o propuesta previa (ej: 'sí, 4 días', 'con mancuernas'), continúa directamente desde ese punto sin reiniciar ni repetir explicaciones previas.",
      "3. SIN RELLENO NI INTRODUCCIONES INNECESARIAS: Ve directo a la respuesta o recomendación sin saludos repetitivos ni frases vacías.",
      "4. CONVENCIONES DE CARGA: Mancuerna = peso de UNA sola; Unilateral/cable = un solo lado; Máquina = peso del pin; Barra = barra + discos.",
      "5. SOBRECARGA REALISTA: Progresiones prudentes (1 a 2.5 kg en torso, 2.5 a 5 kg en pierna) y recomendaciones basadas en RIR y fatiga.",
      "6. FORMATO MARKDOWN: Usa negritas para pesos y ejercicios clave. Usa tablas SOLO cuando sea estrictamente necesario para presentar rutinas completas o esquemas de series.",
    ].join("\n");

    // Tomar los últimos 14 mensajes del hilo para no exceder contexto manteniendo memoria
    const conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string }> = [
      { role: "system", content: `${systemPrompt}\n\n---\nDATOS DE ENTRENAMIENTO DEL ATLETA:\n${context}` },
    ];

    const recentMessages = thread.messages.slice(-14);
    for (const msg of recentMessages) {
      if (msg.role === "user" || msg.role === "assistant") {
        conversationHistory.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 3. Ejecutar llamada al LLM
    let assistantReply = "";

    try {
      // Azure Responses o Chat Completion
      const completion = await ai.client.chat.completions.create({
        model: ai.model,
        temperature: 0.5,
        messages: conversationHistory,
      });

      assistantReply =
        completion.choices[0]?.message?.content?.trim() ||
        "No pude generar una respuesta en este momento.";
    } catch {
      // Fallback a Responses API si está habilitada en Azure
      try {
        const lastInput = `${userMessage}\n\nHistorial previo:\n${recentMessages.map(m => `${m.role}: ${m.content}`).join("\n")}\n\nDatos:\n${context}`;
        const response = await ai.client.responses.create({
          model: ai.model,
          instructions: systemPrompt,
          input: lastInput,
        });

        assistantReply =
          response.output_text?.trim() ||
          "No pude generar una respuesta en este momento.";
      } catch (innerErr) {
        throw innerErr;
      }
    }

    // 4. Guardar respuesta del Coach en el hilo
    const assistantAppend = await appendChatMessage(
      profile,
      thread.id,
      { role: "assistant", content: assistantReply },
    );

    const finalThread = assistantAppend ? assistantAppend.thread : thread;
    const finalAssistantMsg: ChatMessage = assistantAppend
      ? assistantAppend.message
      : {
          id: "temp",
          role: "assistant",
          content: assistantReply,
          createdAt: new Date().toISOString(),
        };

    return NextResponse.json({
      threadId: thread.id,
      thread: finalThread,
      message: finalAssistantMsg,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al procesar mensaje con la IA";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
