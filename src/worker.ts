/* eslint-disable @typescript-eslint/no-explicit-any */
import { onRequestGet as founderActivateGet, onRequestPost as founderActivatePost } from "../functions/api/founders/activate";
import { onRequestGet as adminFounderAssetGet } from "../functions/api/admin/founders/asset";
import { onRequestGet as adminFounderCredentialsGet, onRequestPost as adminFounderCredentialsPost } from "../functions/api/admin/founders/credentials";
import { onRequestGet as founderConfigGet } from "../functions/api/founders/config";
import { onRequestGet as founderAssetGet } from "../functions/api/founders/asset";
import { onRequestGet as founderCredentialsGet, onRequestPost as founderCredentialsPost } from "../functions/api/founders/credentials";
import type { PortalEnv } from "../functions/_lib/types";
import { translatePlainTextEmbedded } from "./lib/embeddedTranslator";

export interface Env {
  FIREBASE_PROJECT_ID?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  LIBRETRANSLATE_URL?: string;
  LIBRETRANSLATE_API_KEY?: string;
  ASSETS?: { fetch: (req: Request) => Promise<Response> };
}

type WorkerEnv = Env & PortalEnv;

const SITE_URL = "https://celeonetv.com";
const DEFAULT_IMAGE = `${SITE_URL}/logo.jpeg`;
const DEFAULT_IMAGE_WIDTH = 679;
const DEFAULT_IMAGE_HEIGHT = 559;
const GENERATED_SHARE_IMAGE_WIDTH = 1200;
const GENERATED_SHARE_IMAGE_HEIGHT = 630;
const HOME_TITLE = "Cele One | CeleOne TV Platform for Celestial Church of Christ";
const HOME_DESCRIPTION =
  "Cele One is the Celeone TV platform for the Celestial Church of Christ community, with spiritual programs, weekly themes, hymns, parish tools, documents, live TV, and social features.";


