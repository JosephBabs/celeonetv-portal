/* eslint-disable @typescript-eslint/no-explicit-any */
const SITE_URL = "https://celeonetv.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

const escapeHtml = (s: string) =>
  (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const stripExistingSocialMeta = (html: string) =>
  html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");

const compressShareImage = (url: string) => {
  const clean = (url || "").trim();
  if (!clean) return DEFAULT_IMAGE;
  if (!/^https?:\/\//i.test(clean)) return DEFAULT_IMAGE;
  if (clean.includes("logo.png")) return clean;
  return `https://wsrv.nl/?url=${encodeURIComponent(clean)}&w=1200&h=630&fit=cover&output=jpg&q=72`;
};

export async function onRequestGet(context: any) {
  const postId = String(context.params.id || "");
  const FIREBASE_PROJECT_ID = "celeone-e5843";
  const firebaseURL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/posts/${postId}`;

  let title = "Celeone TV";
  let description = "Decouvrez les contenus sur Celeone TV.";
  let image = DEFAULT_IMAGE;
  const url = `${SITE_URL}/posts/${postId}`;

  try {
    const fr = await fetch(firebaseURL);
    if (fr.ok) {
      const data = await fr.json();
      const fields = data?.fields || {};

      const shareTitle = fields.shareTitle?.stringValue;
      const shareDescription = fields.shareDescription?.stringValue;
      const shareImage = fields.shareImage?.stringValue;
      const fallbackTitle = fields.title?.stringValue;
      const fallbackDescription = fields.content?.stringValue;
      const fallbackImage = fields.image?.stringValue;

      const titleRaw = shareTitle || fallbackTitle || title;
      const contentRaw = shareDescription || fallbackDescription || description;
      const imageRaw = shareImage || fallbackImage || image;

      title = String(titleRaw);
      description = String(contentRaw).trim().replace(/\s+/g, " ").slice(0, 220) || description;
      image = compressShareImage(String(imageRaw));
    }
  } catch {
    // keep defaults so OG tags are still returned
  }

  const res = await context.next();
  let html = await res.text();
  html = stripExistingSocialMeta(html);

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);

  const meta = `
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:secure_url" content="${safeImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:url" content="${safeUrl}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />

<link rel="canonical" href="${safeUrl}" />
  `.trim();

  html = html.includes("</head>") ? html.replace("</head>", `${meta}\n</head>`) : `${meta}\n${html}`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
    status: res.status,
  });
}
