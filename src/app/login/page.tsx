"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "PIN incorrecto");
      }
      const next = searchParams.get("next") || "/";
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[78vh] flex-col justify-center">
      <p className="page-kicker mb-2">Acceso por perfil</p>
      <h1 className="page-title text-5xl">
        Fuerza
        <span className="text-[var(--accent)]">.</span>
      </h1>
      <p className="mt-3 max-w-sm text-[var(--muted)]">
        Cada PIN abre su propio espacio: entrenos, peso y métricas no se
        mezclan entre personas.
      </p>

      <form onSubmit={onSubmit} className="card mt-8 space-y-4 p-5">
        <div>
          <label className="label" htmlFor="pin">
            PIN
          </label>
          <input
            id="pin"
            className="field text-center text-2xl font-semibold tracking-[0.35em]"
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
        <button className="btn btn-primary w-full" type="submit" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-[var(--muted)]">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
