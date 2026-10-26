import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import type { Bootstrap } from "../../../shared/mobile-api";
import { ApiError, login, request } from "./api";

const TOKEN_KEY = "monexa.mobile.session";
type SessionContext = {
  token: string | null; data: Bootstrap | null; loading: boolean; error: string;
  revision: number; refresh(): Promise<void>; signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>; api<T>(path: string, method?: string, body?: unknown): Promise<T>;
  changed(): Promise<void>;
};
const Context = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const currentToken = useRef<string | null>(null);

  const clear = useCallback(async () => {
    // Delete first: if secure storage fails, do not pretend logout succeeded.
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    currentToken.current = null; setToken(null); setData(null); setError("");
  }, []);
  const api = useCallback(async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
    const active = currentToken.current;
    try { return await request<T>(path, active, method, body); }
    catch (err) {
      if (err instanceof ApiError && err.status === 401 && currentToken.current === active) await clear();
      throw err;
    }
  }, [clear]);
  const refresh = useCallback(async () => {
    const active = currentToken.current;
    if (!active) return;
    setError("");
    try {
      const next = await api<Bootstrap>("bootstrap");
      if (currentToken.current === active) setData(next);
    } catch (err) { if (currentToken.current === active) setError((err as Error).message); throw err; }
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (cancelled) return;
        currentToken.current = saved; setToken(saved);
        if (saved) await refresh();
      } catch (err) { if (!cancelled) setError((err as Error).message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  async function signIn(email: string, password: string) {
    const result = await login(email.trim(), password);
    try { await SecureStore.setItemAsync(TOKEN_KEY, result.token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }); }
    catch (err) { await request("logout", result.token, "POST").catch(() => {}); throw err; }
    currentToken.current = result.token; setToken(result.token);
    await refresh();
  }
  async function signOut() {
    // Require server revocation; failed logout leaves a visible retry path.
    await api("logout", "POST");
    await clear();
  }
  const changed = useCallback(async () => {
    setRevision(value => value + 1);
    // A failed totals refresh must not make a successful save look unsaved.
    await refresh().catch(() => {});
  }, [refresh]);

  return <Context.Provider value={{ token, data, loading, error, revision, refresh, signIn, signOut, api, changed }}>{children}</Context.Provider>;
}
export function useSession() {
  const session = useContext(Context);
  if (!session) throw new Error("SessionProvider is missing");
  return session;
}
