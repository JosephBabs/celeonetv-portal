import { getPortalToken } from "./laravelAuth";

type ApiInit = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

function authHeaders(extra: Record<string, string> = {}) {
  const token = getPortalToken();
  if (!token) throw new Error("AUTH_REQUIRED");
  return {
    Authorization: `Bearer ${token}`,
    "content-type": "application/json",
    "x-celeone-client": "founders-portal-web",
    ...extra,
  };
}

export async function founderApi<T>(path: string, init: ApiInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: authHeaders(init.headers),
  });
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "REQUEST_FAILED");
  return body;
}
