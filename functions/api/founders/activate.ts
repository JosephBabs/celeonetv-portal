import { ChariowService } from "../../_lib/chariow";
import { requireFounderClient } from "../../_lib/client-guard";
import { approveFounderApplicationTrusted } from "../../_lib/founder-credentials";
import { createDocument, getDocument, queryEquals, updateDocument } from "../../_lib/firebase-admin";
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

function applicationDocumentId(paymentId: string) {
  return `activation_${paymentId}`;
}

function canFallbackToClient(message: string) {
  return message === "FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED"
    || message === "FIREBASE_TOKEN_ERROR"
    || message.startsWith("FIRESTORE_")
    || message.startsWith("STORAGE_");
}

function splitDisplayName(displayName: string) {
  const normalized = String(displayName || "").trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    displayName: normalized,
  };
}

async function upsertCollectionDocument(env: PortalEnv, collection: string, id: string, data: Record<string, unknown>) {
  const result = await createDocument(env, collection, id, data);
  if (!result.created) await updateDocument(env, `${collection}/${id}`, data);
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
    const paymentId = paymentDocumentId(sale.id);
    const applicationId = applicationDocumentId(paymentId);
    const now = new Date().toISOString();

    const existingPayment = await getDocument(env, `founderPayments/${paymentId}`) as Record<string, unknown> | null;
    if (existingPayment?.userId && String(existingPayment.userId) !== user.uid) {
      return json({ ok: false, error: "PAYMENT_ALREADY_LINKED" }, { status: 409 });
    }

    const reservations = await queryEquals(env, "founderReservations", "publicFounderId", founderReferenceId, 1);
    const reservation = reservations[0] as Record<string, unknown> | undefined;
    if (!reservation?.id) {
      return json({ ok: false, error: "FOUNDER_REFERENCE_NOT_FOUND" }, { status: 404 });
    }
    if (reservation.userId && String(reservation.userId) !== user.uid) {
      return json({ ok: false, error: "FOUNDER_REFERENCE_ALREADY_USED" }, { status: 409 });
    }
    if (reservation.founderId && String(reservation.userId || "") === user.uid) {
      const founder = await getDocument(env, `founders/${String(reservation.founderId)}`) as Record<string, unknown> | null;
      return json({
        ok: true,
        status: "active",
        founderId: String(reservation.founderId || ""),
        founderReferenceId,
        applicationId,
        paymentId,
        verification: {
          founderReferenceId,
          saleId: sale.id,
          paymentId,
          amount: sale.amount.value,
          currency: sale.amount.currency,
          purchaseDate: sale.completed_at || sale.created_at || now,
          paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
          purchaseEmail: sale.customer.email,
          customerName: sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim(),
          customerPhone: sale.customer.phone || "",
          customerCountry: sale.customer.country || "",
          founderLevel: level,
        },
        founder: founder ? {
          id: String(founder.id || reservation.founderId || ""),
          publicFounderId: String(founder.publicFounderId || founderReferenceId),
          status: String(founder.status || "active"),
          certificateStatus: String(founder.certificateStatus || founder.status || "active"),
        } : null,
      });
    }

    const reservationName = String(reservation.displayName || "").trim() || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim() || String(sale.customer.name || "").trim();
    const { firstName, lastName, displayName } = splitDisplayName(reservationName);

    await upsertCollectionDocument(env, "founderPayments", paymentId, {
      provider: "chariow",
      providerSaleId: sale.id,
      providerTransactionId: sale.payment?.transaction_id || "",
      providerCustomerId: sale.customer.id || "",
      providerProductId: sale.product.id || "",
      providerStoreId: sale.store?.id || "",
      customerEmail: sale.customer.email,
      customerName: displayName || sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim(),
      customerPhone: sale.customer.phone || "",
      amount: sale.amount.value,
      currency: sale.amount.currency,
      paymentStatus: sale.payment?.status || "success",
      saleStatus: sale.status,
      channel: sale.payment?.gateway || "",
      paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
      completedAt: sale.completed_at || sale.created_at || now,
      verified: true,
      verifiedAt: now,
      verificationSource: "chariow_api_verified_backend",
      founderId: "",
      founderReferenceId,
      userId: user.uid,
      matchedUserId: user.uid,
      activationStatus: "pending_review",
      founderLevel: level,
      rawPayloadRestricted: {
        saleId: sale.id,
        productId: sale.product.id || "",
        productUrl: sale.product.url || "",
        verifiedAgainstApiAt: now,
      },
      createdAt: String(existingPayment?.createdAt || now),
      updatedAt: now,
    });

    const existingApplication = await getDocument(env, `founderApplications/${applicationId}`) as Record<string, unknown> | null;
    await upsertCollectionDocument(env, "founderApplications", applicationId, {
      userId: user.uid,
      paymentId,
      firstName,
      lastName,
      displayName,
      email: user.email,
      phone: sale.customer.phone || "",
      country: sale.customer.country || "",
      city: "",
      purchaseEmail: sale.customer.email,
      chariowOrderReference: sale.id,
      publicFounderId: founderReferenceId,
      claimedAmount: sale.amount.value,
      claimedCurrency: sale.amount.currency,
      purchaseDate: sale.completed_at || sale.created_at || now,
      paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
      receiptReference,
      receiptFileName: "",
      receiptUrl: "",
      profilePhotoUrl: "",
      publicRecognitionConsent: true,
      termsAccepted: true,
      founderLevel: level,
      status: "pending",
      verificationMethod: "chariow_api_verified",
      reviewedBy: "",
      reviewedAt: "",
      rejectionReason: "",
      createdAt: String(existingApplication?.createdAt || now),
      updatedAt: now,
    });

    await updateDocument(env, `founderReservations/${String(reservation.id)}`, {
      userId: user.uid,
      email: user.email,
      paymentId,
      applicationId,
      status: "pending_review",
      activationStatus: "pending_review",
      updatedAt: now,
    });

    try {
      const approved = await approveFounderApplicationTrusted(env, applicationId, user.uid);
      const founder = await getDocument(env, `founders/${approved.founderId}`) as Record<string, unknown> | null;
      return json({
        ok: true,
        status: "active",
        founderId: approved.founderId,
        applicationId,
        paymentId,
        founderReferenceId,
        verification: {
          founderReferenceId,
          saleId: sale.id,
          paymentId,
          amount: sale.amount.value,
          currency: sale.amount.currency,
          purchaseDate: sale.completed_at || sale.created_at || now,
          paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
          purchaseEmail: sale.customer.email,
          customerName: sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim(),
          customerPhone: sale.customer.phone || "",
          customerCountry: sale.customer.country || "",
          founderLevel: level,
        },
        founder: founder ? {
          id: String(founder.id || approved.founderId),
          publicFounderId: String(founder.publicFounderId || founderReferenceId),
          status: String(founder.status || "active"),
          certificateStatus: String(founder.certificateStatus || founder.status || "active"),
          credentialStatus: String(founder.credentialStatus || ""),
        } : null,
      });
    } catch (error) {
      const message = errorMessage(error);
      if (!canFallbackToClient(message)) throw error;
      return json({
        ok: true,
        status: "verified_client_pending",
        applicationId,
        paymentId,
        founderReferenceId,
        fallbackReason: message,
        verification: {
          founderReferenceId,
          saleId: sale.id,
          paymentId,
          amount: sale.amount.value,
          currency: sale.amount.currency,
          purchaseDate: sale.completed_at || sale.created_at || now,
          paymentMethod: sale.payment?.method?.name || sale.payment?.gateway || "",
          purchaseEmail: sale.customer.email,
          customerName: sale.customer.name || `${sale.customer.first_name || ""} ${sale.customer.last_name || ""}`.trim(),
          customerPhone: sale.customer.phone || "",
          customerCountry: sale.customer.country || "",
          founderLevel: level,
        },
      });
    }
  } catch (error) {
    const message = errorMessage(error);
    if (message === "UNAUTHORIZED") {
      return json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }
    if (message === "FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED") {
      return json({ ok: false, error: "FIREBASE_SERVICE_ACCOUNT_NOT_CONFIGURED" }, { status: 503 });
    }
    if (
      message === "FIREBASE_TOKEN_ERROR"
      || message.startsWith("FIRESTORE_")
      || message.startsWith("STORAGE_")
    ) {
      return json({ ok: false, error: message }, { status: 503 });
    }
    return json({ ok: false, error: "ACTIVATION_FAILED" }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }: Context) {
  const clientError = requireFounderClient(request, env);
  if (clientError) return clientError;
  return json({ ok: true, route: "/api/founders/activate", mode: "verify_only" });
}
