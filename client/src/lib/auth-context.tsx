"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import Cookies from "js-cookie";

export type Role =
  | "FACULTY_COORDINATOR"
  | "STUDENT_COORDINATOR"
  | "DEVELOPMENT_TEAM"
  | "SOCIAL_MEDIA_COORDINATOR"
  | "MEMBER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  studentId?: string;
  employeeId?: string;
  phone?: string;
  department?: string;
  institute?: string;
  isApproved: boolean;
  clubId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string, extra?: { studentId?: string; employeeId?: string; phone?: string; department?: string; institute?: string; clubId?: string; newClubName?: string; newClubSlug?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Inactivity Timeout (Point 9)

const isPageReload = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const navEntries = window.performance?.getEntriesByType?.("navigation");
    if (navEntries && navEntries.length > 0) {
      return (navEntries[0] as PerformanceNavigationTiming).type === "reload";
    }
    return window.performance?.navigation?.type === 1;
  } catch {
    return false;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    setUser(null);
    setToken(null);
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("deviceFingerprint", { path: "/" });
    try {
      localStorage.removeItem("token");
      sessionStorage.removeItem("sentinel_active_session");
      sessionStorage.setItem("sentinel_session_terminated", "true");
    } catch { /* ignore */ }
    
    try {
      await api("/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
  }, []);

  // Inactivity Listener (Point 9)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (user) {
      inactivityTimerRef.current = setTimeout(() => {
        console.warn("[Auth] User logged out due to 15-minute inactivity timeout.");
        logout();
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    resetInactivityTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  const fetchMe = useCallback(async (initialToken?: string) => {
    try {
      const data = await api<{ user: User; accessToken?: string }>("/auth/me", {
        token: initialToken || undefined,
      });
      setUser(data.user);
      setToken(data.accessToken || initialToken || "session_active");
    } catch {
      setUser(null);
      setToken(null);
    }
  }, []);

  useEffect(() => {
    const handleInitialAuth = async () => {
      try {
        const reloaded = isPageReload();
        const terminated = typeof window !== "undefined" && sessionStorage.getItem("sentinel_session_terminated") === "true";
        const hasActiveSession = typeof window !== "undefined" && sessionStorage.getItem("sentinel_active_session") === "true";

        // Deterministic session lifecycle:
        // 1. If page was refreshed/reloaded -> fully invalidate session, user must log in again
        // 2. If browser was closed and reopened -> sentinel_active_session is missing -> require login
        // 3. If session was terminated -> require login
        if (reloaded || terminated || !hasActiveSession) {
          await logout();
          setIsLoading(false);
          return;
        }
      } catch { /* ignore */ }

      fetchMe().finally(() => setIsLoading(false));
    };

    handleInitialAuth();
  }, [fetchMe, logout]);

  const login = async (email: string, password: string) => {
    try {
      sessionStorage.setItem("sentinel_active_session", "true");
      sessionStorage.removeItem("sentinel_session_terminated");
    } catch { /* ignore */ }
    const deviceFingerprint = getDeviceFingerprint();
    const data = await api<{ user: User; accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, deviceFingerprint }),
    });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const loginWithGoogle = async (credential: string) => {
    try {
      sessionStorage.setItem("sentinel_active_session", "true");
      sessionStorage.removeItem("sentinel_session_terminated");
    } catch { /* ignore */ }
    const deviceFingerprint = getDeviceFingerprint();
    const data = await api<{ user: User; accessToken: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, deviceFingerprint }),
    });
    setUser(data.user);
    setToken(data.accessToken);
  };

  const register = async (name: string, email: string, password: string, extra?: { studentId?: string; employeeId?: string; phone?: string; department?: string; institute?: string; clubId?: string; newClubName?: string; newClubSlug?: string }) => {
    try {
      sessionStorage.removeItem("sentinel_session_terminated");
    } catch { /* ignore */ }
    const deviceFingerprint = getDeviceFingerprint();
    const data = await api<{ user: User; accessToken: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, deviceFingerprint, ...extra }),
    });
    setUser(data.user);
    setToken(data.accessToken);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithGoogle, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
