"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthResponse } from "./types";

const STORAGE_KEY = "taskmaster.auth";

type AuthState = {
  userId: string;
  email: string;
  displayName: string;
  accessToken: string;
  expiresAtUtc: string;
} | null;

type AuthContextValue = {
  auth: AuthState;
  ready: boolean;
  setSession: (data: AuthResponse) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStorage(): AuthState {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    if (stored?.expiresAtUtc) {
      const expired = new Date(stored.expiresAtUtc).getTime() <= Date.now();
      if (expired) {
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      } else {
        setAuth(stored);
      }
    }
    setReady(true);
  }, []);

  const setSession = useCallback((data: AuthResponse) => {
    const next: AuthState = {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      accessToken: data.accessToken,
      expiresAtUtc: data.expiresAtUtc,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
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
