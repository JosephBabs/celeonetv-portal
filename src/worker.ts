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

async function fetchWithTimeout(url: string, ms: number) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function stripExistingSocialMeta(html: string) {
  return html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

/**
 * Try to convert some common image URLs to a smaller version.
 * This only helps if your storage/CDN supports these params.
 * If it doesn't, it still returns a valid URL (original).
 */
function preferSmallerImage(url: string) {
  if (!url) return url;

  try {
    const u = new URL(url);

    // If it's already a jpg/jpeg/webp, good. If not, still okay.
    // Add common "size" query for some CDNs. If ignored, harmless.
    // (WhatsApp likes smaller files; keeping it simple)
    if (!u.searchParams.has("w")) u.searchParams.set("w", "1200");
    if (!u.searchParams.has("h")) u.searchParams.set("h", "630");

    // Some CDNs accept quality
    if (!u.searchParams.has("q")) u.searchParams.set("q", "70");

    // Some accept format
    if (!u.searchParams.has("fm")) u.searchParams.set("fm", "jpg");

    return u.toString();
  } catch {
    return url;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // 1) HEAD fast-path (prevents 522 / scraper failures)
    if (method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "no-store",
        },
      });
    }

    if (method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    // 2) Serve assets
    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        baseRes = await env.ASSETS.fetch(request);
      } else {
        baseRes = await fetch(request);
      }
    } catch {
      return new Response("Assets fetch failed", { status: 500 });
    }

    // 3) Only inject for /posts/:id
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) return baseRes;
    if (!isHtml(baseRes)) return baseRes;

    const postId = m[1];

    // Defaults
    let title = "Celeone TV";
    let description = "Découvrez les contenus sur Celeone TV.";
    let image = "https://celeonetv.com/logo.png";

    // 4) Firestore fetch
    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
        const fr = await fetchWithTimeout(firebaseURL, 2000);

        if (fr.ok) {
          const data: any = await fr.json();
          const fields = data?.fields || {};

          // ✅ Prefer explicit share fields (YOU create these as optimized)
          const shareTitle = fields.shareTitle?.stringValue;
          const shareDesc = fields.shareDescription?.stringValue;
          const shareImage = fields.shareImage?.stringValue;

          // Fallback to regular fields
          const t = shareTitle || fields.title?.stringValue;
          const c = shareDesc || fields.content?.stringValue;
          const img = shareImage || fields.image?.stringValue;

          if (t) title = String(t);
          if (c) description = String(c).trim().replace(/\s+/g, " ").slice(0, 180);
          if (img) image = preferSmallerImage(String(img));
        }
      }
    } catch {
      // keep defaults
    }

    const pageUrl = `https://celeonetv.com/posts/${postId}`;

    // 5) Inject meta
    let html = await baseRes.text();
    html = stripExistingSocialMeta(html);

    const meta = `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<link rel="canonical" href="${escapeHtml(pageUrl)}" />
`.trim();

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    } else {
      html = `${meta}\n${html}`;
    }

    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "no-store");

    return new Response(html, { status: baseRes.status, headers });
  },
};
