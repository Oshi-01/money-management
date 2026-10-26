import type { LoginResult } from "../../../shared/mobile-api";

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

function apiBase() {
  const value = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!value) throw new Error("The app’s server address has not been configured. Set EXPO_PUBLIC_API_URL and restart Expo.");
  const url = new URL(value);
  if (url.protocol !== "https:" && !(__DEV__ && url.protocol === "http:")) throw new Error("A secure HTTPS server address is required.");
  return value;
}

export async function request<T>(path: string, token: string | null, method = "GET", body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${apiBase()}/api/mobile/${path}`, {
      method, signal: controller.signal,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(data?.error ?? "The server could not complete this request.", response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new Error("The request timed out. Check your records before retrying a change.");
    if (error instanceof TypeError) throw new Error("Could not reach Monexa. Check your internet connection and try again.");
    throw error;
  } finally { clearTimeout(timeout); }
}

export const login = (email: string, password: string) => request<LoginResult>("login", null, "POST", { email, password });
