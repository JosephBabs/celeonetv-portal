import { createDocument, getDocument, updateDocument } from "../../_lib/firebase-admin";
import { verifyAndPersistSale } from "../../_lib/founder-payments";
import { errorMessage, json } from "../../_lib/http";
import type { ChariowPulseEvent, PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };
const supportedEvents = new Set<ChariowPulseEvent>(["successful.sale", "abandoned.sale", "failed.sale"]);

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function pulseDetails(payload: Record<string, unknown>) {
  const data = (payload.data && typeof payload.data === "object" ? payload.data : {}) as Record<string, unknown>;
  const sale = (payload.sale && typeof payload.sale === "object" ? payload.sale : data.sale && typeof data.sale === "object" ? data.sale : {}) as Record<string, unknown>;
  return {
    event: String(payload.event || payload.type || data.event || "") as ChariowPulseEvent,
    eventId: String(payload.id || data.id || ""),
    saleId: String(sale.id || payload.sale_id || data.sale_id || ""),
  };
}

export async function onRequestPost({ request, env }: Context) {
  const url = new URL(request.url);
  if (!env.CHARIOW_PULSE_TOKEN || url.searchParams.get("token") !== env.CHARIOW_PULSE_TOKEN) {
    return json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const raw = await request.text();
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(raw) as Record<string, unknown>; } catch { return json({ ok: false, error: "BAD_JSON" }, { status: 400 }); }
  const { event, eventId, saleId } = pulseDetails(payload);
  if (!supportedEvents.has(event) || !saleId) return json({ ok: false, error: "INVALID_PULSE" }, { status: 422 });

  const logId = (eventId || `${event}-${saleId}`).replace(/[^a-zA-Z0-9_-]/g, "_");
  const now = new Date().toISOString();
  const created = await createDocument(env, "chariowWebhookEvents", logId, {
    event,
    saleId,
    productId: "",
    payloadHash: await sha256(raw),
    processingStatus: "received",
    attemptCount: 1,
    receivedAt: now,
    processedAt: "",
    error: "",
  });
  if (!created.created) {
    const existing = await getDocument(env, `chariowWebhookEvents/${logId}`) as { processingStatus?: string } | null;
    if (existing?.processingStatus === "processed") return json({ ok: true, duplicate: true });
  }

  try {
    if (event === "successful.sale") {
      const result = await verifyAndPersistSale(env, saleId, "pulse_api_confirmation");
      if (!result.ok) {
        await updateDocument(env, `chariowWebhookEvents/${logId}`, { processingStatus: "rejected", processedAt: now, error: result.reason });
        return json({ ok: false, error: result.reason }, { status: 422 });
      }
      await updateDocument(env, `chariowWebhookEvents/${logId}`, {
        processingStatus: "processed",
        processedAt: new Date().toISOString(),
        productId: result.sale.product.id,
        error: "",
      });
      return json({ ok: true, duplicate: result.duplicate, saleId });
    }

    const paymentId = saleId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const payment = await getDocument(env, `founderPayments/${paymentId}`);
    if (payment) await updateDocument(env, `founderPayments/${paymentId}`, {
      saleStatus: event === "failed.sale" ? "failed" : "abandoned",
      paymentStatus: event === "failed.sale" ? "failed" : "cancelled",
      activationStatus: "not_eligible",
      updatedAt: now,
    });
    await updateDocument(env, `chariowWebhookEvents/${logId}`, { processingStatus: "processed", processedAt: now, error: "" });
    return json({ ok: true, saleId });
  } catch (error) {
    const message = errorMessage(error);
    await updateDocument(env, `chariowWebhookEvents/${logId}`, { processingStatus: "failed", processedAt: new Date().toISOString(), error: message.slice(0, 300) }).catch(() => undefined);
    console.error("Chariow Pulse processing failed", { event, saleId, error: message });
    return json({ ok: false, error: "PULSE_PROCESSING_FAILED" }, { status: 502 });
  }
}

export function onRequestGet() {
  return json({ ok: true, route: "/api/webhooks/chariow", events: Array.from(supportedEvents) });
}
