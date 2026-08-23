"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="ai-section-title mt-2 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="ai-section-title mt-5 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="ai-section-subtitle mt-4 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-[var(--ink)]/90 first:mt-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-[var(--ink)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="not-italic text-[var(--ink)]/85 underline decoration-[var(--line-strong)] underline-offset-4">
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul className="ai-list mt-2.5 space-y-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ai-list ai-list-ordered mt-2.5 space-y-2">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[0.95rem] leading-relaxed text-[var(--ink)]/90">
      {children}
    </li>
  ),
  hr: () => <hr className="my-4 border-[var(--line)]" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="font-semibold text-[var(--accent)] underline-offset-2 hover:underline"
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-3 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-3.5 py-2.5 text-[0.9rem] leading-relaxed text-[#ffd7c4] rounded-r-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-3.5 w-full overflow-x-auto rounded-xl border border-[var(--line-strong)] bg-[#111111]">
      <table className="w-full min-w-[280px] text-left text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#181818] text-[var(--muted)] font-bold uppercase tracking-wider text-[10px] border-b border-[var(--line-strong)]">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2.5 font-bold text-[var(--ink)] whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border-t border-white/5 text-[var(--ink)]/90 leading-snug">
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[0.9em] text-[#ffd7c4] font-mono">
      {children}
    </code>
  ),
};

export function AiAnalysis({ content }: { content: string }) {
  return (
    <div className="ai-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
