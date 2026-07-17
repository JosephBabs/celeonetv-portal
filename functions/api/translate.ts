/* eslint-disable @typescript-eslint/no-explicit-any */
import { translatePlainTextEmbedded } from "../../src/lib/embeddedTranslator";

type Env = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  LIBRETRANSLATE_URL?: string;
  LIBRETRANSLATE_API_KEY?: string;
};

const SUPPORTED_LANGUAGES = ["en", "fr", "es", "yo", "fon", "gou", "auto"];

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=UTF-8");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "POST, OPTIONS");
  headers.set("access-control-allow-headers", "content-type, authorization");
  return new Response(JSON.stringify(data), { ...init, headers });
}

function cleanLang(value: unknown, fallback = "en") {
  const raw = String(value || fallback).trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(raw) ? raw : fallback;
}

async function fetchWithTimeout(url: string, ms: number, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
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
    }).catch(() => null);
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
      source: source === "auto" ? "auto" : source,
      target,
      format: /<[^>]+>/.test(text) ? "html" : "text",
      api_key: env.LIBRETRANSLATE_API_KEY || undefined,
    }),
  });
  if (!res.ok) return "";
  const data: any = await res.json();
  return String(data?.translatedText || "").trim();
}

export function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost(context: any) {
  let body: any = {};
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: "BAD_JSON" }, { status: 400 });
  }

  const text = String(body.text || "").slice(0, 12000);
  const target = cleanLang(body.target || body.targetLang || "en", "en");
  const source = cleanLang(body.source || body.sourceLang || "auto", "auto");

  if (!text.trim()) return jsonResponse({ translatedText: "", source, target, cached: false });
  if (source === target) return jsonResponse({ translatedText: text, source, target, cached: true });

  const cacheKey = new Request(`${new URL(context.request.url).origin}/api/translate-cache/${await sha256Hex(`${source}:${target}:${text}`)}`);
  const edgeCache = (caches as any).default as Cache | undefined;
  const cached = edgeCache ? await edgeCache.match(cacheKey) : null;
  if (cached) return cached;

  const openaiResult = await translateWithOpenAI(context.env || {}, text, target, source).catch(() => ({ text: "", error: "exception" }));
  const embeddedResult = translatePlainTextEmbedded(text, target, source);
  const translatedText =
    openaiResult.text ||
    (await translateWithLibre(context.env || {}, text, target, source).catch(() => "")) ||
    embeddedResult.translatedText;

  if (!translatedText) {
    return jsonResponse({
      error: "TRANSLATION_PROVIDER_UNAVAILABLE",
      translatedText: "",
      source,
      target,
      providers: {
        openai: !!context.env?.OPENAI_API_KEY,
        libreTranslate: !!context.env?.LIBRETRANSLATE_URL,
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

export function onRequestGet() {
  return jsonResponse({
    ok: true,
    route: "/api/translate",
    method: "POST",
    providers: {
      openai: false,
      libreTranslate: false,
    },
    body: { text: "Bonjour", source: "fr", target: "en" },
  });
}
