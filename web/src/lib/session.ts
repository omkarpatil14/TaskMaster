import type { AuthResponse } from "./types";

/**
 * Token store shared by the API client and the React auth context.
 * Lives outside React so `api.ts` can read the latest tokens and rotate
 * them without re-rendering the whole app on every silent refresh.
 */

const STORAGE_KEY = "taskmaster.auth";

export type Session = {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  expiresAtUtc: string;
  /** Missing on sessions stored before refresh tokens existed. */
  refreshToken?: string;
  refreshTokenExpiresAtUtc?: string;
};

type Listener = (session: Session | null) => void;

let current: Session | null = null;
const listeners = new Set<Listener>();

function isFuture(iso: string | undefined): boolean {
  return !!iso && new Date(iso).getTime() > Date.now();
}

/** A session is usable if either the access token or the refresh token is still valid. */
function isUsable(s: Session | null): s is Session {
  if (!s) return false;
  if (s.refreshToken && isFuture(s.refreshTokenExpiresAtUtc)) return true;
  return isFuture(s.expiresAtUtc);
}

export function readStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return isUsable(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function emit() {
  for (const fn of listeners) fn(current);
}

/** Load from localStorage (call once on the client). Clears an unusable session. */
export function loadSession(): Session | null {
  current = readStoredSession();
  if (!current) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
  return current;
}

export function getSession(): Session | null {
  return current;
}

export function saveSession(data: AuthResponse) {
  current = {
    userId: data.userId,
    email: data.email,
    displayName: data.displayName,
    accessToken: data.accessToken,
    expiresAtUtc: data.expiresAtUtc,
    refreshToken: data.refreshToken,
    refreshTokenExpiresAtUtc: data.refreshTokenExpiresAtUtc,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  emit();
}

/** Adopt a session another tab already wrote to storage. */
export function adoptSession(session: Session | null) {
  current = session;
  emit();
}

export function clearSession() {
  current = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function subscribeSession(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** True when the access token expires within `skewMs`. */
export function accessTokenExpiring(s: Session, skewMs = 30_000): boolean {
  return new Date(s.expiresAtUtc).getTime() - skewMs <= Date.now();
}

export const SESSION_STORAGE_KEY = STORAGE_KEY;
