import { ChariowService } from "../../_lib/chariow";
import { requireFounderClient } from "../../_lib/client-guard";
import { extractFounderReferenceId } from "../../_lib/founder-reference";
import { founderLevel, paymentDocumentId } from "../../_lib/founder-payments";
import { requireFirebaseUser } from "../../_lib/firebase-admin";
import { errorMessage, json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

function levelLabel(level: string) {
  if (level === "legacy") return "legacy";
  if (level === "pioneer") return "pioneer";
  if (level === "builder") return "builder";
  return "supporter";
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const clientError = requireFounderClient(request, env);
    if (clientError) return clientError;

    const user = await requireFirebaseUser(request, env);
    const body = await request.json().catch(() => null) as { founderReferenceId?: string; receiptReference?: string } | null;
    const manualFounderReferenceId = String(body?.founderReferenceId || "").trim().toUpperCase();
    const receiptReference = String(body?.receiptReference || "").trim();

    if (!receiptReference) {
      return json({ ok: false, error: "RECEIPT_REQUIRED" }, { status: 400 });
    }

    const verification = await new ChariowService(env).verifyFounderSale(receiptReference);
    if (!verification.eligible) {
      return json({ ok: false, error: verification.reason }, { status: 422 });
    }

    const sale = verification.sale;
    if (sale.customer.email !== user.email) {
      return json({ ok: false, error: "PURCHASE_EMAIL_MISMATCH" }, { status: 409 });
    }

    const saleFounderReferenceId = extractFounderReferenceId(sale);
    if (manualFounderReferenceId && saleFounderReferenceId && manualFounderReferenceId !== saleFounderReferenceId) {
      return json({ ok: false, error: "FOUNDER_ID_MISMATCH" }, { status: 409 });
    }

    const founderReferenceId = saleFounderReferenceId || manualFounderReferenceId;
    if (!founderReferenceId) {
      return json({ ok: false, error: "FOUNDER_ID_NOT_FOUND_IN_PAYMENT" }, { status: 422 });
    }

    const level = levelLabel(founderLevel(sale.amount.value, sale.amount.currency));
    return json({
      ok: true,
      status: "verified",
      founderReferenceId,
      verification: {
        founderReferenceId,
        saleId: sale.id,
        paymentId: paymentDocumentId(sale.id),
        amount: sale.amount.value,
        currency: sale.amount.currency,
        purchaseDate: sale.completed_at || sale.created_at || new Date().toISOString(),
        paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
        purchaseEmail: sale.customer.email,
        customerName: sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim(),
        customerPhone: sale.customer.phone || "",
        customerCountry: sale.customer.country || "",
        founderLevel: level,
      },
    });
  } catch (error) {
    const message = errorMessage(error);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return json({ ok: false, error: message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "ACTIVATION_FAILED" }, { status });
  }
}

export async function onRequestGet({ request, env }: Context) {
  const clientError = requireFounderClient(request, env);
  if (clientError) return clientError;
  return json({ ok: true, route: "/api/founders/activate", mode: "verify_only" });
}
