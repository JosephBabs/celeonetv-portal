import { ChariowService } from "./chariow";
import { addDocument, createDocument, getDocument, queryEquals } from "./firebase-admin";
import { extractFounderReferenceId } from "./founder-reference";
import type { ChariowSale, PortalEnv } from "./types";

export function founderLevel(amount: number, currency: string) {
  if (currency.toUpperCase() !== "XOF" && currency.toUpperCase() !== "FCFA") return "manual_review";
  if (amount >= 100_000) return "legacy";
  if (amount >= 25_000) return "pioneer";
  if (amount >= 5_000) return "builder";
  return "supporter";
}

export function paymentDocumentId(saleId: string) {
  return saleId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

function customerName(sale: ChariowSale) {
  return sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim();
}

export async function persistVerifiedFounderSale(env: PortalEnv, sale: ChariowSale, source: string) {
  const paymentId = paymentDocumentId(sale.id);
  const existing = await getDocument(env, `founderPayments/${paymentId}`) as { verified?: boolean; userId?: string } | null;
  if (existing?.verified) return { paymentId, duplicate: true, payment: existing };

  const now = new Date().toISOString();
  const founderReferenceId = extractFounderReferenceId(sale);
  const users = await queryEquals(env, "user_data", "email", sale.customer.email, 3);
  const matchStatus = users.length === 1 ? "ready_to_activate" : users.length === 0 ? "unclaimed" : "requires_manual_review";
  const matchedUserId = users.length === 1 ? users[0].id : "";
  const level = founderLevel(sale.amount.value, sale.amount.currency);
  const data = {
    provider: "chariow",
    providerSaleId: sale.id,
    providerTransactionId: sale.payment?.transaction_id || "",
    providerCustomerId: sale.customer.id || "",
    providerProductId: sale.product.id,
    providerStoreId: sale.store?.id || "",
    customerEmail: sale.customer.email,
    customerName: customerName(sale),
    customerPhone: sale.customer.phone || "",
    amount: sale.amount.value,
    currency: sale.amount.currency,
    paymentStatus: sale.payment?.status || "",
    saleStatus: sale.status,
    channel: sale.payment?.gateway || "",
    paymentMethod: sale.payment?.method?.name || "",
    completedAt: sale.completed_at || "",
    verified: true,
    verifiedAt: now,
    verificationSource: source,
    founderId: "",
    founderReferenceId,
    userId: matchedUserId,
    matchedUserId,
    activationStatus: matchStatus,
    founderLevel: level,
    rawPayloadRestricted: { saleId: sale.id, verifiedAgainstApiAt: now, founderReferenceId },
    createdAt: now,
    updatedAt: now,
  };
  const result = await createDocument(env, "founderPayments", paymentId, data);
  if (!result.created) return { paymentId, duplicate: true, payment: await getDocument(env, `founderPayments/${paymentId}`) };
  await addDocument(env, "founderAuditLogs", {
    action: "chariow_sale_verified",
    entityType: "founderPayment",
    entityId: paymentId,
    userId: matchedUserId,
    adminId: "",
    metadata: { providerSaleId: sale.id, source, matchStatus, founderReferenceId },
    createdAt: now,
  });
  if (matchedUserId) {
    await addDocument(env, "notifications", {
      userId: matchedUserId,
      title: "Founder's Pass",
      body: "Votre contribution Chariow a ete verifiee. Vous pouvez maintenant activer votre Cele One Founder's Pass.",
      type: "founder_payment_verified",
      link: "/founders/activate",
      read: false,
      createdAt: now,
    });
  }
  return { paymentId, duplicate: false, payment: data };
}

export async function verifyAndPersistSale(env: PortalEnv, saleId: string, source: string) {
  const verification = await new ChariowService(env).verifyFounderSale(saleId);
  if (!verification.eligible) return { ok: false as const, reason: verification.reason, sale: verification.sale };
  const persisted = await persistVerifiedFounderSale(env, verification.sale, source);
  return { ok: true as const, sale: verification.sale, ...persisted };
}
