"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatCard } from "@/lib/nutrition/cards";
import { readSession, writeSession } from "@/lib/client-cache";
import { NvCompareCard, NvDraftCard, NvPlanCard, NvRecipesCard, NvTargetsCard } from "@/components/nutriverse/NvCards";
import { NvIcon } from "@/components/nutriverse/NvIcon";
import { NvLeaves } from "@/components/nutriverse/NvLogo";
import { NvSheet } from "@/components/nutriverse/NvUi";
import { CHAT_AUTOSEND, CHAT_PREFILL, invalidateNv } from "@/components/nutriverse/data";

type Msg = { id: string; role: "user" | "assistant"; content: string; createdAt: string; cards?: ChatCard[] };
type Chat = { id: string; title: string; messages: Msg[]; createdAt: string; updatedAt: string };
type ChatSummary = { id: string; title: string; updatedAt: string; messageCount: number; lastMessageSnippet: string };

const SESSION_KEY = "nv:chat";

const STARTERS = ["¿Qué como ahora?", "Almorcé un corrientazo de cerdo con jugo de mora", "Desayuné 2 arepas con huevos pericos y un tinto", "¿Cómo voy hoy?", "¿Qué pido: hamburguesa o wrap de pollo?"];

/** Frases que cambian mientras el asistente piensa (~10 s). */
const THINKING = ["Leyendo lo que comiste…", "Buscando los alimentos…", "Calculando porciones…", "Sumando calorías y proteína…", "Casi listo…"];

/** Respuestas rápidas cuando el asistente pregunta algo de sí/no. */
function quickRepliesFor(text: string): string[] | null {
  if (/¿\s*(la|lo) borro\s*\?|¿\s*de verdad la borro/i.test(text)) return ["Sí, bórrala", "No, déjala"];
  return null;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

/** Alto del teclado del iPhone (para subir la caja de escritura). */
function useKeyboard(): number {
  const [kb, setKb] = useState(0);
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setKb(Math.max(0, window.innerHeight - (vv.height + vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return kb > 80 ? kb : 0;
}

function Thinking() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => Math.min(THINKING.length - 1, n + 1)), 2200);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="nv-msg is-assistant">
      <div className="nv-bubble-msg nv-glass nv-thinking" role="status" aria-live="polite">
        <span className="nv-thinking-orb" aria-hidden="true" />
        <span key={i} className="nv-thinking-text">
          {THINKING[i]}
        </span>
      </div>
    </div>
  );
}

