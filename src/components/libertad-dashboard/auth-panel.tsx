"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SaveStatus } from "./types";

export function AccessState({ title, body }: { title: string; body: string }) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-950">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{body}</p>
      </section>
    </main>
  );
}

export function AuthPanel({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const credentials = { email, password };
    const result =
      mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (result.error) {
      setStatus("error");
      setMessage(result.error.message);
      return;
    }

    setStatus("saved");
    setMessage(
      mode === "signin"
        ? "Sesion iniciada."
        : "Cuenta creada. Revisa tu correo si Supabase pide confirmacion.",
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-6 text-stone-950 sm:px-8">
      <section className="mx-auto max-w-xl rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-emerald-800">Libertad OS</p>
        <h1 className="mt-1 text-2xl font-semibold text-stone-950">
          Acceso privado
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Inicia sesion para ver y modificar tus datos financieros persistentes.
        </p>

        <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Email</span>
            <input
              autoComplete="email"
              className="libertad-field h-12 rounded-md px-3 text-sm font-semibold text-stone-950"
              name="email"
              spellCheck={false}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">
              Contrasena
            </span>
            <input
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              className="libertad-field h-12 rounded-md px-3 text-sm font-semibold text-stone-950"
              minLength={6}
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {message ? (
            <p
              aria-live="polite"
              className={`rounded-md border px-3 py-2 text-sm ${
                status === "error"
                  ? "border-red-200 bg-red-50 text-red-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
              }`}
            >
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="min-h-11 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-stone-400"
              disabled={status === "saving"}
              type="submit"
            >
              {status === "saving"
                ? "Guardando…"
                : mode === "signin"
                  ? "Iniciar sesion"
                  : "Crear cuenta"}
            </button>
            <button
              className="min-h-11 rounded-md border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage("");
                setStatus("idle");
              }}
            >
              {mode === "signin" ? "Crear cuenta" : "Ya tengo cuenta"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

export function saveStatusLabel(status: SaveStatus) {
  if (status === "saving") {
    return "Guardando";
  }

  if (status === "saved") {
    return "Guardado";
  }

  if (status === "error") {
    return "Error al guardar";
  }

  return "Sesión activa";
}

export function SyncStatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "green" | "red";
}) {
  const toneClasses = {
    neutral: "border-white/15 bg-white/[0.06] text-stone-200",
    green: "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
    red: "border-red-300 bg-red-50 text-red-950",
  };

  return (
    <span
      aria-live="polite"
      className={`inline-flex min-h-8 items-center rounded-md border px-3 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
