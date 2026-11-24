"use client";

import { buildAnalytics, formatPct } from "@/lib/analytics";
import type { HeatmapDay, TaskItem } from "@/lib/types";
import { isTaskCompletedOnDate } from "@/lib/completions";

type Props = {
  days: HeatmapDay[];
  tasks: TaskItem[];
  today: string;
  onOpenTasks: () => void;
};

export function TodayStrip({ days, tasks, today, onOpenTasks }: Props) {
  const a = buildAnalytics(days, today);
  const remaining = tasks.filter((t) => !isTaskCompletedOnDate(t)).length;
  const done = tasks.filter((t) => isTaskCompletedOnDate(t)).length;

  return (
    <section className="panel panel-accent overflow-hidden rounded-2xl">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-green">
            Today
          </p>
          <p className="mt-1 font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {a.todayExpected === 0
              ? "No scheduled work"
              : a.todayRate >= 1
                ? "Day complete"
                : `${remaining} left to finish`}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {done}/{tasks.length} marked done · streak {a.currentStreak}d
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MiniStat label="Done" value={`${a.todayCompleted}/${a.todayExpected}`} accent />
          <MiniStat label="Rate" value={formatPct(a.todayRate)} />
          <MiniStat label="Streak" value={`${a.currentStreak}d`} accent />
        </div>
      </div>

      {a.todayExpected > 0 && a.todayRate < 1 && (
        <div className="border-t border-line px-4 py-3 sm:px-5">
          <div className="mb-2 flex items-center justify-between text-xs text-ink-faint">
            <span>Progress</span>
            <span>{formatPct(a.todayRate)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-heat-0">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-deep to-green-bright transition-all duration-500"
              style={{ width: `${Math.round(Math.min(1, a.todayRate) * 100)}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onOpenTasks}
            className="mt-3 text-sm font-medium text-green-bright transition hover:text-green"
          >
            Open tasks →
          </button>
        </div>
      )}
    </section>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-elevated/70 px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p
        className={`mt-0.5 font-display text-base font-bold sm:text-lg ${
          accent ? "text-green-bright" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
