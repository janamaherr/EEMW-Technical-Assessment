"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { setUnauthorizedHandler } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import { clearToken, getToken, setToken } from "@/lib/auth/token";
import type { User } from "@/types/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: api.SignupInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Restores the session from a stored token (null when there is none or it is invalid). */
async function loadSession(): Promise<User | null> {
  if (!getToken()) return null;
  try {
    return await api.getMe();
  } catch {
    clearToken();
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<{ status: AuthStatus; user: User | null }>({
    status: "loading",
    user: null,
  });
  const expiredNoticeShown = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadSession().then((user) => {
      if (cancelled) return;
      setState(user ? { status: "authenticated", user } : { status: "unauthenticated", user: null });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any authenticated request that gets a 401 (expired/invalid token) ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ status: "unauthenticated", user: null });
      if (!expiredNoticeShown.current) {
        expiredNoticeShown.current = true;
        toast.error("Your session has expired. Please log in again.");
      }
      router.replace("/login");
    });
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    setToken(token);
    expiredNoticeShown.current = false;
    setState({ status: "authenticated", user });
  }, []);

  const signup = useCallback(async (input: api.SignupInput) => {
    const { token, user } = await api.signup(input);
    setToken(token);
    expiredNoticeShown.current = false;
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ status: "unauthenticated", user: null });
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ ...state, login, signup, logout }),
    [state, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

/** For pages behind RequireAuth, where the user is guaranteed to be present. */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser must be used inside a protected page");
  return user;
}
