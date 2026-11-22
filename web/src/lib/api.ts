import type {
  AuthResponse,
  CreateTaskRequest,
  HeatmapResponse,
  TaskItem,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/proxy";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (typeof data?.message === "string") return data.message;
    if (typeof data?.title === "string") return data.title;
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed";
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const api = {
  register(body: {
    email: string;
    password: string;
    displayName: string;
  }) {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  login(body: { email: string; password: string }) {
    return request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listTasks(token: string) {
    return request<TaskItem[]>("/tasks", { token });
  },

  createTask(token: string, body: CreateTaskRequest) {
    return request<TaskItem>("/tasks", {
      method: "POST",
      token,
      body: JSON.stringify(body),
    });
  },

  completeTask(token: string, taskId: string, date?: string) {
    return request<void>(`/tasks/${taskId}/complete`, {
      method: "POST",
      token,
      body: JSON.stringify(date ? { date } : {}),
    });
  },

  archiveTask(token: string, taskId: string) {
    return request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
      token,
    });
  },

  heatmap(token: string, from: string, to: string) {
    return request<HeatmapResponse>(
      `/metrics/heatmap?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { token },
    );
  },
};

export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
