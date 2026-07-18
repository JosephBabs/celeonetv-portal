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
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
const HOME_TITLE = "CeleOne | Plateforme Sociale Mobile Chretienne Celeste";
const HOME_DESCRIPTION =
  "CeleOne rassemble actualites, reformes, decisions officielles ECC, chat communautaire, documents essentiels, TV/Web TV et Radio Alleluia FM dans un espace securise.";

const ROUTE_META: Array<
  [
    RegExp,
    {
      title: string;
      description: string;
      type?: "website" | "article";
    }
  ]
> = [
  [/^\/creator\/request\/?$/, { title: "Channel Request | Celeone TV", description: "Submit your TV, web TV, radio, podcast, or media channel request to join Celeone." }],
  [/^\/spiritual-program\/?$/, { title: "Spiritual Program | CeleOne", description: "Read weekly themes, services, Bible lessons, special celebrations, and hymn programs." }],
  [/^\/documentation\/?$/, { title: "Documentation | CeleOne", description: "Explore public documentation, policies, modules, and trusted information flow." }],
  [/^\/prelaunch-registration\/?$/, { title: "Prelaunch Registration | CeleOne", description: "Reserve your CeleOne prelaunch account or share your donation interest before the official launch." }],
  [/^\/donate\/?$/, { title: "Support Cele One | Founder's Pass Payment", description: "Open the official Cele One Founder’s Pass payment page and support the project launch." }],
  [/^\/login\/?$/, { title: "Login | Celeone TV", description: "Sign in securely to access your Celeone account and creator tools." }],
  [/^\/logout\/?$/, { title: "Logout | Celeone TV", description: "Sign out from your Celeone account securely." }],
  [/^\/register\/?$/, { title: "Register | Celeone TV", description: "Create your Celeone account to access posts, chatrooms, channels, and community tools." }],
  [/^\/admin\/functions\/?$/, { title: "Admin Functions | Celeone TV", description: "Review and process platform function requests submitted by users." }],
  [/^\/admin\/cantiques\/?$/, { title: "Admin Cantiques | Celeone TV", description: "Create, edit, and organize hymns with language and number filters." }],
  [/^\/admin\/posts\/?$/, { title: "Admin Posts | Celeone TV", description: "Create and edit posts with rich content and social sharing metadata." }],
  [/^\/admin\/documents\/?$/, { title: "Admin Documents | Celeone TV", description: "Manage official ECC documents and publish structured HTML content." }],
  [/^\/admin\/channel-requests\/?$/, { title: "Admin Channel Requests | Celeone TV", description: "Approve or reject creator channel requests for live streaming access." }],
  [/^\/admin\/chatrooms\/?$/, { title: "Admin Chatrooms | Celeone TV", description: "Moderate and configure community chatrooms across the platform." }],
  [/^\/admin\/spiritual-program\/?$/, { title: "Admin Spiritual Program | CeleOne", description: "Manage spiritual years, months, weeks, services, hymn programs, and special celebrations." }],
  [/^\/admin\/?$/, { title: "Admin Dashboard | Celeone TV", description: "View revenue, subscriptions, creators, and moderation operations in one dashboard." }],
  [/^\/admin\/.+$/, { title: "Admin Manage | Celeone TV", description: "Manage portal collections, workflows, and publishing settings." }],
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
    .replace(/<meta[^>]+name=["']description["'][^>]*>\s*/gi, "")
    .replace(/<link[^>]+rel=["']canonical["'][^>]*>\s*/gi, "")
    .replace(/<title>.*?<\/title>\s*/gis, "");
}

function makeCompressedShareImage(input: string) {
  const imageUrl = (input || "").trim();
  if (!imageUrl) return DEFAULT_IMAGE;
  if (imageUrl === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  if (!/^https?:\/\//i.test(imageUrl)) return DEFAULT_IMAGE;
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

function titleFromChannelSlug(pathname: string) {
  const m = pathname.match(/^\/([^/]+)\/live\/?$/);
  if (!m) return null;
  const slug = m[1];
  const pretty = slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() + p.slice(1))
    .join(" ");
  return pretty || "Live Channel";
}

function htmlResponse(baseRes: Response, body: string) {
  const headers = new Headers(baseRes.headers);
  headers.set("content-type", "text/html; charset=UTF-8");
  headers.set("cache-control", "no-store");
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
          "cache-control": "no-store",
        },
      });
    }

    if (method === "OPTIONS") return new Response(null, { status: 204 });

    let baseRes: Response;
    try {
      if (env.ASSETS && typeof env.ASSETS.fetch === "function") baseRes = await env.ASSETS.fetch(request);
      else baseRes = await fetch(request);
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
      return htmlResponse(baseRes, injectMeta(html, meta));
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
      return htmlResponse(baseRes, injectMeta(html, meta));
    }

    const known = ROUTE_META.find(([re]) => re.test(url.pathname));
    if (known) {
      const html = await baseRes.text();
      const cfg = known[1];
      const meta = buildMeta({
        title: cfg.title,
        description: cfg.description,
        image: DEFAULT_IMAGE,
        pageUrl: `${SITE_URL}${url.pathname}`,
        type: cfg.type || "website",
      });
      return htmlResponse(baseRes, injectMeta(html, meta));
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
      return htmlResponse(baseRes, injectMeta(html, meta));
    }

    const html = await baseRes.text();
    const fallbackMeta = buildMeta({
      title: "Celeone TV Portal",
      description: HOME_DESCRIPTION,
      image: DEFAULT_IMAGE,
      pageUrl: `${SITE_URL}${url.pathname}`,
      type: "website",
    });
    return htmlResponse(baseRes, injectMeta(html, fallbackMeta));
  },
};
