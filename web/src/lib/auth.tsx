"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";
import {
  SESSION_STORAGE_KEY,
  adoptSession,
  clearSession,
  getSession,
  loadSession,
  readStoredSession,
  saveSession,
  subscribeSession,
  type Session,
} from "./session";
import type { AuthResponse } from "./types";

/**
 * Only the user's identity lives in React state. Tokens stay in the session
 * store so a silent refresh doesn't re-render (and refetch) the whole app.
 */
type AuthState = {
  userId: string;
  email: string;
  displayName: string;
} | null;

type AuthContextValue = {
  auth: AuthState;
  ready: boolean;
  setSession: (data: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function toIdentity(s: Session | null): AuthState {
  return s ? { userId: s.userId, email: s.email, displayName: s.displayName } : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuth(toIdentity(loadSession()));
    setReady(true);

    // Keep identity stable across token rotations; only change on sign-in/out.
    const unsubscribe = subscribeSession((s) => {
      setAuth((prev) => {
        const next = toIdentity(s);
        if (
          prev &&
          next &&
          prev.userId === next.userId &&
          prev.displayName === next.displayName &&
          prev.email === next.email
        ) {
          return prev;
        }
        return next;
      });
    });

    // Another tab signed in/out or rotated tokens.
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY || e.key === null) {
        adoptSession(readStoredSession());
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const setSession = useCallback((data: AuthResponse) => {
    saveSession(data);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getSession()?.refreshToken;
    clearSession();
    if (refreshToken) void api.logout(refreshToken);
  }, []);

  const value = useMemo(
    () => ({ auth, ready, setSession, logout }),
    [auth, ready, setSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
