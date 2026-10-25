"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AiAnalysis } from "@/components/AiAnalysis";
import { TodaySummary, useComidasToday } from "@/components/comidas/TodaySummary";
import { readSession, writeSession } from "@/lib/client-cache";

type Msg = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
type Chat = { id: string; title: string; messages: Msg[]; createdAt: string; updatedAt: string };
type ChatSummary = { id: string; title: string; updatedAt: string; messageCount: number; lastMessageSnippet: string };

const SESSION_KEY = "comidas:chat";

const EXAMPLES = [
  "Almorcé un corrientazo de cerdo con jugo de mora",
  "Desayuné 2 arepas con huevos pericos y un tinto",
  "¿Cómo voy hoy?",
  "¿Qué me conviene más: una salchipapa o un cuarto de pollo con ensalada?",
];

/** Respuestas rápidas cuando el asistente pregunta si guarda o borra algo. */
function quickRepliesFor(text: string): string[] | null {
  if (/¿\s*lo guardo\s*\?/i.test(text)) return ["Sí, guárdalo", "No lo guardes"];
  if (/¿\s*(la|lo) borro\s*\?|¿\s*de verdad la borro/i.test(text)) return ["Sí, bórrala", "No, déjala"];
  return null;
}

function timeLabel(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

/** Caja de escritura encima de la barra de pestañas o del teclado (igual que en Fuerza). */
function useComposerOffset(): number | null {
  const [offset, setOffset] = useState<number | null>(null);
  useLayoutEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const layoutH = window.innerHeight;
      const keyboard = vv ? Math.max(0, layoutH - (vv.height + vv.offsetTop)) : 0;
      if (keyboard > 80) return setOffset(keyboard + 8);
      const barTop = document.querySelector(".lg-bar")?.getBoundingClientRect().top;
      setOffset(barTop ? Math.max(8, layoutH - barTop + 10) : null);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    const late = window.setTimeout(update, 600);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(late);
    };
  }, []);
  return offset;
}

