import { randomUUID } from "node:crypto";
import type OpenAI from "openai";
import type { Profile } from "@/lib/profiles";
import { getNutritionAiClient, type AiClient } from "./ai-client.ts";
import { NUTRITION_PROMPT, NUTRITION_TOOLS, buildNutritionContext, runNutritionTool, type ToolContext } from "./chat-tools.ts";
import { getNutritionStore, makeToolContext } from "./server.ts";
import { cardFromTool, type ChatCard } from "./cards.ts";
import type { ComidasChat, ComidasChatMessage } from "./store.ts";

/**
 * Chatbot de la app de Comidas: independiente del Coach de Fuerza (/ia).
 * Registra comidas con las herramientas de chat-tools.ts.
 */

type ChatMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

/** Personalidad del asistente; el nombre es el de quien está usando la app. */
const systemFor = (name: string) => `Eres el asistente de nutrición de ${name} en su app de comida saludable (aparte de su app de gimnasio Fuerza).
Hablas en español de Colombia, simple, cercano y directo. Explica sin tecnicismos: muchas personas son nuevas en nutrición.
Tu trabajo: conocer su objetivo, decirle cuánto y qué comer, registrar lo que come y bebe, y decirle cómo va.
No das consejos médicos; si menciona enfermedades, embarazo, trastornos de la conducta alimentaria o síntomas, sugiere consultar a un profesional de salud.
${NUTRITION_PROMPT}`;

const titleFrom = (text: string) => {
  const clean = text.replace(/[¿?¡!]/g, "").trim();
  return clean.length <= 36 ? clean.charAt(0).toUpperCase() + clean.slice(1) : `${clean.split(/\s+/).slice(0, 5).join(" ")}...`;
};

type ToolEvent = { name: string; args: Record<string, unknown>; result: Record<string, unknown> };

/** Modelo + herramientas, máximo 5 rondas. Devuelve el texto y lo que hicieron las herramientas. */
async function runWithTools(ai: AiClient, messages: ChatMsg[], toolCtx: ToolContext): Promise<{ reply: string; events: ToolEvent[] }> {
  const events: ToolEvent[] = [];
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
    if (!calls.length) return { reply: msg.content?.trim() || "No pude generar una respuesta en este momento.", events };
    messages.push({ role: "assistant", content: msg.content ?? "", tool_calls: calls });
    for (const call of calls) {
      let result: Record<string, unknown>;
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}");
        result = await runNutritionTool(call.function.name, args, toolCtx);
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "Error en la herramienta" };
      }
      events.push({ name: call.function.name, args, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return { reply: "No pude terminar de procesar eso. ¿Me lo repites?", events };
}

/** Actualiza el estado de las tarjetas de borrador ya mostradas (guardado / descartado). */
function settleDraftCards(chat: ComidasChat, events: ToolEvent[]) {
  for (const e of events) {
    const id = String(e.args.borrador_id ?? "");
    const status = e.name === "guardar_comida" && e.result.guardada ? "saved" : e.name === "descartar_borrador" && e.result.descartado ? "discarded" : null;
    if (!id || !status) continue;
    for (const m of chat.messages) for (const c of m.cards ?? []) if (c.type === "draft" && c.draftId === id) c.status = status;
  }
}

export class ComidasChatError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Agrega el mensaje de la persona, responde y guarda la conversación. */
export async function sendComidasMessage(profile: Profile, chatId: string | null, text: string): Promise<ComidasChat> {
  const ai = getNutritionAiClient();
  if (!ai) throw new ComidasChatError("IA no configurada: faltan las variables de Azure OpenAI.", 503);
  const store = getNutritionStore(profile);
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
    { role: "system", content: `${systemFor(profile.displayName)}\n\n---\n${context}` },
    ...chat.messages.slice(-14).map((m) => ({ role: m.role, content: m.content }) as ChatMsg),
  ];
  const { reply, events } = await runWithTools(ai, messages, toolCtx);
  settleDraftCards(chat, events);
  // Una tarjeta por borrador (la última versión si se corrigió en el mismo turno) y una por tipo para lo demás.
  const cards: ChatCard[] = [];
  for (const e of events) {
    const card = cardFromTool(e.name, e.result);
    if (!card) continue;
    const same = cards.findIndex((c) => c.type === card.type && (c.type !== "draft" || (card.type === "draft" && c.draftId === card.draftId)));
    if (same >= 0) cards[same] = card;
    else cards.push(card);
  }

  chat.messages.push({ id: randomUUID(), role: "assistant", content: reply, createdAt: now(), ...(cards.length ? { cards } : {}) });
  chat.updatedAt = now();
  await store.saveChat(chat);
  return chat;
}