export default function NutriVerseChat() {
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const keyboard = useKeyboard();

  const messages = chat?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, sending]);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 132)}px`;
  }, [input]);

  // Abrir: retomar la conversación de la sesión, o empezar con el texto que dejó otra pantalla.
  useEffect(() => {
    const prefill = readSession<string>(CHAT_PREFILL);
    const autosend = readSession<string>(CHAT_AUTOSEND);
    const saved = readSession<string>(SESSION_KEY);
    const t = window.setTimeout(() => {
      // Se borran aquí (no antes) porque en desarrollo React monta los efectos dos veces.
      if (prefill) {
        writeSession(CHAT_PREFILL, "");
        setInput(prefill);
        taRef.current?.focus();
      }
      if (autosend) {
        writeSession(CHAT_AUTOSEND, "");
        void send(autosend, saved && saved !== "new" ? saved : undefined);
      }
    }, 0);
    if (saved && saved !== "new") {
      fetch(`/api/comidas/chats/${saved}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ chat: Chat }>) : null))
        .then((d) => d && setChat((c) => c ?? d.chat))
        .catch(() => undefined);
    }
    fetch("/api/comidas/chats")
      .then((r) => (r.ok ? (r.json() as Promise<{ chats: ChatSummary[] }>) : { chats: [] }))
      .then((d) => setChats(d.chats))
      .catch(() => undefined);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function close() {
    setClosing(true);
    window.setTimeout(() => (window.history.length > 1 ? router.back() : router.push("/comidas")), 260);
  }

  async function openChat(id: string) {
    setHistoryOpen(false);
    writeSession(SESSION_KEY, id);
    const r = await fetch(`/api/comidas/chats/${id}`);
    if (r.ok) setChat(((await r.json()) as { chat: Chat }).chat);
  }

  function newChat() {
    writeSession(SESSION_KEY, "new");
    setChat(null);
    setError(null);
    setHistoryOpen(false);
    taRef.current?.focus();
  }

  async function deleteChat(id: string) {
    await fetch(`/api/comidas/chats/${id}`, { method: "DELETE" });
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (chat?.id === id) newChat();
  }

  async function send(textToSend?: string, chatId?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;
    if (textToSend === undefined) setInput("");
    setError(null);
    setPending(text);
    setSending(true);
    try {
      const res = await fetch("/api/comidas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chatId ?? chat?.id, message: text }),
      });
      const data = (await res.json()) as { chat?: Chat; error?: string };
      if (!res.ok || !data.chat) throw new Error(data.error ?? "No se pudo enviar el mensaje");
      const updated = data.chat;
      setChat(updated);
      writeSession(SESSION_KEY, updated.id);
      setChats((prev) => [
        { id: updated.id, title: updated.title, updatedAt: updated.updatedAt, messageCount: updated.messages.length, lastMessageSnippet: text.slice(0, 90) },
        ...prev.filter((c) => c.id !== updated.id),
      ]);
      // Lo guardado en el chat se ve al volver al Inicio y a las estadísticas.
      invalidateNv("/api/comidas/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
      if (textToSend === undefined) setInput(text);
    } finally {
      setPending(null);
      setSending(false);
    }
  }

  function prefill(text: string) {
    setInput(text);
    window.setTimeout(() => {
      const ta = taRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(text.length, text.length);
    }, 0);
  }

  const last = messages[messages.length - 1];
  const quick = !sending && last?.role === "assistant" ? quickRepliesFor(last.content) : null;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className={`nv-chat ${closing ? "is-closing" : ""}`}>
      <div className="nv-chat-sheet nv-glass is-thick">
        <header className="nv-chat-head">
          <button type="button" className="nv-icon-btn nv-press" onClick={close} aria-label="Cerrar el chat">
            <NvIcon name="close" size={30} />
          </button>
          <div className="nv-chat-title">
            <p className="nv-kicker">Asistente NutriVerse</p>
            <h1 className="nv-h2">{chat ? chat.title : "Nueva conversación"}</h1>
          </div>
          <button type="button" className="nv-icon-btn nv-press nv-has-badge" onClick={() => setHistoryOpen(true)} aria-label="Conversaciones anteriores">
            <NvIcon name="history" size={28} />
            {chats.length ? <span className="nv-badge">{chats.length}</span> : null}
          </button>
          <button type="button" className="nv-icon-btn nv-press" onClick={newChat} aria-label="Conversación nueva">
            <NvIcon name="edit" size={26} />
          </button>
        </header>

        <div className="nv-chat-scroll" style={{ paddingBottom: `calc(${keyboard}px + 6.5rem + env(safe-area-inset-bottom))` }}>
          {messages.length === 0 && !pending ? (
            <div className="nv-chat-empty nv-rise">
              <span className="nv-chat-empty-logo nv-glass is-thick">
                <NvLeaves size={54} animated />
              </span>
              <h2 className="nv-title">Cuéntame qué comiste</h2>
              <p className="nv-sub">Escríbelo como lo dirías. Yo calculo las calorías y te pregunto antes de guardar.</p>
              <div className="nv-chips">
                {STARTERS.map((s, i) => (
                  <button key={s} type="button" className="nv-chip-btn nv-glass is-thin nv-press nv-rise" style={{ ["--i" as string]: i + 1 }} onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div key={m.id} className={`nv-msg is-${m.role}`}>
              {m.content ? (
                <div className={`nv-bubble-msg nv-glass ${m.role === "user" ? "is-green is-user" : "is-read"}`}>
                  <p>{m.content}</p>
                  <span className="nv-msg-time">{timeLabel(m.createdAt)}</span>
                </div>
              ) : null}
              {m.cards?.map((c, i) => (
                <div key={i} className="nv-msg-card">
                  {c.type === "draft" ? (
                    <NvDraftCard
                      card={c}
                      latest={m === lastAssistant}
                      busy={sending}
                      onSave={() => void send("Sí, guárdalo")}
                      onFix={() => prefill("Corrige: ")}
                      onDiscard={() => void send("No lo guardes")}
                    />
                  ) : c.type === "plan" ? (
                    <NvPlanCard card={c} onPick={(t) => prefill(`Comí ${t}`)} />
                  ) : c.type === "compare" ? (
                    <NvCompareCard card={c} />
                  ) : c.type === "recipes" ? (
                    <NvRecipesCard card={c} />
                  ) : (
                    <NvTargetsCard card={c} />
                  )}
                </div>
              ))}
            </div>
          ))}

          {pending ? (
            <>
              <div className="nv-msg is-user">
                <div className="nv-bubble-msg nv-glass is-green is-user is-pending">
                  <p>{pending}</p>
                </div>
              </div>
              <Thinking />
            </>
          ) : null}

          {quick ? (
            <div className="nv-chips is-quick">
              {quick.map((q) => (
                <button key={q} type="button" className="nv-chip-btn nv-glass is-thin nv-press" onClick={() => void send(q)}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <p className="nv-chat-error" role="alert">
              {error}
            </p>
          ) : null}
          <div ref={endRef} />
        </div>

        <form
          className="nv-composer nv-glass is-thick"
          style={{ bottom: `calc(${keyboard ? `${keyboard + 8}px` : "0.75rem + env(safe-area-inset-bottom)"})` }}
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <textarea
            ref={taRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Ej.: almorcé arroz, pollo y ensalada"
            aria-label="Mensaje"
            className="nv-composer-input"
            enterKeyHint="send"
          />
          <button type="submit" className="nv-send nv-glass is-green nv-press" disabled={!input.trim() || sending} aria-label="Enviar">
            <NvIcon name="send" size={22} tone="white" />
          </button>
        </form>
      </div>

      <NvSheet open={historyOpen} onClose={() => setHistoryOpen(false)} title="Conversaciones">
        <button type="button" className="nv-btn nv-glass is-green nv-press nv-block" onClick={newChat}>
          <NvIcon name="plus" size={18} tone="white" /> Nueva conversación
        </button>
        <div className="nv-list">
          {chats.length === 0 ? <p className="nv-sub">Todavía no hay conversaciones.</p> : null}
          {chats.map((c) => (
            <div key={c.id} className={`nv-list-item nv-glass is-thin ${c.id === chat?.id ? "is-on" : ""}`}>
              <button type="button" className="nv-list-main nv-press" onClick={() => void openChat(c.id)}>
                <span className="nv-list-title">{c.title}</span>
                {c.lastMessageSnippet ? <span className="nv-list-sub">{c.lastMessageSnippet}</span> : null}
              </button>
              <button type="button" className="nv-icon-btn nv-press" aria-label="Borrar conversación" onClick={() => void deleteChat(c.id)}>
                <NvIcon name="trash" size={22} />
              </button>
            </div>
          ))}
        </div>
      </NvSheet>
    </div>
  );
}