export default function ComidasChatPage() {
  const [chat, setChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const { data: today } = useComidasToday(refresh);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const composerOffset = useComposerOffset();

  const messages = chat?.messages ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 132)}px`;
  }, [input]);

  // Volver a la conversación abierta y cargar el historial.
  useEffect(() => {
    const saved = readSession<string>(SESSION_KEY);
    if (saved && saved !== "new") {
      fetch(`/api/comidas/chats/${saved}`)
        .then((r) => (r.ok ? (r.json() as Promise<{ chat: Chat }>) : null))
        .then((d) => d && setChat(d.chat))
        .catch(() => undefined);
    }
    fetch("/api/comidas/chats")
      .then((r) => (r.ok ? (r.json() as Promise<{ chats: ChatSummary[] }>) : { chats: [] }))
      .then((d) => setChats(d.chats))
      .catch(() => undefined);
  }, []);

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

  async function send(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    setPending(text);
    setSending(true);
    try {
      const res = await fetch("/api/comidas/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: chat?.id, message: text }),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje");
      setInput(text);
    } finally {
      setPending(null);
      setSending(false);
      setRefresh((n) => n + 1);
    }
  }

  const last = messages[messages.length - 1];
  const quick = !sending && last?.role === "assistant" ? quickRepliesFor(last.content) : null;

  return (
    <div className="ia-page">
      <header className="ia-glass ia-hero">
        <span className="as-icon is-comidas" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className="ia-kicker">Asistente de nutrición</p>
          <h1 className="ia-title">{chat ? chat.title : "Nueva conversación"}</h1>
        </div>
        <div className="ia-hero-actions">
          <button type="button" className="ia-pill" onClick={() => setHistoryOpen(true)}>
            Historial
            {chats.length > 0 ? <span className="ia-badge">{chats.length}</span> : null}
          </button>
          <button type="button" className="ia-pill is-primary" onClick={newChat}>
            + Nuevo
          </button>
        </div>
      </header>

      {today ? <TodaySummary data={today} /> : null}

      {historyOpen ? (
        <div className="ia-drawer-overlay" onClick={() => setHistoryOpen(false)}>
          <aside className="ia-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ia-drawer-head">
              <div>
                <p className="ia-kicker">Comidas</p>
                <p className="ia-drawer-title">Conversaciones</p>
              </div>
              <button type="button" className="rt-icon-btn" onClick={() => setHistoryOpen(false)} aria-label="Cerrar historial">
                ✕
              </button>
            </div>
            <button type="button" className="ia-pill is-primary w-full" onClick={newChat}>
              + Nueva conversación
            </button>
            <div className="ia-thread-list">
              {chats.length === 0 ? (
                <p className="ia-empty-text">Todavía no hay conversaciones.</p>
              ) : (
                chats.map((c) => (
                  <div
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={`ia-glass ia-thread ${c.id === chat?.id ? "is-active" : ""}`}
                    onClick={() => openChat(c.id)}
                    onKeyDown={(e) => e.key === "Enter" && openChat(c.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="ia-thread-title">{c.title}</p>
                      {c.lastMessageSnippet ? <p className="ia-thread-snippet">{c.lastMessageSnippet}</p> : null}
                    </div>
                    <button
                      type="button"
                      className="ia-thread-delete"
                      aria-label="Eliminar conversación"
                      onClick={(e) => {
                        e.stopPropagation();
                        void deleteChat(c.id);
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}

      <section className="ia-feed">
        {messages.length === 0 && !pending ? (
          <>
            <div className="ia-glass ia-welcome">
              <h2 className="ia-welcome-title">¿Qué comiste?</h2>
              <p className="ia-welcome-text">
                Cuéntamelo como hablas. Te muestro las calorías y la proteína, y solo lo guardo cuando me digas que sí.
              </p>
            </div>
            <p className="ia-section-label">Prueba con</p>
            <div className="ia-followups cm-examples">
              {EXAMPLES.map((e) => (
                <button key={e} type="button" className="ia-chip" onClick={() => send(e)}>
                  {e}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="ia-thread-feed">
            {messages.map((m) => (
              <div key={m.id} className={`ia-msg ${m.role === "user" ? "is-user" : "is-coach"}`}>
                <div className="ia-msg-meta">
                  <span className="ia-msg-author">{m.role === "user" ? "Tú" : "Asistente"}</span>
                  <span className="ia-msg-time">{timeLabel(m.createdAt)}</span>
                </div>
                <div className={`ia-bubble ${m.role === "user" ? "is-user" : "ia-glass"}`}>
                  {m.role === "user" ? <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{m.content}</p> : <AiAnalysis content={m.content} />}
                </div>
              </div>
            ))}
            {pending ? (
              <>
                <div className="ia-msg is-user">
                  <div className="ia-bubble is-user">
                    <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{pending}</p>
                  </div>
                </div>
                <div className="ia-msg is-coach">
                  <div className="ia-bubble ia-glass ia-typing">
                    <span className="ia-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    Calculando…
                  </div>
                </div>
              </>
            ) : null}
            {quick ? (
              <div className="ia-followups" aria-label="Respuestas rápidas">
                {quick.map((q, i) => (
                  <button key={q} type="button" className={`ia-chip ${i === 0 ? "is-confirm" : ""}`} onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={endRef} />
          </div>
        )}
        {error ? <div className="ia-error">{error}</div> : null}
      </section>

      <footer className="ia-composer-wrap" style={composerOffset != null ? { bottom: `${composerOffset}px` } : undefined}>
        <div className="ia-composer">
          <textarea
            ref={taRef}
            className="ia-input"
            rows={1}
            placeholder="Cuéntame qué comiste…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            disabled={sending}
            enterKeyHint="send"
          />
          <button type="button" className="ia-send" onClick={() => send()} disabled={!input.trim() || sending} aria-label="Enviar">
            {sending ? (
              <span className="ia-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
