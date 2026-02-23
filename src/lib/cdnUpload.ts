const CDN_BASE = "https://cdn.celeonetv.com";

export type CdnUploadKind = "posts" | "song" | "vfilm";

function endpointFor(kind: CdnUploadKind) {
  if (kind === "song") return `${CDN_BASE}/api/uploads/posts/song`;
  if (kind === "vfilm") return `${CDN_BASE}/api/uploads/posts/vfilm`;
  return `${CDN_BASE}/api/uploads/posts/`;
}

function normalizeUrl(value: string) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("/")) return `${CDN_BASE}${v}`;
  return `${CDN_BASE}/${v}`;
}

function extractUploadedUrl(payload: any): string {
  const candidates = [
    payload?.url,
    payload?.secure_url,
    payload?.fileUrl,
    payload?.location,
    payload?.path,
    payload?.data?.url,
    payload?.data?.fileUrl,
    payload?.result?.url,
    Array.isArray(payload?.files) ? payload.files[0]?.url : "",
    Array.isArray(payload?.data) ? payload.data[0]?.url : "",
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return normalizeUrl(candidate);
  }
  return "";
}

export async function uploadToCeleoneCdn(file: File, kind: CdnUploadKind): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(endpointFor(kind), {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed (${res.status})`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json().catch(() => null);
    const found = extractUploadedUrl(json);
    if (found) return found;
  } else {
    const text = await res.text().catch(() => "");
    const cleaned = normalizeUrl(text);
    if (cleaned) return cleaned;
  }

  throw new Error("Upload succeeded but URL was not returned by CDN.");
}
