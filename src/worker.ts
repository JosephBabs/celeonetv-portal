/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Env {
  FIREBASE_PROJECT_ID?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

const SITE_URL = "https://celeonetv.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpeg`;
const HOME_TITLE = "CeleOne | Plateforme Sociale Mobile Chretienne Celeste";
const HOME_DESCRIPTION =
  "Cèlè One rassemble actualités, reformes, décisions officielles ECC, chat communautaire, documents essentiels, TV/Web TV et Radio Alleluia FM dans un espace securisé.";

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
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

function makeCompressedShareImage(input: string) {
  const imageUrl = (input || "").trim();
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  if (!/^https?:\/\//i.test(imageUrl)) return DEFAULT_IMAGE;
  // WhatsApp previews are more reliable with moderate-size images.
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1200&h=630&fit=cover&output=jpg&q=72`;
}

function injectMeta(html: string, meta: string) {
  const cleaned = stripExistingSocialMeta(html);
  if (cleaned.includes("</head>")) return cleaned.replace("</head>", `${meta}\n</head>`);
  return `${meta}\n${cleaned}`;
}

function buildMeta({
  title,
  description,
  image,
  pageUrl,
  type,
}: {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
  type: "website" | "article";
}) {
  return `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />

<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />

<link rel="canonical" href="${escapeHtml(pageUrl)}" />
  `.trim();
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

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

    if (!isHtml(baseRes)) return baseRes;

    // Homepage SEO for WhatsApp preview.
    if (url.pathname === "/" || url.pathname === "") {
      const html = await baseRes.text();
      const meta = buildMeta({
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        image: DEFAULT_IMAGE,
        pageUrl: `${SITE_URL}/`,
        type: "website",
      });
      const body = injectMeta(html, meta);
      const headers = new Headers(baseRes.headers);
      headers.set("content-type", "text/html; charset=UTF-8");
      headers.set("cache-control", "no-store");
      return new Response(body, { status: baseRes.status, headers });
    }

    // Post SEO for WhatsApp preview.
    const m = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!m) return baseRes;

    const postId = m[1];
    let title = "Celeone TV";
    let description = "Decouvrez les contenus sur Celeone TV.";
    let image = DEFAULT_IMAGE;

    try {
      const projectId = env.FIREBASE_PROJECT_ID;
      if (projectId) {
        const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
        const fr = await fetchWithTimeout(firebaseURL, 2500);
        if (fr.ok) {
          const data: any = await fr.json();
          const fields = data?.fields || {};
          const shareTitle = fields.shareTitle?.stringValue;
          const shareDesc = fields.shareDescription?.stringValue;
          const shareImage = fields.shareImage?.stringValue;
          const fallbackTitle = fields.title?.stringValue;
          const fallbackDesc = fields.content?.stringValue;
          const fallbackImage = fields.image?.stringValue;

          const resolvedTitle = shareTitle || fallbackTitle;
          const resolvedDesc = shareDesc || fallbackDesc;
          const resolvedImage = shareImage || fallbackImage;

          if (resolvedTitle) title = String(resolvedTitle);
          if (resolvedDesc) description = String(resolvedDesc).trim().replace(/\s+/g, " ").slice(0, 220);
          if (resolvedImage) image = makeCompressedShareImage(String(resolvedImage));
        }
      }
    } catch {
      // Keep defaults on fetch failure.
    }

    const pageUrl = `${SITE_URL}/posts/${postId}`;
    const html = await baseRes.text();
    const meta = buildMeta({
      title,
      description,
      image,
      pageUrl,
      type: "article",
    });
    const body = injectMeta(html, meta);
    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "no-store");
    return new Response(body, { status: baseRes.status, headers });
  },
};
