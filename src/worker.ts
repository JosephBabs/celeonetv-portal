/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Env {
  [x: string]: any;
  FIREBASE_PROJECT_ID: string;
}

const escapeHtml = (s: string) =>
  (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function isHtmlResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("text/html");
}

export default {
  async fetch(request: Request, env: Env, ): Promise<Response> {
    const url = new URL(request.url);

    // Let assets system serve everything first
    // (In Workers+Assets, we call env.ASSETS.fetch)
    // Wrangler injects env.ASSETS automatically.
    // @ts-ignor
    const assetsRes: Response = await env.ASSETS.fetch(request);

    // Only modify HTML responses for /posts/:id
    const match = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (!match) return assetsRes;

    if (!isHtmlResponse(assetsRes)) return assetsRes;

    const postId = match[1];

    // Firestore REST fetch
    const projectId = "celeone-e5843";
    if (!projectId) return assetsRes;

    const firebaseURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/posts/${postId}`;
    const fr = await fetch(firebaseURL);

    if (!fr.ok) return assetsRes;

    const data = await fr.json();
    const fields = data.fields || {};

    const titleRaw = fields.title?.stringValue || "Celeone";
    const contentRaw = fields.content?.stringValue || "";
    const imageRaw = fields.image?.stringValue || "https://celeonetv.com/logo.png";

    const title = escapeHtml(titleRaw);
    const description = escapeHtml(contentRaw.trim().slice(0, 180));
    const image = escapeHtml(imageRaw);
    const pageUrl = `https://celeonetv.com/posts/${postId}`;

    let html = await assetsRes.text();

    const meta = `
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:url" content="${pageUrl}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
`;

    if (html.includes("</head>")) {
      html = html.replace("</head>", `${meta}\n</head>`);
    }

    return new Response(html, {
      status: assetsRes.status,
      headers: {
        ...Object.fromEntries(assetsRes.headers),
        "content-type": "text/html; charset=UTF-8",
        // avoid caching old previews
        "cache-control": "no-store"
      }
    });
  }
};
