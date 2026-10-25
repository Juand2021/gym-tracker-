import { randomUUID } from "node:crypto";
import type OpenAI from "openai";
import type { Profile } from "@/lib/profiles";
import { getNutritionAiClient, type AiClient } from "./ai-client.ts";
import { NUTRITION_PROMPT, NUTRITION_TOOLS, buildNutritionContext, runNutritionTool, type ToolContext } from "./chat-tools.ts";
import { getNutritionStore, makeToolContext } from "./server.ts";
import type { ComidasChat, ComidasChatMessage } from "./store.ts";

/**
 * Chatbot de la app de Comidas: independiente del Coach de Fuerza (/ia).
 * Registra comidas con las herramientas de chat-tools.ts.
 */

type ChatMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const SYSTEM = `Eres el asistente de nutrición de Juan en su app de comida saludable (aparte de su app de gimnasio Fuerza).
Hablas en español de Colombia, simple, cercano y directo. Juan es nuevo en nutrición: explica sin tecnicismos.
Tu trabajo: registrar lo que come y bebe, decirle cómo va su día y ayudarle a decidir qué comer según su fase.
No das consejos médicos; si menciona síntomas o algo del pecho, sugiere consultar a un médico.
${NUTRITION_PROMPT}`;

const titleFrom = (text: string) => {
  const clean = text.replace(/[¿?¡!]/g, "").trim();
  return clean.length <= 36 ? clean.charAt(0).toUpperCase() + clean.slice(1) : `${clean.split(/\s+/).slice(0, 5).join(" ")}...`;
};

/** Modelo + herramientas, máximo 5 rondas. */
async function runWithTools(ai: AiClient, messages: ChatMsg[], toolCtx: ToolContext): Promise<string> {
  for (let round = 0; round < 5; round++) {
    const completion = await ai.client.chat.completions.create({
      model: ai.model,
      // gpt-5 no acepta temperature; con herramientas basta razonamiento bajo.
      ...(/^gpt-5/i.test(ai.model) ? { reasoning_effort: "low" as const } : { temperature: 0.4 }),
      messages,
      tools: NUTRITION_TOOLS,
    });
    const msg = completion.choices[0]?.message;
    if (!msg) break;
    const calls = msg.tool_calls?.filter((c) => c.type === "function") ?? [];
    if (!calls.length) return msg.content?.trim() || "No pude generar una respuesta en este momento.";
    messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
    for (const call of calls) {
      let result: Record<string, unknown>;
      try {
        result = await runNutritionTool(call.function.name, JSON.parse(call.function.arguments || "{}"), toolCtx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Error en la herramienta" };
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return "No pude terminar de procesar eso. ¿Me lo repites?";
}

export class ComidasChatError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Agrega el mensaje de Juan, responde y guarda la conversación. */
export async function sendComidasMessage(profile: Profile, chatId: string | null, text: string): Promise<ComidasChat> {
  const ai = getNutritionAiClient();
  if (!ai) throw new ComidasChatError("IA no configurada: faltan las variables de Azure OpenAI.", 503);
  const store = getNutritionStore();
  const now = () => new Date().toISOString();

  let chat = chatId ? await store.getChat(chatId) : null;
  if (!chat) chat = { id: randomUUID(), title: titleFrom(text), messages: [], createdAt: now(), updatedAt: now() };

  const userMsg: ComidasChatMessage = { id: randomUUID(), role: "user", content: text, createdAt: now() };
  chat.messages.push(userMsg);
  await store.saveChat({ ...chat, updatedAt: now() });

  const toolCtx = await makeToolContext(profile, chat.id, randomUUID());
  if (!toolCtx) throw new ComidasChatError("La base de alimentos no está disponible todavía.", 503);
  const context = await buildNutritionContext(toolCtx);

  const messages: ChatMsg[] = [
    { role: "system", content: `${SYSTEM}\n\n---\n${context}` },
    ...chat.messages.slice(-14).map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
  ];
  const reply = await runWithTools(ai, messages, toolCtx);

  chat.messages.push({ id: randomUUID(), role: "assistant", content: reply, createdAt: now() });
  chat.updatedAt = now();
  await store.saveChat(chat);
  return chat;
}
