"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AiAnalysis } from "@/components/AiAnalysis";
import { formatShortDate } from "@/lib/exercise-history";
import type { ChatMessage, ChatThread, ChatThreadSummary } from "@/lib/types";

/* Íconos de línea (sin emojis, coherentes con el resto de la app) */
const ICONS: Record<string, ReactNode> = {
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  pause: <path d="M10 4H6v16h4zM18 4h-4v16h4z" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  swap: <path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  stack: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  heart: <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z" />,
};

function Icon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

const SUGGESTIONS: Array<{ tag: string; icon: keyof typeof ICONS; text: string }> = [
  { tag: "Progreso", icon: "trend", text: "¿Cómo va mi progreso general de fuerza y sobrecarga?" },
  { tag: "Estancamiento", icon: "pause", text: "¿Estoy estancado en algún ejercicio de mi rutina?" },
  { tag: "Rutina", icon: "calendar", text: "Recomiéndame una rutina de 4 días enfocada en hipertrofia" },
  { tag: "Variantes", icon: "swap", text: "¿Debería rotar o sustituir algún ejercicio de espalda?" },
];

const CAPABILITIES: Array<{ icon: keyof typeof ICONS; title: string; text: string }> = [
  { icon: "bolt", title: "1RM y marcas", text: "Fuerza estimada por ejercicio" },
  { icon: "stack", title: "Volumen", text: "Carga semanal por músculo" },
  { icon: "heart", title: "Recuperación", text: "Frecuencia y descargas" },
];

const FOLLOW_UPS = [
  "Sí, genera el plan detallado",
  "¿Qué ejercicios accesorios recomiendas?",
  "¿Cómo ajusto mis cargas la próxima semana?",
  "¿Necesito una semana de descarga?",
];

