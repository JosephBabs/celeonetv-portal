/* eslint-disable @typescript-eslint/no-explicit-any */
type Env = {
  CHARIOW_WEBHOOK_SECRET?: string;
  CHARIOW_PRODUCT_ID?: string;
};

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=UTF-8");
  return new Response(JSON.stringify(data), { ...init, headers });
}

async function hmacHex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const env = context.env || {};
  const rawBody = await context.request.text();

  if (!env.CHARIOW_WEBHOOK_SECRET || !env.CHARIOW_PRODUCT_ID) {
    return json(
      {
        ok: false,
        error: "CHARIOW_WEBHOOK_NOT_CONFIGURED",
        message: "Configure CHARIOW_WEBHOOK_SECRET and CHARIOW_PRODUCT_ID before enabling automatic Founder payment verification.",
      },
      { status: 503 },
    );
  }

  const signature =
    context.request.headers.get("x-chariow-signature") ||
    context.request.headers.get("chariow-signature") ||
    "";
  if (!signature) return json({ ok: false, error: "SIGNATURE_REQUIRED" }, { status: 401 });

  const expected = await hmacHex(env.CHARIOW_WEBHOOK_SECRET, rawBody);
  if (!safeEqual(signature, expected)) return json({ ok: false, error: "INVALID_SIGNATURE" }, { status: 401 });

  let event: any = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ ok: false, error: "BAD_JSON" }, { status: 400 });
  }

  const productId = String(event?.productId || event?.product_id || event?.data?.productId || "");
  if (productId !== env.CHARIOW_PRODUCT_ID) return json({ ok: false, error: "PRODUCT_MISMATCH" }, { status: 400 });

  // TODO: Persist raw event and payment verification with a trusted server Firebase Admin credential.
  // This endpoint intentionally does not mark payments as verified until the Chariow payload contract
  // and server-side database credentials are configured.
  return json(
    {
      ok: false,
      error: "PERSISTENCE_NOT_CONFIGURED",
      message: "Webhook signature is valid, but automatic Founder payment persistence is not enabled yet.",
    },
    { status: 501 },
  );
}

export function onRequestGet() {
  return json({
    ok: true,
    route: "/api/webhooks/chariow",
    method: "POST",
    status: "signature validation scaffold ready; persistence requires Chariow credentials and server Firebase Admin configuration",
  });
}
