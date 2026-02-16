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
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    const isHead = request.method.toUpperCase() === "HEAD";
    const methodForAssets = isHead ? "GET" : request.method;

    // IMPORTANT: serve HEAD by internally doing GET to avoid 522 / weird head handling
    const reqForAssets =
      methodForAssets === request.method
        ? request
        : new Request(request.url, {
            method: methodForAssets,
            headers: request.headers,
            redirect: "follow",
          });

    // 1) Serve assets safely
    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        baseRes = await env.ASSETS.fetch(reqForAssets);
      } else {
        baseRes = await fetch(reqForAssets);
      }
    } catch {
      return new Response("Worker assets fetch failed", { status: 500 });
    }

    // 2) Only handle /posts/:id
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) {
      // For HEAD requests on non-post pages, still return headers-only
      if (isHead) return new Response(null, { status: baseRes.status, headers: baseRes.headers });
      return baseRes;
    }

    // 3) Only inject into HTML
    if (!isHtml(baseRes)) {
      if (isHead) return new Response(null, { status: baseRes.status, headers: baseRes.headers });
      return baseRes;
    }

    const postId = m[1];

    // 4) Defaults
    let title = "Celeone TV";
    let description = "Celeone TV";
    let image = "https://celeonetv.com/logo.png";

    // 5) Fetch Firestore quickly (avoid 522)
    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
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
      // keep defaults
    }

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

    let html = await baseRes.text();
    html = stripExistingSocialMeta(html);

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    } else {
      html = `${meta}\n${html}`;
    }

    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "no-store");

    // 6) For HEAD: return headers only (no body), but after we ensured the route works
    if (isHead) {
      return new Response(null, { status: baseRes.status, headers });
    }

    return new Response(html, { status: baseRes.status, headers });
  },
};
