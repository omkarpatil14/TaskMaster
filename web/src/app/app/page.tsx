"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppNavDesktop,
  AppNavMobile,
  type AppSection,
} from "@/components/AppNav";
import { Heatmap } from "@/components/Heatmap";
import { MetricsPanel } from "@/components/MetricsPanel";
import { TaskBoard } from "@/components/TaskBoard";
import { TodayStrip } from "@/components/TodayStrip";
import { ApiError, api, daysAgoIso, todayIso } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { buildAnalytics, formatPct } from "@/lib/analytics";
import { isTaskCompletedOnDate } from "@/lib/completions";
import type { HeatmapDay, TaskItem } from "@/lib/types";

const RANGES = [
  { days: 27, label: "28d" },
  { days: 89, label: "90d" },
  { days: 6, label: "7d" },
] as const;

const SECTION_KEY = "taskmaster.app.section";

function readSection(): AppSection {
  if (typeof window === "undefined") return "tasks";
  const raw = window.localStorage.getItem(SECTION_KEY);
  if (raw === "today" || raw === "tasks" || raw === "analysis" || raw === "heatmap") {
    return raw;
  }
  return "tasks";
}

export default function AppPage() {
  const { auth, ready, logout } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [rangeDays, setRangeDays] = useState<(typeof RANGES)[number]["days"]>(27);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<AppSection>("tasks");
  const [today, setToday] = useState("");

  useEffect(() => {
    setSection(readSection());
    setToday(todayIso());
  }, []);

  function changeSection(next: AppSection) {
    setSection(next);
    try {
      window.localStorage.setItem(SECTION_KEY, next);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        api.listTasks(auth.accessToken, to),
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

  const analytics = useMemo(
    () => (today ? buildAnalytics(days, today) : null),
    [days, today],
  );
  const pendingCount = useMemo(
    () => tasks.filter((t) => !isTaskCompletedOnDate(t)).length,
    [tasks],
  );

  if (!ready || !auth || !today || !analytics) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <p className="text-ink-soft">Loading…</p>
      </main>
    );
  }

  const rangeLabel =
    RANGES.find((r) => r.days === rangeDays)?.label ?? `${rangeDays + 1}d`;

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 sm:pt-7 md:pb-16">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="pulse-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-dim text-green-bright">
            <span className="font-display text-lg font-bold">T</span>
          </div>
          <div className="min-w-0">
            <Link href="/" className="font-display text-lg font-bold tracking-tight sm:text-xl">
              TaskMaster
            </Link>
            <p className="truncate text-sm text-ink-soft">Hey, {auth.displayName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="shrink-0 rounded-xl px-3 py-2 text-sm text-ink-soft transition hover:text-danger"
        >
          Sign out
        </button>
      </header>

      <div className="mb-5 space-y-4">
        <AppNavDesktop
          section={section}
          onChange={changeSection}
          taskCount={pendingCount}
        />

        {/* Compact pulse always visible */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <PulseChip
            label="Today"
            value={`${analytics.todayCompleted}/${analytics.todayExpected}`}
            onClick={() => changeSection("tasks")}
            accent
          />
          <PulseChip
            label="Streak"
            value={`${analytics.currentStreak}d`}
            onClick={() => changeSection("analysis")}
            accent
          />
          <PulseChip
            label="Rate"
            value={formatPct(analytics.overallRate)}
            onClick={() => changeSection("analysis")}
          />
          <PulseChip
            label="Open"
            value={String(pendingCount)}
            onClick={() => changeSection("tasks")}
          />
        </div>
      </div>

      {error && (
        <p
          className="mb-5 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          role="alert"
        >
          {error}
        </p>
      )}

      {loading ? (
        <div className="panel rounded-2xl p-10 text-center text-ink-soft">
          Syncing your workspace…
        </div>
      ) : (
        <div className="animate-rise space-y-5">
          {section === "today" && (
            <div className="space-y-5">
              <TodayStrip
                days={days}
                tasks={tasks}
                today={today}
                onOpenTasks={() => changeSection("tasks")}
              />

              <section className="panel panel-accent rounded-2xl p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-green">
                      Snapshot
                    </p>
                    <h2 className="mt-1 font-display text-xl font-semibold">Quick links</h2>
                  </div>
                  <RangePicker rangeDays={rangeDays} setRangeDays={setRangeDays} />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <JumpCard
                    title="Tasks"
                    body={`${pendingCount} still open today`}
                    onClick={() => changeSection("tasks")}
                  />
                  <JumpCard
                    title="Analysis"
                    body={`${formatPct(analytics.overallRate)} over ${rangeLabel}`}
                    onClick={() => changeSection("analysis")}
                  />
                  <JumpCard
                    title="Heat map"
                    body="See consistency by day"
                    onClick={() => changeSection("heatmap")}
                  />
                </div>
              </section>

              <Heatmap days={days.slice(-28)} />
            </div>
          )}

          {section === "tasks" && (
            <TaskBoard
              token={auth.accessToken}
              tasks={tasks}
              onChanged={refresh}
            />
          )}

          {section === "analysis" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-soft">
                  Range for charts and streaks
                </p>
                <RangePicker rangeDays={rangeDays} setRangeDays={setRangeDays} />
              </div>
              <MetricsPanel
                days={days}
                tasks={tasks}
                today={today}
                rangeLabel={rangeLabel === "28d" ? "28 days" : rangeLabel === "90d" ? "90 days" : "7 days"}
              />
            </div>
          )}

          {section === "heatmap" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-soft">
                  Calendar intensity for the selected range
                </p>
                <RangePicker rangeDays={rangeDays} setRangeDays={setRangeDays} />
              </div>
              <Heatmap days={days} />
            </div>
          )}
        </div>
      )}

      <AppNavMobile
        section={section}
        onChange={changeSection}
        taskCount={pendingCount}
      />
    </main>
  );
}

function PulseChip({
  label,
  value,
  onClick,
  accent,
}: {
  label: string;
  value: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="panel panel-accent rounded-xl px-3 py-2.5 text-left transition hover:border-line-strong"
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p
        className={`mt-0.5 font-display text-lg font-bold tracking-tight ${
          accent ? "text-green-bright" : "text-ink"
        }`}
      >
        {value}
      </p>
    </button>
  );
}

function JumpCard({
  title,
  body,
  onClick,
}: {
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-line bg-bg-elevated/70 px-4 py-4 text-left transition hover:border-green/40 hover:bg-green-dim/30"
    >
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm text-ink-soft">{body}</p>
    </button>
  );
}

function RangePicker({
  rangeDays,
  setRangeDays,
}: {
  rangeDays: (typeof RANGES)[number]["days"];
  setRangeDays: (days: (typeof RANGES)[number]["days"]) => void;
}) {
  return (
    <div className="flex rounded-xl border border-line bg-bg-elevated p-1">
      {RANGES.map((r) => (
        <button
          key={r.days}
          type="button"
          onClick={() => setRangeDays(r.days)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            rangeDays === r.days
              ? "bg-green text-bg"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
