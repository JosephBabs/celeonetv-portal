/* eslint-disable @typescript-eslint/no-explicit-any */
const escapeHtml = (s: string) =>
  (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export async function onRequestGet(context: any) {
  const postId = context.params.id as string;
 
  const FIREBASE_PROJECT_ID = "celeone-e5843";
// TODO: use Firebase Admin SDK with a service account to read Firestore securely, instead of relying on public read access (which also means no preview in SPA)
  const firebaseURL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/posts/${postId}`;

  const fr = await fetch(firebaseURL);

  // If Firestore blocks public read, fallback to SPA (but then no preview)
  if (!fr.ok) return context.next();

  const data = await fr.json();
  const fields = data.fields || {};

  const titleRaw = fields.title?.stringValue || "Celeone";
  const contentRaw = fields.content?.stringValue || "";
  const imageRaw = fields.image?.stringValue || "https://celeonetv.com/logo.png";

  const title = escapeHtml(titleRaw);
  const description = escapeHtml(contentRaw.trim().slice(0, 180));
  const image = escapeHtml(imageRaw);
  const url = `https://celeonetv.com/posts/${postId}`;

  // ✅ Get the HTML that Pages would normally serve for THIS route (your index.html)
  const res = await context.next();
  let html = await res.text();

  // Inject tags right before </head>
  const meta = `
<title>${title}</title>
<meta name="description" content="${description}" />

<meta property="og:type" content="article" />
<meta property="og:site_name" content="Celeone" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:secure_url" content="${image}" />
<meta property="og:url" content="${url}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
<meta name="twitter:image" content="${image}" />
  `;

  html = html.replace("</head>", `${meta}\n</head>`);

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      // Important: prevents edge caching old meta when you update posts
      "cache-control": "no-store",
    },
    status: res.status,
  });
}
