"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { auth, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && auth) router.replace("/app");
  }, [ready, auth, router]);

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-green/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-72 w-72 rounded-full bg-green-deep/30 blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-bold tracking-tight text-green-bright">
          TaskMaster
        </span>
        <Link
          href="/login"
          className="text-sm font-medium text-ink-soft transition hover:text-green-bright"
        >
          Sign in
        </Link>
      </header>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20 pt-8">
        <p className="animate-rise text-xs font-medium uppercase tracking-[0.22em] text-green">
          Dark mode for deep focus
        </p>
        <h1 className="animate-rise-delay mt-4 max-w-4xl font-display text-6xl font-extrabold leading-[0.92] tracking-tight sm:text-7xl md:text-8xl">
          TaskMaster
        </h1>
        <p className="animate-rise-delay-2 mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
          Plan recurring work, close the day, and read your streak in green —
          heat maps, weekly output, and weekday patterns in one place.
        </p>

        <div className="animate-rise-delay-2 mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/register"
            className="rounded-xl bg-green px-7 py-3.5 font-display text-base font-semibold text-bg transition hover:bg-green-bright"
          >
            Start free
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-line-strong px-7 py-3.5 font-display text-base font-semibold text-ink transition hover:border-green hover:text-green-bright"
          >
            I have an account
          </Link>
        </div>

        <div className="animate-rise-delay-2 mt-16 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            { t: "Heat map", d: "See consistency light up" },
            { t: "Streaks", d: "Track ≥80% days in a row" },
            { t: "Weekday intel", d: "Find your weak spots" },
          ].map((item) => (
            <div key={item.t} className="panel panel-accent rounded-2xl p-4">
              <p className="font-display font-semibold text-green-bright">{item.t}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.d}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
