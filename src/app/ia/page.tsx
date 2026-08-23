"use client";

import { useEffect, useRef, useState } from "react";
import { AiAnalysis } from "@/components/AiAnalysis";
import { formatShortDate } from "@/lib/exercise-history";
import type { ChatMessage, ChatThread, ChatThreadSummary } from "@/lib/types";

const SUGGESTIONS = [
  "¿Cómo va mi progreso general de fuerza y sobrecarga?",
  "¿Estoy estancado en algún ejercicio de mi rutina?",
  "Recomiéndame una rutina de 4 días enfocada en hipertrofia",
  "¿Debería rotar o sustituir algún ejercicio de espalda?",
];

const FOLLOW_UPS = [
  "Sí, genera el plan detallado",
  "¿Qué ejercicios accesorios recomiendas?",
  "¿Cómo ajusto mis cargas la próxima semana?",
  "¿Necesito una semana de descarga?",
];

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  useEffect(() => {
    fetchThreads();
  }, []);

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

  return (
    <div className="relative flex flex-col space-y-4">
      {/* Barra superior de control */}
      <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="page-kicker">Coach Inteligente</p>
            <span className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
              IA
            </span>
          </div>
          <h1 className="page-title mt-0.5 truncate text-lg sm:text-xl">
            {activeThread ? activeThread.title : "Nueva consulta"}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="rounded-lg border border-[var(--line)] bg-[#121212] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] active:border-[var(--accent)] hover:text-white transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            Historial {threads.length > 0 ? `(${threads.length})` : ""}
          </button>
          <button
            type="button"
            className="btn btn-primary px-3 py-1.5 text-xs font-bold"
            onClick={startNewChat}
          >
            + Nuevo
          </button>
        </div>
      </header>

      {/* Drawer / Sidebar de Historial de Conversaciones */}
      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex bg-black/70 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-full max-w-xs sm:max-w-sm flex-col border-r border-[var(--line)] bg-[#0d0d0d] p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Historial de Chats
              </p>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-[var(--muted)] hover:bg-white/10 hover:text-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="my-3">
              <button
                type="button"
                className="btn btn-primary w-full text-xs py-2.5 font-bold"
                onClick={startNewChat}
              >
                + Iniciar Nueva Conversación
              </button>
            </div>

            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {loadingThreads ? (
                <p className="p-3 text-center text-xs text-[var(--muted)]">
                  Cargando conversaciones...
                </p>
              ) : threads.length === 0 ? (
                <p className="p-4 text-center text-xs text-[var(--muted)]">
                  No hay conversaciones guardadas aún.
                </p>
              ) : (
                threads.map((t) => {
                  const isSelected = t.id === activeThreadId;
                  return (
                    <div
                      key={t.id}
                      className={`group flex items-center justify-between rounded-xl border p-3 text-left transition-all active:scale-[0.99] cursor-pointer ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)]/10 text-white"
                          : "border-[var(--line)] bg-[#121212] text-[var(--muted)] hover:border-white/20 hover:text-white"
                      }`}
                      onClick={() => loadThread(t.id)}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <p className="text-xs font-semibold text-[var(--ink)] truncate">
                          {t.title}
                        </p>
                        {t.lastMessageSnippet ? (
                          <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                            {t.lastMessageSnippet}
                          </p>
                        ) : null}
                        <p className="text-[10px] text-[var(--muted)] mt-1">
                          {formatShortDate(t.updatedAt.slice(0, 10))} · {t.messageCount} msgs
                        </p>
                      </div>
                      <button
                        type="button"
                        className="opacity-60 hover:opacity-100 p-1.5 text-xs text-[var(--danger)] hover:bg-red-500/10 rounded-md transition-opacity shrink-0"
                        title="Eliminar conversación"
                        onClick={(e) => deleteThread(t.id, e)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {/* Contenedor principal de mensajes con padding inferior seguro para no tapar el input */}
      <main className="space-y-4 pb-32">
        {loadingChat ? (
          <div className="flex h-56 items-center justify-center">
            <p className="text-xs text-[var(--muted)]">Cargando conversación...</p>
          </div>
        ) : messages.length === 0 ? (
          /* Estado Vacío / Bienvenida */
          <div className="card space-y-4 p-4 sm:p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[#141414]">
              <span className="text-xl font-bold text-[var(--accent)]">IA</span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[var(--ink)]">
                ¿En qué puedo ayudarte hoy?
              </h2>
              <p className="mx-auto mt-1 max-w-sm text-xs text-[var(--muted)] leading-relaxed">
                Analizo tus entrenamientos, 1RM, volumen de carga y marcas para darte recomendaciones personalizadas.
              </p>
            </div>

            <div className="grid gap-2 text-left sm:grid-cols-2 pt-1">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-xl border border-[var(--line)] bg-[#111111] p-3 text-xs text-[var(--ink)] hover:border-[var(--accent)] hover:bg-[#161616] active:scale-[0.98] transition-all text-left leading-snug"
                  onClick={() => sendMessage(item)}
                >
                  <p className="font-medium text-[var(--ink)]">{item}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Lista de mensajes */
          <div className="space-y-3.5">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  {/* Encabezado del mensaje */}
                  <div className="mb-1 flex items-center gap-2 px-1 text-[10px] text-[var(--muted)]">
                    <span className="font-semibold uppercase tracking-wider">
                      {isUser ? "Tú" : "Coach"}
                    </span>
                    {msg.createdAt ? (
                      <span>{msg.createdAt.slice(11, 16)}</span>
                    ) : null}
                  </div>

                  {/* Burbuja del mensaje */}
                  <div
                    className={`max-w-[94%] sm:max-w-[88%] rounded-2xl p-3.5 sm:p-4.5 ${
                      isUser
                        ? "bg-[#181818] border border-[var(--accent)]/40 text-[var(--ink)] shadow-md"
                        : "card bg-[#0e0e0e] border border-[var(--line)] text-[var(--ink)] shadow-lg"
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    ) : (
                      <AiAnalysis content={msg.content} />
                    )}
                  </div>
                </div>
              );
            })}

            {/* Animación de respuesta en curso */}
            {sending ? (
              <div className="flex flex-col items-start">
                <div className="mb-1 px-1 text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">
                  Coach
                </div>
                <div className="card rounded-2xl p-3.5 bg-[#0e0e0e] border border-[var(--line)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
                    <span className="inline-block h-2 w-2 animate-ping rounded-full bg-[var(--accent)]" />
                    <span>Analizando historial y métricas...</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Chips de sugerencias de seguimiento debajo de la última respuesta (scroll natural) */}
            {messages.length > 0 && !sending && messages[messages.length - 1].role === "assistant" ? (
              <div className="pt-2">
                <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                  Sugerencias de seguimiento
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {FOLLOW_UPS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className="rounded-full border border-[var(--line)] bg-[#141414] px-3 py-1.5 text-xs text-[var(--ink)] hover:border-[var(--accent)] hover:text-white active:scale-95 transition-all text-left"
                      onClick={() => sendMessage(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        )}

        {error ? (
          <div className="rounded-xl border border-red-500/40 bg-red-950/20 p-3 text-xs text-red-400">
            {error}
          </div>
        ) : null}
      </main>

      {/* Barra de Entrada fija: estrictamente compacta, sin elementos flotantes */}
      <footer className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 mx-auto w-full max-w-lg px-4 pointer-events-none">
        <div className="pointer-events-auto">
          {/* Caja de entrada táctil sólida */}
          <div className="flex items-center gap-2 rounded-2xl border border-[var(--line-strong)] bg-[#101010] p-1.5 sm:p-2 shadow-[0_-8px_30px_rgba(0,0,0,0.9)] backdrop-blur-md focus-within:border-[var(--accent)] transition-colors">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-[var(--ink)] placeholder-[var(--muted)] outline-none min-h-[38px] max-h-28"
              rows={1}
              placeholder="Escribe tu consulta al Coach..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              type="button"
              className="btn btn-primary h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl p-0 flex items-center justify-center disabled:opacity-40"
              onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <span className="text-sm sm:text-base font-bold">↑</span>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
