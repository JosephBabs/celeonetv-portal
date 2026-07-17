import { bearerToken } from "./http";
import type { PortalEnv } from "./types";

type FirestoreValue = Record<string, unknown>;
type FirebaseUser = { uid: string; email: string };
let cachedAccessToken: { value: string; expiresAt: number } | null = null;

function base64Url(value: string | ArrayBuffer) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function accessToken(env: PortalEnv) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.value;
  const email = env.FIREBASE_SERVICE_ACCOUNT_EMAIL || "";
  const pem = (env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!email || !pem) throw new Error("FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: email,
    sub: email,
    aud: "https://oauth2.googleapis.com/token",
    scope: "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase",
    iat: now,
    exp: now + 3600,
  }));
  const keyBytes = Uint8Array.from(atob(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "")), (char) => char.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", keyBytes, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claim}.${base64Url(signature)}` }),
  });
  const body = await response.json() as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !body.access_token) throw new Error(body.error || "FIREBASE_TOKEN_ERROR");
  cachedAccessToken = { value: body.access_token, expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000 };
  return cachedAccessToken.value;
}

function projectId(env: PortalEnv) {
  if (!env.FIREBASE_PROJECT_ID) throw new Error("FIREBASE_PROJECT_ID_NOT_CONFIGURED");
  return env.FIREBASE_PROJECT_ID;
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  const fields = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, encodeValue(item)]));
  return { mapValue: { fields } };
}

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return ((value.arrayValue as { values?: FirestoreValue[] }).values || []).map(decodeValue);
  if ("mapValue" in value) return decodeFields((value.mapValue as { fields?: Record<string, FirestoreValue> }).fields || {});
  return null;
}

function encodeFields(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

function decodeFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

async function firestoreFetch(env: PortalEnv, path: string, init: RequestInit = {}) {
  const token = await accessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${projectId(env)}/databases/(default)/documents${path}`;
  return fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "content-type": "application/json", ...init.headers } });
}

export async function getDocument(env: PortalEnv, path: string) {
  const response = await firestoreFetch(env, `/${path.split("/").map(encodeURIComponent).join("/")}`);
  if (response.status === 404) return null;
  const body = await response.json() as { fields?: Record<string, FirestoreValue>; name?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "FIRESTORE_READ_ERROR");
  return { id: String(body.name || "").split("/").pop() || "", ...decodeFields(body.fields || {}) };
}

export async function createDocument(env: PortalEnv, collection: string, id: string, data: Record<string, unknown>) {
  const response = await firestoreFetch(env, `/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  if (response.status === 409) return { created: false };
  const body = await response.json() as { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "FIRESTORE_CREATE_ERROR");
  return { created: true };
}

export async function addDocument(env: PortalEnv, collection: string, data: Record<string, unknown>) {
  const response = await firestoreFetch(env, `/${encodeURIComponent(collection)}`, { method: "POST", body: JSON.stringify({ fields: encodeFields(data) }) });
  const body = await response.json() as { name?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "FIRESTORE_CREATE_ERROR");
  return String(body.name || "").split("/").pop() || "";
}

export async function updateDocument(env: PortalEnv, path: string, data: Record<string, unknown>) {
  const fieldPaths = Object.keys(data).map((key) => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
  const response = await firestoreFetch(env, `/${path.split("/").map(encodeURIComponent).join("/")}?${fieldPaths}`, {
    method: "PATCH",
    body: JSON.stringify({ fields: encodeFields(data) }),
  });
  const body = await response.json() as { error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "FIRESTORE_UPDATE_ERROR");
}

export async function queryEquals(env: PortalEnv, collectionId: string, fieldPath: string, value: string, max = 10) {
  const token = await accessToken(env);
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId(env)}/databases/(default)/documents:runQuery`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId }],
      where: { fieldFilter: { field: { fieldPath }, op: "EQUAL", value: encodeValue(value) } },
      limit: max,
    } }),
  });
  const rows = await response.json() as Array<{ document?: { name?: string; fields?: Record<string, FirestoreValue> } }>;
  if (!response.ok) throw new Error("FIRESTORE_QUERY_ERROR");
  return rows.filter((row) => row.document).map((row) => ({ id: String(row.document?.name || "").split("/").pop() || "", ...decodeFields(row.document?.fields || {}) }));
}

export async function listDocuments(env: PortalEnv, collection: string, pageSize = 50, pageToken = "") {
  const params = new URLSearchParams({ pageSize: String(Math.min(pageSize, 100)), orderBy: "createdAt desc" });
  if (pageToken) params.set("pageToken", pageToken);
  const response = await firestoreFetch(env, `/${encodeURIComponent(collection)}?${params}`);
  const body = await response.json() as { documents?: Array<{ name?: string; fields?: Record<string, FirestoreValue> }>; nextPageToken?: string; error?: { message?: string } };
  if (!response.ok) throw new Error(body.error?.message || "FIRESTORE_LIST_ERROR");
  return {
    rows: (body.documents || []).map((doc) => ({ id: String(doc.name || "").split("/").pop() || "", ...decodeFields(doc.fields || {}) })),
    nextPageToken: body.nextPageToken || "",
  };
}

export async function requireFirebaseUser(request: Request, env: PortalEnv): Promise<FirebaseUser> {
  const idToken = bearerToken(request);
  if (!idToken || !env.FIREBASE_WEB_API_KEY) throw new Error("UNAUTHORIZED");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_WEB_API_KEY)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const body = await response.json() as { users?: Array<{ localId?: string; email?: string }> };
  const user = body.users?.[0];
  if (!response.ok || !user?.localId) throw new Error("UNAUTHORIZED");
  return { uid: user.localId, email: String(user.email || "").trim().toLowerCase() };
}

export async function requireAdmin(request: Request, env: PortalEnv) {
  const user = await requireFirebaseUser(request, env);
  const profile = await getDocument(env, `user_data/${user.uid}`) as { role?: string; isAdmin?: boolean } | null;
  const role = String(profile?.role || "").toLowerCase();
  if (!profile?.isAdmin && role !== "admin" && role !== "super_admin") throw new Error("FORBIDDEN");
  return user;
}
