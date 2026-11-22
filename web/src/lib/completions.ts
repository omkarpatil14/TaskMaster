import { todayIso } from "./api";

const storageKey = (date = todayIso()) => `taskmaster.completed.${date}`;

export function readStoredCompletions(date = todayIso()): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey(date));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

export function writeStoredCompletions(ids: Set<string>, date = todayIso()) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(date), JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

export function markStoredComplete(taskId: string, date = todayIso()) {
  const ids = readStoredCompletions(date);
  ids.add(taskId);
  writeStoredCompletions(ids, date);
  return ids;
}

export function isTaskCompletedOnDate(task: {
  completedOnDate?: boolean;
  CompletedOnDate?: boolean;
}): boolean {
  return Boolean(task.completedOnDate ?? task.CompletedOnDate);
}
