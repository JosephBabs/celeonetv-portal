import { googleAuthorizedFetch, storageBucket } from "./firebase-admin";
import type { PortalEnv } from "./types";

function bucketName(env: PortalEnv) {
  return storageBucket(env);
}

function firebaseDownloadUrl(bucket: string, objectName: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectName)}?alt=media&token=${encodeURIComponent(token)}`;
}

function boundary() {
  return `celeone-${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function multipartBody(metadata: Record<string, unknown>, contentType: string, bytes: Uint8Array) {
  const marker = boundary();
  const encoder = new TextEncoder();
  const head = encoder.encode(
    `--${marker}\r\ncontent-type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${marker}\r\ncontent-type: ${contentType}\r\n\r\n`,
  );
  const tail = encoder.encode(`\r\n--${marker}--`);
  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);
  return { marker, body };
}

export async function uploadStorageObject(env: PortalEnv, path: string, bytes: Uint8Array, contentType: string) {
  const bucket = bucketName(env);
  const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const metadata = {
    name: path,
    metadata: {
      firebaseStorageDownloadTokens: token,
    },
    contentType,
  };
  const { marker, body } = multipartBody(metadata, contentType, bytes);
  const response = await googleAuthorizedFetch(
    env,
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=multipart`,
    {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${marker}` },
      body,
    },
  );
  const payload = await response.json().catch(() => ({})) as { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message || "STORAGE_UPLOAD_FAILED");
  return {
    bucket,
    path,
    downloadToken: token,
    downloadUrl: firebaseDownloadUrl(bucket, path, token),
  };
}

export async function downloadStorageObject(env: PortalEnv, path: string) {
  const bucket = bucketName(env);
  const response = await googleAuthorizedFetch(
    env,
    `https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?alt=media`,
  );
  if (response.status === 404) throw new Error("STORAGE_OBJECT_NOT_FOUND");
  if (!response.ok) throw new Error("STORAGE_DOWNLOAD_FAILED");
  return response;
}
