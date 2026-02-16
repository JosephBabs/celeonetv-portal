/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface Env {
  FIREBASE_PROJECT_ID?: string;
  // Wrangler injects ASSETS when using "assets" in wrangler.jsonc
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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1) Serve static assets safely (never crash)
    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
        baseRes = await env.ASSETS.fetch(request);
      } else {
        // If ASSETS binding is missing, fallback (prevents 1101 crash)
        baseRes = await fetch(request);
      }
    } catch (e) {
      return new Response("Worker assets fetch failed", { status: 500 });
    }

    // 2) Only target /posts/:id
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) return baseRes;

    // 3) Only inject into HTML responses
    if (!isHtml(baseRes)) return baseRes;

    const postId = m[1];

    // 4) Fetch post (but NEVER crash if it fails)
    let title = "Celeone";
    let description = "";
    let image = "https://celeonetv.com/logo.png";

    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
        const fr = await fetch(firebaseURL);

        if (fr.ok) {
          const data: any = await fr.json();
          const fields = data?.fields || {};

          const titleRaw = fields.title?.stringValue || title;
          const contentRaw = fields.content?.stringValue || "";
          const imageRaw = fields.image?.stringValue || image;

          title = titleRaw;
          description = (contentRaw || "").trim().slice(0, 180);
          image = imageRaw;
        }
      }
    } catch (e) {
      // ignore — fall back to defaults
    }

    // 5) Inject meta
    const pageUrl = `https://celeonetv.com/posts/${postId}`;

    let html = await baseRes.text();

    const meta = `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
`;

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    }

    // Rebuild response (preserve headers)
    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "no-store");

    return new Response(html, { status: baseRes.status, headers });
  },
};
