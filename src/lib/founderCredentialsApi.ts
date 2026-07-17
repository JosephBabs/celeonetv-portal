import { founderApi } from "./founderApi";
import { auth } from "./firebase";

export type FounderCredentialResponse = {
  ok: boolean;
  founder: Record<string, unknown> | null;
  application?: Record<string, unknown> | null;
  history?: Array<Record<string, unknown>>;
};

async function authorizedBlob(url: string) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("AUTH_REQUIRED");
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("ASSET_FETCH_FAILED");
  return response.blob();
}

export async function getFounderCredentials() {
  return founderApi<FounderCredentialResponse>("/api/founders/credentials", { method: "GET" });
}

export async function retryFounderCredentialGeneration() {
  return founderApi<FounderCredentialResponse>("/api/founders/credentials", {
    method: "POST",
    body: JSON.stringify({ action: "retry_generation" }),
  });
}

export async function loadFounderAsset(kind: string) {
  const blob = await authorizedBlob(`/api/founders/asset?kind=${encodeURIComponent(kind)}`);
  return URL.createObjectURL(blob);
}

export async function getAdminFounderCredentials(founderId: string) {
  return founderApi<FounderCredentialResponse>(`/api/admin/founders/credentials?founderId=${encodeURIComponent(founderId)}`, { method: "GET" });
}

export async function adminFounderAction(payload: Record<string, unknown>) {
  return founderApi<Record<string, unknown>>("/api/admin/founders/credentials", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loadAdminFounderAsset(founderId: string, kind: string) {
  const blob = await authorizedBlob(`/api/admin/founders/asset?founderId=${encodeURIComponent(founderId)}&kind=${encodeURIComponent(kind)}`);
  return URL.createObjectURL(blob);
}
