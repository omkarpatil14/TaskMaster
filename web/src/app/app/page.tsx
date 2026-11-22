"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heatmap } from "@/components/Heatmap";
import { MetricsPanel } from "@/components/MetricsPanel";
import { TaskBoard } from "@/components/TaskBoard";
import { ApiError, api, daysAgoIso, todayIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { HeatmapDay, TaskItem } from "@/lib/types";

const RANGES = [
  { days: 27, label: "28 days" },
  { days: 89, label: "90 days" },
  { days: 6, label: "7 days" },
] as const;

export default function AppPage() {
  const { auth, ready, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]["days"]>(27);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !auth) router.replace("/login");
  }, [ready, auth, router]);

  const refresh = useCallback(async () => {
    if (!auth) return;
    setError(null);
    try {
      const from = daysAgoIso(rangeDays);
      const to = todayIso();
      const [taskList, heatmap] = await Promise.all([
        api.listTasks(auth.accessToken),
        api.heatmap(auth.accessToken, from, to),
      ]);
      setTasks(taskList);
      setDays(heatmap.days);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load";
      setError(message);
      if (err instanceof ApiError && err.status === 401) {
        logout();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [auth, logout, router, rangeDays]);

  useEffect(() => {
    if (auth) {
      setLoading(true);
      void refresh();
    }
  }, [auth, refresh]);

  if (!ready || !auth) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  const rangeLabel =
    RANGES.find((r) => r.days === rangeDays)?.label ?? `${rangeDays + 1} days`;

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl px-5 pb-24 pt-7 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="pulse-glow flex h-10 w-10 items-center justify-center rounded-xl bg-green-dim text-green-bright">
            <span className="font-display text-lg font-bold">T</span>
          </div>
          <div>
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              TaskMaster
            </Link>
            <p className="text-sm text-ink-soft">Hey, {auth.displayName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-line bg-bg-elevated p-1">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setRangeDays(r.days)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  rangeDays === r.days
                    ? "bg-green text-bg"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="rounded-xl px-3 py-2 text-sm text-ink-soft transition hover:text-danger"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p className="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="panel rounded-2xl p-10 text-center text-ink-soft">
          Syncing your metrics…
        </div>
      ) : (
        <div className="space-y-8">
          <div className="animate-rise">
            <MetricsPanel
              days={days}
              tasks={tasks}
              today={todayIso()}
              rangeLabel={rangeLabel}
            />
          </div>
          <div className="animate-rise-delay">
            <Heatmap days={days} />
          </div>
          <div className="animate-rise-delay-2">
            <TaskBoard
              token={auth.accessToken}
              tasks={tasks}
              onChanged={refresh}
            />
          </div>
        </div>
      )}
    </main>
  );
}
