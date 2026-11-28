import type {
  AuthResponse,
  CreateTaskRequest,
  HeatmapResponse,
  TaskItem,
} from "./types";
import {
  accessTokenExpiring,
  adoptSession,
  clearSession,
  getSession,
  readStoredSession,
  saveSession,
} from "./session";

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

type RequestOptions = RequestInit & { auth?: boolean };

async function send(path: string, options: RequestOptions, token: string | null) {
  const { auth: _auth, headers, ...rest } = options;
  void _auth;
  return fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let token: string | null = null;

  if (options.auth) {
    let session = getSession();
    if (!session) throw new ApiError("Not signed in", 401);

    // Refresh ahead of time so we don't burn a round-trip on a known-expired token.
    if (accessTokenExpiring(session) && session.refreshToken) {
      await refreshSession(session.accessToken);
      session = getSession();
      if (!session) throw new ApiError("Session expired", 401);
    }
    token = session.accessToken;
  }

  let res = await send(path, options, token);

  // Access token rejected: rotate once and retry.
  if (res.status === 401 && options.auth && token) {
    const ok = await refreshSession(token);
    const next = getSession();
    if (ok && next) {
      res = await send(path, options, next.accessToken);
    }
  }

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── Refresh-token rotation ─────────────────────────────────────────
//
// The API rotates refresh tokens (each is single-use) and treats re-use of a
// revoked token as theft, revoking every token for the user. So concurrent
// refreshes must collapse into one — within a tab (shared promise) and across
// tabs (Web Locks + re-reading storage).

let inFlight: Promise<boolean> | null = null;

/**
 * Refresh the session. `staleAccessToken` is the token that just failed/expired;
 * if storage already holds a different one, another tab refreshed and we adopt it.
 * Resolves true when a usable session is available afterwards.
 */
export function refreshSession(staleAccessToken: string): Promise<boolean> {
  if (!inFlight) {
    inFlight = withRefreshLock(() => doRefresh(staleAccessToken)).finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("taskmaster.refresh", fn) as Promise<T>;
  }
  return fn();
}

async function doRefresh(staleAccessToken: string): Promise<boolean> {
  // Another tab may have rotated while we waited for the lock.
  const stored = readStoredSession();
  if (stored && stored.accessToken !== staleAccessToken && !accessTokenExpiring(stored)) {
    adoptSession(stored);
    return true;
  }

  const refreshToken = (stored ?? getSession())?.refreshToken;
  if (!refreshToken) {
    clearSession();
    return false;
  }

  let res: Response;
  try {
    res = await send("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }, null);
  } catch {
    // Network failure: keep the session, the caller will surface the error.
    return false;
  }

  if (!res.ok) {
    // 400/401 → token invalid, expired or revoked. Anything else (5xx) is transient.
    if (res.status === 400 || res.status === 401) clearSession();
    return false;
  }

  saveSession((await res.json()) as AuthResponse);
  return true;
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

  /** Revokes the refresh token server-side. Best effort; never throws. */
  async logout(refreshToken: string) {
    try {
      await send("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
        keepalive: true,
      }, null);
    } catch {
      /* ignore */
    }
  },

  listTasks(date = todayIso()) {
    return request<TaskItem[]>(
      `/tasks?date=${encodeURIComponent(date)}`,
      { auth: true },
    );
  },

  createTask(body: CreateTaskRequest) {
    return request<TaskItem>("/tasks", {
      method: "POST",
      auth: true,
      body: JSON.stringify(body),
    });
  },

  completeTask(taskId: string, date = todayIso()) {
    return request<void>(`/tasks/${taskId}/complete`, {
      method: "POST",
      auth: true,
      body: JSON.stringify({ date }),
    });
  },

  archiveTask(taskId: string) {
    return request<void>(`/tasks/${taskId}`, {
      method: "DELETE",
      auth: true,
    });
  },

  heatmap(from: string, to: string) {
    return request<HeatmapResponse>(
      `/metrics/heatmap?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { auth: true },
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
