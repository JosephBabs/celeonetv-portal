/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function onRequestGet(context: any) {
  const { params, env } = context;
  const postId = params.id;

  const FIREBASE_PROJECT_ID = "celeone-e5843";

  // 1️⃣ Fetch post from Firestore REST
  const firebaseURL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/posts/${postId}`;

  const res = await fetch(firebaseURL);
  if (!res.ok) {
    return context.next(); // fallback to SPA
  }

  const data = await res.json();
  const fields = data.fields || {};

  const title = fields.title?.stringValue || "Celeone";
  const content = fields.content?.stringValue || "";
  const image = fields.image?.stringValue || "https://celeonetv.com/logo.png";

  const description = content.slice(0, 160);

  // 2️⃣ Get original index.html
  const indexRes = await fetch("https://celeonetv.com");
  let html = await indexRes.text();

  // 3️⃣ Inject OpenGraph meta tags
  const meta = `
    <title>${title}</title>
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:url" content="https://celeonetv.com/posts/${postId}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  `;

  html = html.replace("</head>", `${meta}</head>`);

  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}