/** "3 oct · 14:05" en la hora local del teléfono. */
function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${formatShortDate(local)} · ${time}`;
}

/**
 * Distancia (px) desde el borde inferior para la caja de escritura: justo
 * encima de la barra de pestañas o, con el teclado abierto, encima del teclado.
 */
function useComposerOffset(): number | null {
  const [offset, setOffset] = useState<number | null>(null);

  useLayoutEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const layoutH = window.innerHeight;
      const keyboard = vv ? Math.max(0, layoutH - (vv.height + vv.offsetTop)) : 0;
      if (keyboard > 80) {
        setOffset(keyboard + 8);
        return;
      }
      const bar = document.querySelector(".lg-bar");
      const barTop = bar?.getBoundingClientRect().top;
      setOffset(barTop ? Math.max(8, layoutH - barTop + 10) : null);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    // La barra puede reacomodarse un instante después de cargar (iOS)
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

export default function IaPage() {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerOffset = useComposerOffset();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  useEffect(() => {
    fetchThreads();
  }, []);

  // La caja crece con el texto (hasta ~5 líneas)
  useLayoutEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 132)}px`;
  }, [input]);

  async function fetchThreads() {
    setLoadingThreads(true);
    try {
      const res = await fetch("/api/ai/threads");
      if (!res.ok) throw new Error("Error al cargar historial de conversaciones");
      const data = (await res.json()) as { threads: ChatThreadSummary[] };
      setThreads(data.threads || []);

      if (data.threads && data.threads.length > 0 && !activeThreadId) {
        loadThread(data.threads[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadThread(threadId: string) {
    setActiveThreadId(threadId);
    setLoadingChat(true);
    setError(null);
    setIsSidebarOpen(false);
    try {
      const res = await fetch(`/api/ai/threads/${threadId}`);
      if (!res.ok) throw new Error("No se pudo cargar la conversación");
      const data = (await res.json()) as { thread: ChatThread };
      setActiveThread(data.thread);
      setMessages(data.thread.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar chat");
    } finally {
      setLoadingChat(false);
    }
  }

  function startNewChat() {
    setActiveThreadId(null);
    setActiveThread(null);
    setMessages([]);
    setError(null);
    setIsSidebarOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }

  async function deleteThread(threadId: string, event: React.MouseEvent) {
    event.stopPropagation();
    try {
      const res = await fetch(`/api/ai/threads/${threadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar conversación");
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        startNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function sendMessage(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    setInput("");
    setError(null);

    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: activeThreadId || undefined,
          message: text,
        }),
      });

      const data = (await res.json()) as {
        threadId?: string;
        thread?: ChatThread;
        message?: ChatMessage;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Error al comunicarse con el Coach");
      }

      if (data.thread) {
        setActiveThreadId(data.thread.id);
        setActiveThread(data.thread);
        setMessages(data.thread.messages || []);

        setThreads((prev) => {
          const exists = prev.some((t) => t.id === data.thread!.id);
          if (exists) {
            return prev.map((t) =>
              t.id === data.thread!.id
                ? {
                    ...t,
                    title: data.thread!.title,
                    updatedAt: data.thread!.updatedAt,
                    messageCount: data.thread!.messages.length,
                    lastMessageSnippet: text.slice(0, 90),
                  }
                : t,
            );
          }
          return [
            {
              id: data.thread!.id,
              title: data.thread!.title,
              createdAt: data.thread!.createdAt,
              updatedAt: data.thread!.updatedAt,
              messageCount: data.thread!.messages.length,
              lastMessageSnippet: text.slice(0, 90),
            },
            ...prev,
          ];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar mensaje");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const lastIsAssistant =
    messages.length > 0 && !sending && messages[messages.length - 1].role === "assistant";

  return (
    <div className="ia-page">
      {/* Encabezado */}
      <header className="ia-glass ia-hero">
        <span className="ia-orb" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="ia-kicker">Coach inteligente</p>
          <h1 className="ia-title">{activeThread ? activeThread.title : "Nueva consulta"}</h1>
        </div>
        <div className="ia-hero-actions">
          <button type="button" className="ia-pill" onClick={() => setIsSidebarOpen(true)}>
            Historial
            {threads.length > 0 ? <span className="ia-badge">{threads.length}</span> : null}
          </button>
          <button type="button" className="ia-pill is-primary" onClick={startNewChat}>
            + Nuevo
          </button>
        </div>
      </header>

      {/* Historial de conversaciones */}
      {isSidebarOpen ? (
        <div className="ia-drawer-overlay" onClick={() => setIsSidebarOpen(false)}>
          <aside className="ia-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="ia-drawer-head">
              <div>
                <p className="ia-kicker">Coach inteligente</p>
                <p className="ia-drawer-title">Historial de chats</p>
              </div>
              <button
                type="button"
                className="rt-icon-btn"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Cerrar historial"
              >
                ✕
              </button>
            </div>

            <button type="button" className="ia-pill is-primary w-full" onClick={startNewChat}>
              + Nueva conversación
            </button>

            <div className="ia-thread-list">
              {loadingThreads ? (
                <p className="ia-empty-text">Cargando conversaciones…</p>
              ) : threads.length === 0 ? (
                <p className="ia-empty-text">No hay conversaciones guardadas aún.</p>
              ) : (
                threads.map((t) => (
                  <div
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    className={`ia-glass ia-thread ${t.id === activeThreadId ? "is-active" : ""}`}
                    onClick={() => loadThread(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadThread(t.id);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="ia-thread-title">{t.title}</p>
                      {t.lastMessageSnippet ? <p className="ia-thread-snippet">{t.lastMessageSnippet}</p> : null}
                      <p className="ia-thread-meta">
                        {formatShortDate(t.updatedAt.slice(0, 10))} · {t.messageCount} mensajes
                      </p>
                    </div>
                    <button
                      type="button"
                      className="ia-thread-delete"
                      title="Eliminar conversación"
                      aria-label="Eliminar conversación"
                      onClick={(e) => deleteThread(t.id, e)}
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
        {loadingChat ? (
          <div className="ia-glass ia-loading">
            <span className="ia-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            Cargando conversación…
          </div>
        ) : messages.length === 0 ? (
          /* Bienvenida */
          <>
            <div className="ia-glass ia-welcome">
              <span className="ia-orb is-large" aria-hidden="true" />
              <h2 className="ia-welcome-title">¿En qué puedo ayudarte hoy?</h2>
              <p className="ia-welcome-text">
                Analizo tus entrenamientos, 1RM, volumen de carga y marcas para darte recomendaciones
                personalizadas.
              </p>
            </div>

            <div className="ia-cap-grid">
              {CAPABILITIES.map((c) => (
                <div key={c.title} className="ia-glass ia-cap">
                  <span className="ia-cap-icon">
                    <Icon name={c.icon} />
                  </span>
                  <p className="ia-cap-title">{c.title}</p>
                  <p className="ia-cap-text">{c.text}</p>
                </div>
              ))}
            </div>

            <p className="ia-section-label">Prueba con</p>
            <div className="ia-suggest-grid">
              {SUGGESTIONS.map((item, i) => (
                <button
                  key={item.text}
                  type="button"
                  className="ia-glass ia-suggest"
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => sendMessage(item.text)}
                >
                  <span className="ia-suggest-head">
                    <span className="ia-suggest-icon">
                      <Icon name={item.icon} />
                    </span>
                    <span className="ia-suggest-tag">{item.tag}</span>
                  </span>
                  <span className="ia-suggest-text">{item.text}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Conversación */
          <div className="ia-thread-feed">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg.id} className={`ia-msg ${isUser ? "is-user" : "is-coach"}`}>
                  <div className="ia-msg-meta">
                    {isUser ? null : <span className="ia-orb is-tiny" aria-hidden="true" />}
                    <span className="ia-msg-author">{isUser ? "Tú" : "Coach"}</span>
                    {msg.createdAt ? <span className="ia-msg-time">{formatMessageTime(msg.createdAt)}</span> : null}
                  </div>
                  <div className={`ia-bubble ${isUser ? "is-user" : "ia-glass"}`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed">{msg.content}</p>
                    ) : (
                      <AiAnalysis content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {sending ? (
              <div className="ia-msg is-coach">
                <div className="ia-msg-meta">
                  <span className="ia-orb is-tiny" aria-hidden="true" />
                  <span className="ia-msg-author">Coach</span>
                </div>
                <div className="ia-bubble ia-glass ia-typing">
                  <span className="ia-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                  Analizando historial y métricas…
                </div>
              </div>
            ) : null}

            {lastIsAssistant ? (
              <div>
                <p className="ia-section-label">Sugerencias de seguimiento</p>
                <div className="ia-followups">
                  {FOLLOW_UPS.map((f) => (
                    <button key={f} type="button" className="ia-chip" onClick={() => sendMessage(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error ? <div className="ia-error">{error}</div> : null}
      </section>

      {/* Caja de escritura: encima de la barra de pestañas o del teclado */}
      <footer
        className="ia-composer-wrap"
        style={composerOffset != null ? { bottom: `${composerOffset}px` } : undefined}
      >
        <div className="ia-composer">
          <textarea
            ref={textareaRef}
            className="ia-input"
            rows={1}
            placeholder="Escribe tu consulta al Coach…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            enterKeyHint="send"
          />
          <button
            type="button"
            className="ia-send"
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            aria-label="Enviar consulta"
          >
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
