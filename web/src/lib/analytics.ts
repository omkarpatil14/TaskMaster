import type { HeatmapDay, TaskItem } from "./types";
import { TASK_TYPE_LABELS } from "./types";

export type WeekBucket = {
  label: string;
  expected: number;
  completed: number;
  rate: number;
};

export type AnalyticsSummary = {
  totalExpected: number;
  totalCompleted: number;
  overallRate: number;
  activeDays: number;
  perfectDays: number;
  missedDays: number;
  currentStreak: number;
  bestStreak: number;
  todayExpected: number;
  todayCompleted: number;
  todayRate: number;
  avgDailyCompleted: number;
  bestDay: HeatmapDay | null;
  worstDay: HeatmapDay | null;
  weekly: WeekBucket[];
  weekdayScores: { label: string; rate: number; samples: number }[];
};

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isSolidDay(day: HeatmapDay): boolean {
  return day.expected > 0 && day.rate >= 0.8;
}

function isMissDay(day: HeatmapDay): boolean {
  return day.expected > 0 && day.completed === 0;
}

export function buildAnalytics(days: HeatmapDay[], todayIso: string): AnalyticsSummary {
  const withWork = days.filter((d) => d.expected > 0);
  const totalExpected = days.reduce((s, d) => s + d.expected, 0);
  const totalCompleted = days.reduce((s, d) => s + d.completed, 0);
  const overallRate = totalExpected === 0 ? 0 : totalCompleted / totalExpected;

  const today = days.find((d) => d.date === todayIso) ?? {
    date: todayIso,
    expected: 0,
    completed: 0,
    rate: 0,
  };

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (day.expected === 0) continue;
    if (isSolidDay(day)) currentStreak += 1;
    else break;
  }

  let bestStreak = 0;
  let running = 0;
  for (const day of days) {
    if (day.expected === 0) continue;
    if (isSolidDay(day)) {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  }

  const ranked = [...withWork].sort((a, b) => b.rate - a.rate || b.completed - a.completed);
  const bestDay = ranked[0] ?? null;
  const worstDay = ranked.length ? ranked[ranked.length - 1] : null;

  const weekly: WeekBucket[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const expected = chunk.reduce((s, d) => s + d.expected, 0);
    const completed = chunk.reduce((s, d) => s + d.completed, 0);
    const start = chunk[0]?.date.slice(5) ?? "";
    const end = chunk[chunk.length - 1]?.date.slice(5) ?? "";
    weekly.push({
      label: `${start}–${end}`,
      expected,
      completed,
      rate: expected === 0 ? 0 : completed / expected,
    });
  }

  const weekdayMap = WEEKDAY.map((label) => ({ label, completed: 0, expected: 0 }));
  for (const day of days) {
    const wd = parseDate(day.date).getDay();
    weekdayMap[wd].expected += day.expected;
    weekdayMap[wd].completed += day.completed;
  }
  const weekdayScores = weekdayMap.map((w) => ({
    label: w.label,
    samples: w.expected,
    rate: w.expected === 0 ? 0 : w.completed / w.expected,
  }));

  return {
    totalExpected,
    totalCompleted,
    overallRate,
    activeDays: withWork.length,
    perfectDays: withWork.filter((d) => d.rate >= 1).length,
    missedDays: withWork.filter(isMissDay).length,
    currentStreak,
    bestStreak,
    todayExpected: today.expected,
    todayCompleted: today.completed,
    todayRate: today.rate,
    avgDailyCompleted:
      withWork.length === 0
        ? 0
        : withWork.reduce((s, d) => s + d.completed, 0) / withWork.length,
    bestDay,
    worstDay,
    weekly,
    weekdayScores,
  };
}

export function taskTypeBreakdown(tasks: TaskItem[]) {
  const counts: Record<string, number> = {};
  for (const task of tasks) {
    const label = TASK_TYPE_LABELS[task.type] ?? "Other";
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

export function formatPct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
