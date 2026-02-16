/* eslint-disable @typescript-eslint/no-explicit-any */
// src/worker.ts
// Cloudflare Worker + Static Assets (Wrangler "assets") + SPA + Dynamic OG tags for /posts/:id
// - Serves your Vite dist via env.ASSETS.fetch
// - Injects OG/Twitter meta tags for WhatsApp/Facebook previews
// - Uses a short timeout for Firestore fetch to avoid 522 timeouts for bots
// - Removes any existing og:/twitter: tags + <title> from index.html to avoid duplicates

export interface Env {
  FIREBASE_PROJECT_ID?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

function escapeHtml(s: string) {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isHtml(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("text/html");
}

async function fetchWithTimeout(url: string, ms: number, init?: RequestInit) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...(init || {}), signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function stripExistingSocialMeta(html: string) {
  // Remove duplicates from index.html (some scrapers choose the first og:title they see)
  return html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1) Serve assets safely (never crash)
    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        baseRes = await env.ASSETS.fetch(request);
      } else {
        // If ASSETS binding is missing, avoid crashing (still serves something)
        baseRes = await fetch(request);
      }
    } catch {
      return new Response("Worker assets fetch failed", { status: 500 });
    }

    // 2) Only handle /posts/:id
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) return baseRes;

    // 3) Only inject into HTML (index.html)
    if (!isHtml(baseRes)) return baseRes;

    const postId = m[1];

    // 4) Defaults (so we can always respond fast)
    let title = "Celeone TV";
    let description = "Celeone TV";
    let image = "https://celeonetv.com/logo.png";

    // 5) Fetch post data from Firestore REST (fast timeout to avoid 522 for bot UAs)
    // NOTE: This only works if your Firestore rules allow read for this doc/fields.
    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;

        // 2.5s timeout (tweak 1500–3000ms depending on your needs)
        const fr = await fetchWithTimeout(firebaseURL, 2500);

        if (fr.ok) {
          const data: any = await fr.json();
          const fields = data?.fields || {};

          const titleRaw = fields.title?.stringValue || title;
          const contentRaw = fields.content?.stringValue || "";
          const imageRaw = fields.image?.stringValue || image;

          title = String(titleRaw || title);
          description = String(contentRaw || "")
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 180);

          image = String(imageRaw || image);
        }
      }
    } catch {
      // ignore errors/timeouts and keep defaults (prevents 522)
    }

    // 6) Build OG meta
    const pageUrl = `https://celeonetv.com/posts/${postId}`;

    const meta = `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
`.trim();

    // 7) Inject into HTML
    let html = await baseRes.text();
    html = stripExistingSocialMeta(html);

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    } else {
      // Very rare, but keep safe
      html = `${meta}\n${html}`;
    }

    // 8) Return modified HTML; preserve headers but ensure correct content-type
    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");

    // Avoid stale previews/caches (WhatsApp caches aggressively)
    headers.set("cache-control", "no-store");

    return new Response(html, {
      status: baseRes.status,
      headers,
    });
  },
};
