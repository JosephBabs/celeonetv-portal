const API_BASE = (import.meta.env.VITE_LARAVEL_API_URL || "https://api.celeonetv.com/api/v1").replace(/\/$/, "");
const TOKEN_KEY = "celeone.portal.access_token.v1";
const AUTH_EVENT = "celeone:portal-auth-changed";
let currentUserPromise: Promise<PortalUser | null> | null = null;

export type PortalUser = {
  id: number | string;
  uid: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  role?: string;
  isAdmin?: boolean;
  [key: string]: unknown;
};

type ApiEnvelope<T> = { ok?: boolean; data?: T; error?: unknown; message?: string; errors?: Record<string, string[]> };
type SessionData = { user?: Record<string, unknown>; user_data?: Record<string, unknown> | null };

export function getPortalToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setPortalToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  currentUserPromise = null;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function subscribePortalAuth(listener: () => void) {
  window.addEventListener(AUTH_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(AUTH_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

function errorText(body: ApiEnvelope<unknown>, status: number) {
  const error = body.error;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) return String((error as { message: unknown }).message);
  const firstFieldError = Object.values(body.errors || {}).flat()[0];
  return firstFieldError || body.message || (status === 401 ? "Invalid email or password." : "The request could not be completed.");
}

export async function laravelRequest<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  const token = getPortalToken();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (authenticated && token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE}${path.startsWith("/") ? path : `/${path}`}`, { ...init, headers });
  const body = await response.json().catch(() => ({})) as ApiEnvelope<T>;
  if (!response.ok) {
    const error = new Error(errorText(body, response.status)) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body.data as T;
}

function toPortalUser(user: Record<string, unknown>, profile?: Record<string, unknown> | null): PortalUser {
  const role = String(profile?.role || user.role || "user");
  const firebaseUid = String(user.firebase_uid || user.firebaseUid || "").trim();
  const id = (user.id as string | number) ?? firebaseUid;
  return {
    ...user,
    ...(profile || {}),
    id,
    uid: firebaseUid || String(id),
    email: String(user.email || ""),
    name: String(profile?.displayName || user.name || "") || null,
    displayName: String(profile?.displayName || user.name || "") || null,
    role,
    isAdmin: Boolean(profile?.isAdmin) || ["admin", "super_admin"].includes(role.toLowerCase()),
  };
}

export async function currentPortalUser(): Promise<PortalUser | null> {
  if (!getPortalToken()) return null;
  if (currentUserPromise) return currentUserPromise;
  const request = (async () => {
    try {
      const session = await laravelRequest<SessionData>("/auth/me", {}, true);
      if (!session?.user) return null;
      return toPortalUser(session.user, session.user_data);
    } catch (error) {
      if ((error as Error & { status?: number })?.status === 401) setPortalToken(null);
      return null;
    }
  })();
  currentUserPromise = request;
  try { return await request; }
  finally { if (currentUserPromise === request) currentUserPromise = null; }
}

export async function loginWithLaravel(email: string, password: string) {
  const result = await laravelRequest<{ access_token?: string; token?: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password, device_name: "celeone-portal-web" }),
  });
  const token = String(result?.access_token || result?.token || "").trim();
  if (!token) throw new Error("The backend did not return an access token.");
  setPortalToken(token);
  const user = await currentPortalUser();
  if (!user) throw new Error("Could not load your account from the backend.");
  return user;
}

export async function registerWithLaravel(input: { name: string; email: string; password: string }) {
  const result = await laravelRequest<{ access_token?: string; token?: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ ...input, password_confirmation: input.password, device_name: "celeone-portal-web" }),
  });
  const token = String(result?.access_token || result?.token || "").trim();
  if (!token) throw new Error("The backend did not return an access token.");
  setPortalToken(token);
  const user = await currentPortalUser();
  if (!user) throw new Error("Could not load your account from the backend.");
  return user;
}

export async function logoutFromLaravel() {
  const token = getPortalToken();
  setPortalToken(null);
  if (!token) return;
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
  } catch (error) {
    console.warn("Laravel logout token revoke failed after local logout", error);
  }
}

export async function updateLaravelProfile(payload: Record<string, unknown>) {
  return laravelRequest<unknown>("/me/profile", { method: "PATCH", body: JSON.stringify(payload) }, true);
}
