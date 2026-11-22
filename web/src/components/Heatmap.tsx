"use client";

import type { HeatmapDay } from "@/lib/types";

function levelFromRate(rate: number, expected: number): number {
  if (expected === 0) return 0;
  if (rate <= 0) return 0;
  if (rate < 0.35) return 1;
  if (rate < 0.65) return 2;
  if (rate < 0.9) return 3;
  return 4;
}

const LEVEL_CLASS = [
  "bg-heat-0",
  "bg-heat-1",
  "bg-heat-2",
  "bg-heat-3",
  "bg-heat-4",
] as const;

function toWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  if (days.length === 0) return [];
  const first = new Date(days[0].date + "T12:00:00");
  const pad = first.getDay(); // 0 Sun
  const cells: (HeatmapDay | null)[] = [
    ...Array.from({ length: pad }, () => null),
    ...days,
  ];
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const chunk = cells.slice(i, i + 7);
    weeks.push(
      chunk.map(
        (c, idx) =>
          c ?? {
            date: `pad-${i}-${idx}`,
            expected: -1,
            completed: 0,
            rate: 0,
          },
      ),
    );
  }
  return weeks;
}

type Props = {
  days: HeatmapDay[];
};

export function Heatmap({ days }: Props) {
  const weeks = toWeeks(days);

  return (
    <section className="panel panel-accent rounded-2xl p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-green">
            Consistency
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Heat map
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <span>Less</span>
          {LEVEL_CLASS.map((c) => (
            <span key={c} className={`inline-block h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-1.5">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1.5">
              {week.map((day, di) => {
                if (day.expected < 0) {
                  return <div key={day.date} className="h-3.5 w-3.5 sm:h-4 sm:w-4" />;
                }
                const level = levelFromRate(day.rate, day.expected);
                return (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.completed}/${day.expected} (${Math.round(day.rate * 100)}%)`}
                    className={`heat-cell h-3.5 w-3.5 rounded-sm sm:h-4 sm:w-4 ${LEVEL_CLASS[level]} transition-transform duration-200 hover:scale-125`}
                    style={{ animationDelay: `${Math.min(wi * 7 + di, 70) * 10}ms` }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
