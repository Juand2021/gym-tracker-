"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h2 className="ai-section-title mt-1 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="ai-section-title mt-6 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="ai-section-subtitle mt-5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-3 text-[0.98rem] leading-relaxed text-[var(--ink)]/90 first:mt-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--ink)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="not-italic text-[var(--ink)]/85 underline decoration-[var(--line-strong)] underline-offset-4">
      {children}
    </em>
  ),
  ul: ({ children }) => (
    <ul className="ai-list mt-3 space-y-2.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="ai-list ai-list-ordered mt-3 space-y-2.5">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[0.98rem] leading-relaxed text-[var(--ink)]/90">
      {children}
    </li>
  ),
  hr: () => <hr className="my-5 border-[var(--line)]" />,
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
    <blockquote className="mt-4 border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3 text-[0.95rem] leading-relaxed text-[#ffd7c4]">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-[#0a0a0a] px-1.5 py-0.5 text-[0.9em] text-[#ffd7c4]">
      {children}
    </code>
  ),
};

export function AiAnalysis({ content }: { content: string }) {
  return (
    <div className="ai-prose">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
