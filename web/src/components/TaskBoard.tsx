"use client";

import { useMemo, useState, useTransition } from "react";
import { api, todayIso } from "@/lib/api";
import type { CreateTaskRequest, RecurrenceType, TaskItem, TaskType } from "@/lib/types";
import { RECURRENCE_LABELS, TASK_TYPE_LABELS } from "@/lib/types";

type Props = {
  token: string;
  tasks: TaskItem[];
  onChanged: () => Promise<void>;
};

const fieldClass =
  "w-full rounded-xl border border-line bg-bg-elevated px-3 py-2.5 outline-none transition focus:border-green focus:ring-1 focus:ring-green/40";

export function TaskBoard({ token, tasks, onChanged }: Props) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [type, setType] = useState<TaskType>(3);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(1);
  const [specificDate, setSpecificDate] = useState(todayIso());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  const sorted = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          new Date(b.createdAtUtc).getTime() - new Date(a.createdAtUtc).getTime(),
      ),
    [tasks],
  );

  function resetForm() {
    setTitle("");
    setNotes("");
    setType(3);
    setRecurrenceType(1);
    setSpecificDate(todayIso());
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const body: CreateTaskRequest = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      type,
      recurrenceType: type === 3 ? recurrenceType : 0,
      specificDate: type === 2 ? specificDate : null,
    };

    startTransition(async () => {
      try {
        await api.createTask(token, body);
        resetForm();
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create task");
      }
    });
  }

  function complete(taskId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await api.completeTask(token, taskId);
        setJustCompleted(taskId);
        setCompletedIds((prev) => new Set(prev).add(taskId));
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not complete task");
      }
    });
  }

  function archive(taskId: string) {
    setError(null);
    startTransition(async () => {
      try {
        await api.archiveTask(token, taskId);
        await onChanged();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not archive task");
      }
    });
  }

  return (
    <section className="panel panel-accent rounded-2xl p-5 md:p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-green">
            Execution
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight md:text-3xl">
            Tasks
          </h2>
        </div>
        <p className="text-sm text-ink-soft">{sorted.length} active</p>
      </div>

      <form
        onSubmit={submit}
        className="mb-6 rounded-2xl border border-line bg-bg-elevated/60 p-4"
        aria-label="Add task"
      >
        <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Title
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to happen?"
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Type
            </span>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value) as TaskType)}
              className={fieldClass}
            >
              {(Object.entries(TASK_TYPE_LABELS) as [string, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          {type === 3 ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Repeat
              </span>
              <select
                value={recurrenceType}
                onChange={(e) =>
                  setRecurrenceType(Number(e.target.value) as RecurrenceType)
                }
                className={fieldClass}
              >
                {([1, 2, 3] as RecurrenceType[]).map((value) => (
                  <option key={value} value={value}>
                    {RECURRENCE_LABELS[value]}
                  </option>
                ))}
              </select>
            </label>
          ) : type === 2 ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Date
              </span>
              <input
                type="date"
                required
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className={fieldClass}
              />
            </label>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
                Notes
              </span>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
                className={fieldClass}
              />
            </label>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-green px-5 py-2.5 font-display text-sm font-semibold text-bg transition hover:bg-green-bright disabled:opacity-60 md:w-auto"
            >
              {pending ? "Saving…" : "Add"}
            </button>
          </div>
        </div>

        {type !== 1 && (
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-ink-faint">
              Notes
            </span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional detail"
              className={fieldClass}
            />
          </label>
        )}
      </form>

      {error && (
        <p className="mb-4 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <ul className="space-y-2">
        {sorted.length === 0 && (
          <li className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-ink-soft">
            No active tasks yet. Add one and light up the heat map.
          </li>
        )}

        {sorted.map((task) => {
          const done = completedIds.has(task.id);
          return (
            <li
              key={task.id}
              className={`flex flex-col gap-3 rounded-xl border border-line bg-bg-elevated/50 px-4 py-3.5 transition hover:border-line-strong sm:flex-row sm:items-center sm:justify-between ${
                done ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`font-display text-lg font-semibold tracking-tight ${
                    done ? "text-ink-soft line-through" : "text-ink"
                  }`}
                >
                  {task.title}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {TASK_TYPE_LABELS[task.type]}
                  {task.type === 3 ? ` · ${RECURRENCE_LABELS[task.recurrenceType]}` : ""}
                  {task.type === 2 && task.specificDate ? ` · ${task.specificDate}` : ""}
                  {task.notes ? ` · ${task.notes}` : ""}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  disabled={pending || done}
                  onClick={() => complete(task.id)}
                  className={`rounded-xl border border-green/40 bg-green-dim px-3.5 py-1.5 text-sm font-medium text-green-bright transition hover:bg-green hover:text-bg disabled:cursor-default disabled:opacity-50 ${
                    justCompleted === task.id ? "check-pop" : ""
                  }`}
                >
                  {done ? "Done today" : "Complete"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => archive(task.id)}
                  className="rounded-xl px-3 py-1.5 text-sm text-ink-faint transition hover:text-danger"
                >
                  Archive
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
