import { auth } from "./firebase";

type ApiInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

async function authHeaders(extra: Record<string, string> = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("AUTH_REQUIRED");
  const token = await user.getIdToken();
  return {
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
    ...extra,
  };
}

export async function founderApi<T>(path: string, init: ApiInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: await authHeaders(init.headers),
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "REQUEST_FAILED");
  return body;
}
