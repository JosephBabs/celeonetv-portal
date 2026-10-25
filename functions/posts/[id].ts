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
  const apiBase = String(context.env?.LARAVEL_API_URL || "https://api.celeonetv.com/api/v1").replace(/\/$/, "");
  const apiURL = `${apiBase}/public/posts/${encodeURIComponent(postId)}`;

  let title = "Celeone TV";
  let description = "Decouvrez les contenus sur Celeone TV.";
  let image = DEFAULT_IMAGE;
  const url = `${SITE_URL}/posts/${postId}`;

  try {
    const response = await fetch(apiURL, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const envelope = await response.json();
      const data = envelope?.data?.post || envelope?.data || envelope?.post || {};
      const imageList = Array.isArray(data.images) ? data.images : [];
      const mediaList = Array.isArray(data.media) ? data.media : [];
      const firstMediaImage = mediaList.find((item: any) => String(item?.type || item?.mime || "").toLowerCase().startsWith("image"));
      const imageRaw = data.shareImage || data.shareImageUrl || imageList[0] || firstMediaImage?.previewUrl || firstMediaImage?.smallUrl || firstMediaImage?.url || data.imageUrl || data.image || data.thumbnailUrl || image;
      const titleRaw = data.shareTitle || data.title || title;
      const contentRaw = data.shareDescription || data.description || data.content || data.body || data.text || description;

      title = String(titleRaw);
      description = String(contentRaw).replace(/<[^>]*>/g, " ").trim().replace(/\s+/g, " ").slice(0, 220) || description;
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
