export type TaskType = 1 | 2 | 3;
export type RecurrenceType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AuthResponse {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  expiresAtUtc: string;
}

export interface TaskItem {
  id: string;
  title: string;
  notes?: string | null;
  type: TaskType;
  recurrenceType: RecurrenceType;
  specificDate?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}

export interface CreateTaskRequest {
  title: string;
  notes?: string;
  type: TaskType;
  recurrenceType: RecurrenceType;
  specificDate?: string | null;
}

export interface HeatmapDay {
  date: string;
  expected: number;
  completed: number;
  rate: number;
}

export interface HeatmapResponse {
  from: string;
  to: string;
  days: HeatmapDay[];
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  1: "One day",
  2: "Specific date",
  3: "Recurring",
};

export const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  0: "None",
  1: "Daily",
  2: "Weekdays",
  3: "Weekly",
  4: "Monthly",
  5: "Yearly",
  6: "Custom",
};
