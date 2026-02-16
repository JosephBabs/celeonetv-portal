/* eslint-disable @typescript-eslint/no-explicit-any */
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
  // Remove duplicates coming from index.html
  return html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

function buildMeta(opts: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  const title = escapeHtml(opts.title);
  const description = escapeHtml(opts.description);
  const image = escapeHtml(opts.image);
  const url = escapeHtml(opts.url);

  // Add both OG + Twitter + some extra fields that some platforms like
  return `
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:url" content="${url}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />

<link rel="canonical" href="${url}" />
`.trim();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Many scrapers use HEAD first → handle HEAD by internally doing GET
    const isHead = request.method.toUpperCase() === "HEAD";
    const reqForAssets = isHead
      ? new Request(request.url, { method: "GET", headers: request.headers })
      : request;

    // Serve assets (never crash)
    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        baseRes = await env.ASSETS.fetch(reqForAssets);
      } else {
        baseRes = await fetch(reqForAssets);
      }
    } catch {
      return new Response("Assets fetch failed", { status: 500 });
    }

    // Only apply dynamic meta to /posts/:id
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) {
      // For HEAD on other pages, return headers-only
      if (isHead) return new Response(null, { status: baseRes.status, headers: baseRes.headers });
      return baseRes;
    }

    if (!isHtml(baseRes)) {
      if (isHead) return new Response(null, { status: baseRes.status, headers: baseRes.headers });
      return baseRes;
    }

    const postId = m[1];

    // Defaults (always return fast)
    let title = "Celeone TV";
    let description = "Découvrez les contenus sur Celeone TV.";
    let image = "https://celeonetv.com/logo.png";

    // Fetch Firestore quickly (avoid 522)
    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
        const fr = await fetchWithTimeout(firebaseURL, 2000);

        if (fr.ok) {
          const data: any = await fr.json();
          const fields = data?.fields || {};

          const t = fields.title?.stringValue;
          const c = fields.content?.stringValue;
          const img = fields.image?.stringValue;

          if (t) title = String(t);
          if (c) description = String(c).trim().replace(/\s+/g, " ").slice(0, 180);
          if (img) image = String(img);
        }
      }
    } catch {
      // keep defaults
    }

    const pageUrl = `https://celeonetv.com/posts/${postId}`;

    // Modify HTML
    let html = await baseRes.text();
    html = stripExistingSocialMeta(html);

    const meta = buildMeta({ title, description, image, url: pageUrl });

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    } else {
      html = `${meta}\n${html}`;
    }

    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");

    // Don’t cache dynamic HTML (previews change & WhatsApp caches aggressively)
    headers.set("cache-control", "no-store");

    // Optional: helpful for bots
    headers.set("x-robots-tag", "index, follow");

    // HEAD response: headers only
    if (isHead) return new Response(null, { status: baseRes.status, headers });

    return new Response(html, { status: baseRes.status, headers });
  },
};
