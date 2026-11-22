"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const fieldClass =
  "w-full rounded-xl border border-line bg-bg-elevated px-3 py-2.5 outline-none transition focus:border-green focus:ring-1 focus:ring-green/40";

export default function RegisterPage() {
  const { auth, ready, setSession } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (ready && auth) router.replace("/app");
  }, [ready, auth, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await api.register({ email, password, displayName });
        setSession(res);
        router.push("/app");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Registration failed");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-10 font-display text-2xl font-bold tracking-tight text-green-bright">
        TaskMaster
      </Link>
      <div className="panel panel-accent rounded-2xl p-6 sm:p-8">
        <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight">
          Create your space
        </h1>
        <p className="animate-rise-delay mt-2 text-ink-soft">
          Tasks, streaks, and heat map analysis.
        </p>

        <form onSubmit={onSubmit} className="animate-rise-delay-2 mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Display name
            </span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Password
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </label>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-xl bg-green py-3 font-display font-semibold text-bg transition hover:bg-green-bright disabled:opacity-60"
          >
            {pending ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>

      <p className="mt-8 text-sm text-ink-soft">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-green-bright hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
