"use client";

import {
  buildAnalytics,
  formatPct,
  taskTypeBreakdown,
} from "@/lib/analytics";
import type { HeatmapDay, TaskItem } from "@/lib/types";

type Props = {
  days: HeatmapDay[];
  tasks: TaskItem[];
  today: string;
  rangeLabel: string;
};

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="panel panel-accent rounded-2xl p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
        {label}
      </p>
      <p
        className={`mt-2 font-display text-3xl font-bold tracking-tight ${
          accent ? "text-green-bright" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function MetricsPanel({ days, tasks, today, rangeLabel }: Props) {
  const a = buildAnalytics(days, today);
  const types = taskTypeBreakdown(tasks);
  const maxWeekCompleted = Math.max(1, ...a.weekly.map((w) => w.completed));

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-green">
            Analysis
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Performance
          </h2>
        </div>
        <p className="text-sm text-ink-soft">{rangeLabel}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Today"
          value={`${a.todayCompleted}/${a.todayExpected}`}
          hint={formatPct(a.todayRate)}
          accent
        />
        <Stat
          label="Overall rate"
          value={formatPct(a.overallRate)}
          hint={`${a.totalCompleted} of ${a.totalExpected} done`}
        />
        <Stat
          label="Current streak"
          value={`${a.currentStreak}d`}
          hint={`Best ${a.bestStreak}d (≥80% days)`}
          accent
        />
        <Stat
          label="Avg / active day"
          value={a.avgDailyCompleted.toFixed(1)}
          hint={`${a.perfectDays} perfect · ${a.missedDays} missed`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel panel-accent rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Weekly output</h3>
            <span className="text-xs text-ink-faint">completed tasks</span>
          </div>
          <div className="flex h-40 items-end gap-2">
            {a.weekly.map((week, i) => (
              <div key={week.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="relative flex h-28 w-full items-end justify-center">
                  <div
                    className="bar-grow w-full max-w-10 rounded-t-md bg-gradient-to-t from-green-deep to-green-bright"
                    style={{
                      height: `${Math.max(8, (week.completed / maxWeekCompleted) * 100)}%`,
                      animationDelay: `${i * 60}ms`,
                    }}
                    title={`${week.completed} completed · ${formatPct(week.rate)}`}
                  />
                </div>
                <span className="truncate text-[10px] text-ink-faint">{week.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel panel-accent rounded-2xl p-5">
          <h3 className="mb-4 font-display text-lg font-semibold">By weekday</h3>
          <ul className="space-y-2.5">
            {a.weekdayScores.map((day) => (
              <li key={day.label} className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
                <span className="text-xs text-ink-soft">{day.label}</span>
                <div className="h-2 overflow-hidden rounded-full bg-heat-0">
                  <div
                    className="h-full rounded-full bg-green transition-all duration-500"
                    style={{ width: `${Math.round(day.rate * 100)}%` }}
                  />
                </div>
                <span className="text-right text-xs text-ink-soft">
                  {day.samples === 0 ? "—" : formatPct(day.rate)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="panel panel-accent rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">Best day</p>
          {a.bestDay ? (
            <>
              <p className="mt-2 font-display text-xl font-semibold text-green-bright">
                {a.bestDay.date}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.bestDay.completed}/{a.bestDay.expected} · {formatPct(a.bestDay.rate)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Not enough data yet</p>
          )}
        </div>

        <div className="panel panel-accent rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">Needs focus</p>
          {a.worstDay ? (
            <>
              <p className="mt-2 font-display text-xl font-semibold">{a.worstDay.date}</p>
              <p className="mt-1 text-sm text-ink-soft">
                {a.worstDay.completed}/{a.worstDay.expected} · {formatPct(a.worstDay.rate)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">Not enough data yet</p>
          )}
        </div>

        <div className="panel panel-accent rounded-2xl p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-faint">
            Active task mix
          </p>
          <ul className="mt-3 space-y-2">
            {types.length === 0 && (
              <li className="text-sm text-ink-soft">No active tasks</li>
            )}
            {types.map((t) => (
              <li key={t.label} className="flex items-center justify-between text-sm">
                <span className="text-ink-soft">{t.label}</span>
                <span className="font-display font-semibold text-green-bright">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
