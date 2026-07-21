import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Session } from "../types";

const SESSION_STORAGE_KEY = "trustlist.session";

interface AuthContextValue {
  session: Session | null;
  setSession: (session: Session) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(readStoredSession);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setSession: (next) => {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));
        setSessionState(next);
      },
      logout: () => {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setSessionState(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
