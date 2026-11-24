"use client";

export type AppSection = "today" | "tasks" | "analysis" | "heatmap";

const SECTIONS: { id: AppSection; label: string; short: string }[] = [
  { id: "today", label: "Overview", short: "Home" },
  { id: "tasks", label: "Tasks", short: "Tasks" },
  { id: "analysis", label: "Analysis", short: "Stats" },
  { id: "heatmap", label: "Heat map", short: "Heat" },
];

type Props = {
  section: AppSection;
  onChange: (section: AppSection) => void;
  taskCount: number;
};

export function AppNavDesktop({ section, onChange, taskCount }: Props) {
  return (
    <nav
      className="hidden rounded-2xl border border-line bg-bg-elevated/80 p-1.5 md:flex"
      aria-label="App sections"
    >
      {SECTIONS.map((s) => {
        const active = section === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={`relative flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-green text-bg shadow-sm"
                : "text-ink-soft hover:bg-green-dim/40 hover:text-ink"
            }`}
          >
            {s.label}
            {s.id === "tasks" && taskCount > 0 && (
              <span
                className={`ml-2 inline-flex min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] ${
                  active ? "bg-bg/20 text-bg" : "bg-green-dim text-green-bright"
                }`}
              >
                {taskCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

export function AppNavMobile({ section, onChange, taskCount }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"
      aria-label="App sections"
    >
      <div className="mx-auto flex max-w-lg">
        {SECTIONS.map((s) => {
          const active = section === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                active ? "text-green-bright" : "text-ink-faint"
              }`}
            >
              <span
                className={`flex h-1.5 w-1.5 rounded-full transition ${
                  active ? "bg-green-bright" : "bg-transparent"
                }`}
              />
              <span className="text-[11px] font-semibold tracking-wide">{s.short}</span>
              {s.id === "tasks" && taskCount > 0 && (
                <span className="absolute right-3 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green px-1 text-[9px] font-bold text-bg">
                  {taskCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