type DynamicShareRoute = {
  pattern: RegExp;
  collection: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

const DYNAMIC_SHARE_ROUTES: DynamicShareRoute[] = [
  {
    pattern: /^\/posts\/([^/]+)\/?$/,
    collection: "posts",
    fallbackTitle: "Cele One Post | Celeone TV",
    fallbackDescription: "Read and share a Cele One post from the Celestial Church community.",
  },
  {
    pattern: /^\/social\/([^/]+)\/?$/,
    collection: "posts",
    fallbackTitle: "Cele One Social Post | Celeone TV",
    fallbackDescription: "Read a Cele One social post from the ECC and Celestial Church community.",
  },
  {
    pattern: /^\/hymns\/([^/]+)\/?$/,
    collection: "cantiques",
    fallbackTitle: "Cele One Hymn | ECC Cantiques",
    fallbackDescription: "Preview a Cele One hymn or cantique for the Celestial Church community.",
  },
  {
    pattern: /^\/themes\/([^/]+)\/?$/,
    collection: "weekly_themes",
    fallbackTitle: "Theme of the Week | Cele One",
    fallbackDescription: "Read a Cele One theme of the week with Bible readings, services and hymns.",
  },
  {
    pattern: /^\/weekly-themes\/([^/]+)\/?$/,
    collection: "weekly_themes",
    fallbackTitle: "Weekly Theme | Cele One Spiritual Program",
    fallbackDescription: "Read a Cele One weekly theme for the Celestial Church community.",
  },
  {
    pattern: /^\/weekly-programs\/([^/]+)\/?$/,
    collection: "weeklyPrograms",
    fallbackTitle: "Weekly Program | Cele One",
    fallbackDescription: "Preview a Cele One weekly spiritual program.",
  },
  {
    pattern: /^\/videos\/([^/]+)\/?$/,
    collection: "videos",
    fallbackTitle: "Cele One Video | Celeone TV",
    fallbackDescription: "Preview a Cele One video and open it in the mobile app.",
  },
  {
    pattern: /^\/songs\/([^/]+)\/?$/,
    collection: "songs",
    fallbackTitle: "Cele One Song | Celeone TV",
    fallbackDescription: "Preview a Cele One song or audio resource.",
  },
];

const ROUTE_META: Array<
  [
    RegExp,
    {
      title: string;
      description: string;
      type?: "website" | "article";
      robots?: string;
      canonicalPath?: string;
    }
  ]
> = [
  [/^\/creator\/request\/?$/, { title: "Create a Christian TV Channel | Celeone TV", description: "Request placement for a Christian TV, web TV, radio, podcast, ECC media, parish media, or Celestial Church of Christ channel on Celeone TV.", canonicalPath: "/creator/request" }],
  [/^\/creator\/?$/, { title: "Creator Portal | Celeone TV", description: "Access Celeone creator tools for channels, live media, posts, and community publishing." }],
  [/^\/chatrooms\/create\/?$/, { title: "Create Chatroom | Celeone TV", description: "Create a Celeone community chatroom for focused conversations, groups, and ministry exchanges." }],
  [/^\/spiritual-program\/?$/, { title: "ECC Spiritual Program and Weekly Theme | Cele One", description: "Read Celestial Church of Christ weekly themes, Bible readings, services, special celebrations, and programmed hymns on the Cele One spiritual calendar.", canonicalPath: "/spiritual-program" }],
  [/^\/parishes\/?$/, { title: "Celestial Church Parish Map | Cele One", description: "Find approved Celestial Church of Christ and ECC parishes near you on Cele One with geolocation, distance sorting, and directions.", canonicalPath: "/parishes" }],
  [/^\/parishes\/register\/?$/, { title: "Register an ECC Parish | Cele One", description: "Submit a Celestial Church of Christ parish name, country, and exact GPS location for review on the Cele One global parish map.", canonicalPath: "/parishes/register" }],
  [/^\/social\/[^/]+\/?$/, { title: "Cele One Social Post | Celeone TV", description: "Read a Cele One social post from the ECC and Celestial Church community, then open it in the Cele One mobile app.", type: "article" }],
  [/^\/hymns\/[^/]+\/?$/, { title: "Cele One Hymn | ECC Cantiques", description: "Preview a Cele One hymn or cantique for the Celestial Church community, then open it in the mobile app.", type: "article" }],
  [/^\/themes\/[^/]+\/?$/, { title: "Theme of the Week | Cele One Spiritual Program", description: "Read details for a Cele One theme of the week with Bible readings, services, and programmed hymns for the ECC community.", type: "article" }],
  [/^\/weekly-themes\/[^/]+\/?$/, { title: "Weekly Theme | Cele One Spiritual Program", description: "Read a Cele One weekly theme for the Celestial Church community with service details and spiritual content.", type: "article" }],
  [/^\/weekly-programs\/[^/]+\/?$/, { title: "Weekly Program | Cele One", description: "Preview a Cele One weekly spiritual program for the ECC and Celestial Church community.", type: "article" }],
  [/^\/videos\/[^/]+\/?$/, { title: "Cele One Video | Celeone TV", description: "Preview a Cele One video from Celeone TV and open it in the mobile app.", type: "article" }],
  [/^\/songs\/[^/]+\/?$/, { title: "Cele One Song | Celeone TV", description: "Preview a Cele One song or audio resource from Celeone TV and open it in the mobile app.", type: "article" }],
  [/^\/documentation\/?$/, { title: "Cele One Documentation | ECC Platform, Social Media and TV", description: "Explore Cele One public documentation for the ECC platform, social media features, Cele TV, spiritual programs, parish workflows, community tools, and policies.", canonicalPath: "/documentation" }],
  [/^\/jeunesse\/?$/, { title: "Jeunesse | CeleOne", description: "Discover youth-centered CeleOne content, community activities, programs, and spiritual resources." }],
  [/^\/prelaunch-registration\/?$/, { title: "Cele One Prelaunch Registration | ECC Community Platform", description: "Create your Cele One account before launch or register donor details to support the Celestial Church of Christ community platform project.", canonicalPath: "/prelaunch-registration" }],
  [/^\/donate\/?$/, { title: "Support Cele One | Founder's Pass Payment", description: "Open the official Cele One Founder's Pass payment page and support the project launch.", robots: "noindex,follow" }],
  [/^\/founder-pass\/?$/, { title: "Founder Pass | Cele One", description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.", canonicalPath: "/founder-pass" }],
  [/^\/founders\/?$/, { title: "Founder Pass | Cele One", description: "Support Cele One and reserve Founder recognition, certificate verification, and public wall presence for the ECC community platform.", canonicalPath: "/founder-pass" }],
  [/^\/founders\/activate\/?$/, { title: "Activate Founder Pass | CeleOne", description: "Activate your CeleOne Founder Pass and unlock your founder profile, certificate, and supporter access.", robots: "noindex,nofollow" }],
  [/^\/founders\/certificate\/?$/, { title: "Founder Certificate | CeleOne", description: "View and download your official CeleOne Founder Pass certificate.", robots: "noindex,nofollow" }],
  [/^\/founders\/dashboard\/?$/, { title: "Founder Dashboard | CeleOne", description: "Manage your CeleOne Founder Pass profile, credentials, certificate, and supporter information.", robots: "noindex,nofollow" }],
  [/^\/founders\/wall\/?$/, { title: "Founder Wall | Cele One", description: "View the public Cele One Founder Wall and recognized supporters of the Celestial Church community platform.", canonicalPath: "/founders/wall" }],
  [/^\/founders\/verify\/[^/]+\/?$/, { title: "Verify Founder Pass | Cele One", description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.", canonicalPath: "/founders/verify" }],
  [/^\/founders\/verify\/?$/, { title: "Verify Founder Pass | Cele One", description: "Verify a Cele One Founder Pass certificate or founder identity from the official CeleOne portal.", canonicalPath: "/founders/verify" }],
  [/^\/founders\/[^/]+\/?$/, { title: "Founder Hub | CeleOne", description: "Explore CeleOne founder resources, pass details, wall, certificates, and activation tools.", robots: "noindex,follow" }],
  [/^\/app\/privacy\/?$/, { title: "Privacy Policy | Cele One ECC Platform", description: "Read how Cele One, the ECC and Celestial Church community platform, collects, uses, shares, protects, retains, and deletes user information.", canonicalPath: "/app/privacy" }],
  [/^\/account\/request_delete\/?$/, { title: "Request Account Deletion | Cele One", description: "Request deletion of your Cele One account and associated personal data from the ECC and Celestial Church community platform.", canonicalPath: "/account/request_delete" }],
  [/^\/app\/child-safety-standards\/?$/, { title: "Child Safety Standards | Cele One", description: "Read Cele One's published standards against child sexual exploitation, abuse, grooming, and unsafe contact with minors.", canonicalPath: "/app/child-safety-standards" }],
  [/^\/login\/?$/, { title: "Login | Celeone TV", description: "Sign in securely to access your Celeone account and creator tools.", robots: "noindex,follow" }],
  [/^\/logout\/?$/, { title: "Logout | Celeone TV", description: "Sign out from your Celeone account securely.", robots: "noindex,nofollow" }],
  [/^\/register\/?$/, { title: "Register | Celeone TV", description: "Create your Celeone account to access posts, chatrooms, channels, and community tools.", robots: "noindex,follow" }],
  [/^\/admin\/.+$/, { title: "Admin | Celeone TV", description: "Celeone TV administration area.", robots: "noindex,nofollow" }],
  [/^\/admin\/?$/, { title: "Admin | Celeone TV", description: "Celeone TV administration area.", robots: "noindex,nofollow" }],
];

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

function shouldUseAppShell(pathname: string) {
  if (pathname === "/" || pathname === "") return false;
  if (/\/[^/]+\.[^/]+$/.test(pathname)) return false;
  if (/^\/api(?:\/|$)/.test(pathname)) return false;
  return true;
}

async function fetchAsset(request: Request, env: WorkerEnv, url: URL) {
  const fetchFromAssets = async (req: Request) => {
    if (env.ASSETS && typeof env.ASSETS.fetch === "function") return env.ASSETS.fetch(req);
    return fetch(req);
  };

  const res = await fetchFromAssets(request);
  if (!shouldUseAppShell(url.pathname)) return res;
  if (res.status < 400 && isHtml(res)) return res;

  const shellUrl = new URL("/", url.origin);
  const shellRequest = new Request(shellUrl.toString(), request);
  const shellRes = await fetchFromAssets(shellRequest);
  if (shellRes.status < 400 && isHtml(shellRes)) {
    return new Response(shellRes.body, {
      status: 200,
      headers: shellRes.headers,
    });
  }
  return res;
}

async function fetchWithTimeout(url: string, ms: number, init: RequestInit = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

function stripExistingSocialMeta(html: string) {
  return html
    .replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+itemprop=["'][^"']+["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']title["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']robots["'][^>]*>\s*/gi, "")
    .replace(/<meta[^>]+name=["']googlebot["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<script[^>]+type=["']application\/ld\+json["'][^>]*>.*?<\/script>\s*/gis, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

function makeCompressedShareImage(input: string) {
  const imageUrl = (input || "").trim();
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  if (imageUrl.startsWith("/")) return `${SITE_URL}${imageUrl}`;
  if (!/^https?:\/\//i.test(imageUrl)) return DEFAULT_IMAGE;
  // A normalized 1200x630 image gives WhatsApp/Facebook/X a predictable preview size.
  return `https://wsrv.nl/?url=${encodeURIComponent(imageUrl)}&w=1200&h=630&fit=cover&output=jpg&q=78`;
}

function stripHtmlText(value: unknown) {
  return String(value || "")
    .replace(/<script[^>]*>.*?<\/script>/gis, " ")
    .replace(/<style[^>]*>.*?<\/style>/gis, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firestoreValueToJs(value: any): any {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if (value.arrayValue) return (value.arrayValue.values || []).map(firestoreValueToJs);
  if (value.mapValue) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nested]) => [key, firestoreValueToJs(nested)]),
    );
  }
  return undefined;
}

function firestoreFieldsToObject(fields: Record<string, any> = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)]));
}

function textCandidate(value: any): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (Array.isArray(value)) return value.map(textCandidate).filter(Boolean).join(" · ");
  if (typeof value === "object") {
    for (const key of ["fr", "en", "es", "yo", "fon", "gou", "default", "text", "title", "name"]) {
      const found = textCandidate(value[key]);
      if (found) return found;
    }
    for (const nested of Object.values(value)) {
      const found = textCandidate(nested);
      if (found) return found;
    }
  }
  return "";
}

function pickText(data: Record<string, any>, keys: string[]) {
  for (const key of keys) {
    const value = textCandidate(data[key]);
    if (value) return value;
  }
  return "";
}

async function fetchPublicFirestoreDoc(env: WorkerEnv, collection: string, id: string) {
  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  const res = await fetchWithTimeout(endpoint, 3000, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  return firestoreFieldsToObject(json?.fields || {});
}

function matchDynamicShareRoute(pathname: string) {
  for (const config of DYNAMIC_SHARE_ROUTES) {
    const match = pathname.match(config.pattern);
    if (match) return { config, id: decodeURIComponent(match[1]) };
  }
  return null;
}

function buildSeoSnapshot({ title, description, image, pageUrl }: { title: string; description: string; image: string; pageUrl: string }) {
  const cleanDescription = stripHtmlText(description).slice(0, 700);
  const imageHtml = image && image !== DEFAULT_IMAGE
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="1200" height="630" style="display:block;width:100%;height:auto;max-height:460px;object-fit:cover;border-radius:16px;margin:18px 0" />`
    : "";
  return `<section data-celeone-seo-snapshot="true" style="max-width:900px;margin:28px auto;padding:24px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
    <h1 style="font-size:clamp(28px,5vw,46px);line-height:1.08;margin:0 0 14px">${escapeHtml(title)}</h1>
    ${imageHtml}
    <p style="font-size:17px;margin:0">${escapeHtml(cleanDescription)}</p>
    <p style="margin-top:16px"><a href="${escapeHtml(pageUrl)}">${escapeHtml(pageUrl)}</a></p>
  </section>`;
}

function injectMeta(html: string, meta: string, snapshot = "") {
  let cleaned = stripExistingSocialMeta(html);
  if (cleaned.includes("</head>")) cleaned = cleaned.replace("</head>", `${meta}\n</head>`);
  else cleaned = `${meta}\n${cleaned}`;

  if (snapshot) {
    const emptyRoot = /<div([^>]*\bid=["']root["'][^>]*)>\s*<\/div>/i;
    if (emptyRoot.test(cleaned)) {
      cleaned = cleaned.replace(emptyRoot, `<div$1>${snapshot}</div>`);
    }
  }
  return cleaned;
}

function buildMeta({
  title,
  description,
  image,
  pageUrl,
  type,
  robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
}: {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
  type: "website" | "article";
  robots?: string;
}) {
  const isDefaultImage = image === DEFAULT_IMAGE;
  const imageWidth = isDefaultImage ? DEFAULT_IMAGE_WIDTH : GENERATED_SHARE_IMAGE_WIDTH;
  const imageHeight = isDefaultImage ? DEFAULT_IMAGE_HEIGHT : GENERATED_SHARE_IMAGE_HEIGHT;
  const imageType = image.toLowerCase().includes(".png") ? "image/png" : "image/jpeg";
  const structuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "CeleOne",
        alternateName: ["Cele One", "Celeone TV", "Cele TV", "Cele One TV", "Plateforme ECC", "Plateforme LECC", "Reseau social de l'ECC"],
        description: "Cele One is a community platform for the Celestial Church of Christ and ECC.",
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
      },
      {
        "@type": type === "article" ? "Article" : "WebPage",
        headline: title,
        name: title,
        description,
        image,
        url: pageUrl,
        inLanguage: ["fr", "en", "es"],
        isPartOf: {
          "@type": "WebSite",
          name: "Celeone TV",
          url: SITE_URL,
        },
        about: [
          "Cele One",
          "Celeone TV",
          "Celestial Church of Christ",
          "Eglise du Christianisme Celeste",
          "ECC",
          "LECC",
          "Christian social media",
          "Spiritual programs",
        ].map((name) => ({ "@type": "Thing", name })),
      },
    ],
  }).replace(/</g, "\\u003c");

  return `
<title>${escapeHtml(title)}</title>
<meta name="title" content="${escapeHtml(title)}" />
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="${escapeHtml(robots)}" />
<meta name="googlebot" content="${escapeHtml(robots)}" />
<meta itemprop="name" content="${escapeHtml(title)}" />
<meta itemprop="description" content="${escapeHtml(description)}" />
<meta itemprop="image" content="${escapeHtml(image)}" />

<meta property="og:type" content="${type}" />
<meta property="og:locale" content="fr_FR" />
<meta property="og:site_name" content="Celeone TV" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image:url" content="${escapeHtml(image)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:secure_url" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="${imageWidth}" />
<meta property="og:image:height" content="${imageHeight}" />
<meta property="og:image:type" content="${imageType}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta property="og:url" content="${escapeHtml(pageUrl)}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@celeonetv" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta name="twitter:image:alt" content="${escapeHtml(title)}" />

<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<link rel="icon" href="${escapeHtml(DEFAULT_IMAGE)}" />
<script type="application/ld+json">${structuredData}</script>
  `.trim();
}

function titleFromChannelSlug(pathname: string) {
  const m = pathname.match(/^\/([^/]+)\/live\/?$/);
  if (!m) return null;
  const slug = m[1];
  const prêtty = slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
  return prêtty || "Live Channel";
}

function htmlResponse(baseRes: Response, body: string) {
  const headers = new Headers(baseRes.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "public, max-age=300, s-maxage=300");
  return new Response(body, { status: baseRes.status, headers });
}

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=UTF-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type, authorization");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanLang(value: unknown, fallback = "en") {
  const raw = String(value || fallback).trim().toLowerCase().split(/[-_]/)[0];
  return ["en", "fr", "es", "yo", "fon", "gou"].includes(raw) ? raw : fallback;
}

async function translateWithOpenAI(env: Env, text: string, target: string, source: string) {
  if (!env.OPENAI_API_KEY) return { text: "", error: "missing_key" };
  const models = Array.from(new Set([env.OPENAI_MODEL || "gpt-4.1-mini", "gpt-4o-mini"]));
  let lastError = "";
  for (const model of models) {
    const res = await fetchWithTimeout("https://api.openai.com/v1/responses", 20000, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content:
              "Translate the user text fully and naturally. Preserve meaning, names, Bible references, URLs, hashtags, line breaks, and simple HTML tags. Return only the translated text.",
          },
          {
            role: "user",
            content: `Source language: ${source || "auto"}\nTarget language: ${target}\n\n${text}`,
          },
        ],
        temperature: 0,
      }),
    } as RequestInit).catch(() => null);
    if (!res) {
      lastError = "fetch_failed";
      continue;
    }
    if (!res.ok) {
      const errorData: any = await res.json().catch(() => ({}));
      lastError = `${res.status}:${String(errorData?.error?.code || errorData?.error?.type || "openai_error")}`;
      continue;
    }
    const data: any = await res.json().catch(() => ({}));
    const translated = String(data?.output_text || data?.output?.[0]?.content?.[0]?.text || "").trim();
    if (translated) return { text: translated, error: "" };
    lastError = "empty_response";
  }
  return { text: "", error: lastError || "unavailable" };
}

async function translateWithLibre(env: Env, text: string, target: string, source: string) {
  if (!env.LIBRETRANSLATE_URL) return "";
  const res = await fetchWithTimeout(`${env.LIBRETRANSLATE_URL.replace(/\/$/, "")}/translate`, 20000, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: source || "auto",
      target,
      format: /<[^>]+>/.test(text) ? "html" : "text",
      api_key: env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  } as RequestInit);
  if (!res.ok) return "";
  const data: any = await res.json();
  return String(data?.translatedText || "").trim();
}

async function handleTranslate(request: Request, env: Env) {
  if (request.method.toUpperCase() === "OPTIONS") return jsonResponse({ ok: true });
  if (request.method.toUpperCase() === "GET") {
    return jsonResponse({
      ok: true,
      route: "/api/translate",
      method: "POST",
      providers: {
        openai: !!env.OPENAI_API_KEY,
        libreTranslate: !!env.LIBRETRANSLATE_URL,
      },
    });
  }
  if (request.method.toUpperCase() !== "POST") return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, { status: 405 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "BAD_JSON" }, { status: 400 });
  }

  const text = String(body.text || "").slice(0, 12000);
  const target = cleanLang(body.target || body.targetLang || "en", "en");
  const source = cleanLang(body.source || body.sourceLang || "auto", "auto");
  if (!text.trim()) return jsonResponse({ translatedText: "", source, target, cached: false });
  if (source === target) return jsonResponse({ translatedText: text, source, target, cached: true });

  const cacheKey = new Request(`${new URL(request.url).origin}/api/translate-cache/${await sha256Hex(`v5:${source}:${target}:${text}`)}`);
  const edgeCache = (caches as any).default as Cache | undefined;
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;
  if (cached) return cached;

  const openaiResult = await translateWithOpenAI(env, text, target, source).catch(() => ({ text: "", error: "exception" }));
  const embeddedResult = translatePlainTextEmbedded(text, target, source);
  const translatedText =
    openaiResult.text ||
    (await translateWithLibre(env, text, target, source).catch(() => "")) ||
    embeddedResult.translatedText;

  if (!translatedText) {
    return jsonResponse({
      error: "TRANSLATION_PROVIDER_UNAVAILABLE",
      translatedText: "",
      source,
      target,
      providers: {
        openai: !!env.OPENAI_API_KEY,
        libreTranslate: !!env.LIBRETRANSLATE_URL,
      },
      providerError: openaiResult.error || "no_provider_result",
    }, { status: 503 });
  }

  const provider = openaiResult.text ? "openai" : translatedText === embeddedResult.translatedText ? "embedded" : "libretranslate";
  const response = jsonResponse({
    translatedText,
    source: embeddedResult.sourceLang || source,
    target,
    cached: false,
    provider,
    providerError: provider === "embedded" ? openaiResult.error || "" : "",
  }, {
    headers: { "cache-control": "public, max-age=2592000" },
  });
  await edgeCache?.put(cacheKey, response.clone());
  return response;
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    if (/^\/api\/translate\/?$/.test(url.pathname)) return handleTranslate(request, env);
    if (/^\/api\/founders\/activate\/?$/.test(url.pathname)) {
      if (method === "GET") return founderActivateGet({ request, env });
      if (method === "POST") return founderActivatePost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/config\/?$/.test(url.pathname)) {
      if (method === "GET") return founderConfigGet({ env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/credentials\/?$/.test(url.pathname)) {
      if (method === "GET") return founderCredentialsGet({ request, env });
      if (method === "POST") return founderCredentialsPost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/founders\/asset\/?$/.test(url.pathname)) {
      if (method === "GET") return founderAssetGet({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/admin\/founders\/credentials\/?$/.test(url.pathname)) {
      if (method === "GET") return adminFounderCredentialsGet({ request, env });
      if (method === "POST") return adminFounderCredentialsPost({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }
    if (/^\/api\/admin\/founders\/asset\/?$/.test(url.pathname)) {
      if (method === "GET") return adminFounderAssetGet({ request, env });
      if (method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, OPTIONS",
            "access-control-allow-headers": "content-type, authorization, x-celeone-client",
          },
        });
      }
      return jsonResponse({ ok: false, error: "METHOD_NOT_ALLOWED" }, { status: 405 });
    }

    if (method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=300, s-maxage=300",
        },
      });
    }

    if (method === "OPTIONS") return new Response(null, { status: 204 });

    let baseRes: Response;
    try {
      baseRes = await fetchAsset(request, env, url);
    } catch {
      return new Response("Assets fetch failed", { status: 500 });
    }

    if (!isHtml(baseRes)) return baseRes;

    if (url.pathname === "/" || url.pathname === "") {
      const html = await baseRes.text();
      const meta = buildMeta({
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        image: DEFAULT_IMAGE,
        pageUrl: `${SITE_URL}/`,
        type: "website",
      });
      const snapshot = buildSeoSnapshot({ title: HOME_TITLE, description: HOME_DESCRIPTION, image: DEFAULT_IMAGE, pageUrl: `${SITE_URL}/` });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const dynamicShare = matchDynamicShareRoute(url.pathname);
    if (dynamicShare) {
      const { config, id } = dynamicShare;
      let title = config.fallbackTitle;
      let description = config.fallbackDescription;
      let image = DEFAULT_IMAGE;

      try {
        const item = await fetchPublicFirestoreDoc(env, config.collection, id);
        if (item) {
          const resolvedTitle = pickText(item, [
            "shareTitle", "title", "name", "theme", "bibleTheme", "hymnTitle", "caption",
            "titleTranslations", "bibleThemeTranslations",
          ]);
          const resolvedDescription = pickText(item, [
            "shareDescription", "description", "summary", "content", "hymnContent", "bibleLesson",
            "bibleReadingText", "notes", "descriptionTranslations",
          ]);
          const resolvedImage = pickText(item, [
            "shareImage", "image", "imageUrl", "coverUrl", "coverImageUrl", "thumbnail", "thumbnailUrl",
            "posterUrl", "banner", "bannerUrl",
          ]);
          if (resolvedTitle) title = stripHtmlText(resolvedTitle).slice(0, 180);
          if (resolvedDescription) description = stripHtmlText(resolvedDescription).slice(0, 320);
          if (resolvedImage) image = makeCompressedShareImage(resolvedImage);
        }
      } catch {
        // Keep route defaults if Firestore is temporarily unavailable.
      }

      const pageUrl = `${SITE_URL}${url.pathname}`;
      const html = await baseRes.text();
      const meta = buildMeta({ title, description, image, pageUrl, type: "article" });
      const snapshot = buildSeoSnapshot({ title, description, image, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const postMatch = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    if (postMatch) {
      const postId = postMatch[1];
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

      const html = await baseRes.text();
      const meta = buildMeta({
        title,
        description,
        image,
        pageUrl: `${SITE_URL}/posts/${postId}`,
        type: "article",
      });
      const snapshot = buildSeoSnapshot({ title, description, image, pageUrl: `${SITE_URL}/posts/${postId}` });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const known = ROUTE_META.find(([re]) => re.test(url.pathname));
    if (known) {
      const html = await baseRes.text();
      const cfg = known[1];
      const meta = buildMeta({
        title: cfg.title,
        description: cfg.description,
        image: DEFAULT_IMAGE,
        pageUrl: `${SITE_URL}${cfg.canonicalPath || url.pathname}`,
        type: cfg.type || "website",
        robots: cfg.robots,
      });
      const pageUrl = `${SITE_URL}${cfg.canonicalPath || url.pathname}`;
      const snapshot = cfg.robots?.startsWith("noindex") ? "" : buildSeoSnapshot({ title: cfg.title, description: cfg.description, image: DEFAULT_IMAGE, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const chTitle = titleFromChannelSlug(url.pathname);
    if (chTitle) {
      const html = await baseRes.text();
      const title = `${chTitle} Live | Celeone TV`;
      const description = `Watch ${chTitle} live on Celeone TV.`;
      const meta = buildMeta({
        title,
        description,
        image: DEFAULT_IMAGE,
        pageUrl: `${SITE_URL}${url.pathname}`,
        type: "website",
      });
      const pageUrl = `${SITE_URL}${url.pathname}`;
      const snapshot = buildSeoSnapshot({ title, description, image: DEFAULT_IMAGE, pageUrl });
      return htmlResponse(baseRes, injectMeta(html, meta, snapshot));
    }

    const html = await baseRes.text();
    const fallbackMeta = buildMeta({
      title: "Celeone TV Portal",
      description: HOME_DESCRIPTION,
      image: DEFAULT_IMAGE,
      pageUrl: `${SITE_URL}${url.pathname}`,
      type: "website",
      robots: "noindex,follow",
    });
    const fallbackBody = injectMeta(html, fallbackMeta);
    const headers = new Headers(baseRes.headers);
    headers.set("content-type", "text/html; charset=UTF-8");
    headers.set("cache-control", "public, max-age=60, s-maxage=60");
    return new Response(fallbackBody, { status: 404, headers });
  },
};
