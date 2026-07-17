import { createDocument, getDocument, queryEquals, requireFirebaseUser, updateDocument } from "../../_lib/firebase-admin";
import { paymentDocumentId, verifyAndPersistSale } from "../../_lib/founder-payments";
import { errorMessage, json } from "../../_lib/http";
import type { PortalEnv } from "../../_lib/types";

type Context = { request: Request; env: PortalEnv };

function splitName(displayName: string) {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    displayName: normalized,
  };
}

function levelLabel(level: string) {
  if (level === "legacy") return "legacy";
  if (level === "pioneer") return "pioneer";
  if (level === "builder") return "builder";
  if (level === "supporter") return "supporter";
  return "supporter";
}

export async function onRequestPost({ request, env }: Context) {
  try {
    const user = await requireFirebaseUser(request, env);
    const body = await request.json().catch(() => null) as { displayName?: string; receiptReference?: string } | null;
    const displayName = String(body?.displayName || "").trim().replace(/\s+/g, " ");
    const receiptReference = String(body?.receiptReference || "").trim();

    if (!displayName || !receiptReference) {
      return json({ ok: false, error: "DISPLAY_NAME_AND_RECEIPT_REQUIRED" }, { status: 400 });
    }

    const verification = await verifyAndPersistSale(env, receiptReference, "activation_form");
    if (!verification.ok) {
      return json({ ok: false, error: verification.reason }, { status: 422 });
    }

    const sale = verification.sale;
    if (sale.customer.email !== user.email) {
      return json({ ok: false, error: "PURCHASE_EMAIL_MISMATCH" }, { status: 409 });
    }

    const paymentId = paymentDocumentId(sale.id);
    const payment = await getDocument(env, `founderPayments/${paymentId}`) as { userId?: string; founderId?: string; activationStatus?: string } | null;
    if (!payment) return json({ ok: false, error: "PAYMENT_NOT_FOUND" }, { status: 404 });
    if (payment.founderId) return json({ ok: true, status: "already_activated", paymentId });
    if (payment.userId && payment.userId !== user.uid) {
      return json({ ok: false, error: "PAYMENT_ALREADY_LINKED" }, { status: 409 });
    }

    const { firstName, lastName } = splitName(displayName);
    const now = new Date().toISOString();
    const existingFounders = await queryEquals(env, "founders", "userId", user.uid, 1);
    if (existingFounders.length) {
      await updateDocument(env, `founderPayments/${paymentId}`, {
        userId: user.uid,
        matchedUserId: user.uid,
        activationStatus: "already_active",
        updatedAt: now,
      });
      return json({ ok: true, status: "already_active", paymentId, founderId: existingFounders[0].id });
    }

    await updateDocument(env, `founderPayments/${paymentId}`, {
      userId: user.uid,
      matchedUserId: user.uid,
      customerName: displayName,
      activationStatus: payment.activationStatus === "requires_manual_review" ? "requires_manual_review" : "pending_review",
      updatedAt: now,
    });

    const applicationId = `activation_${paymentId}`;
    const payload = {
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
      founderLevel: levelLabel(String((await getDocument(env, `founderPayments/${paymentId}`) as { founderLevel?: string } | null)?.founderLevel || "")),
      status: "pending",
      verificationMethod: "chariow_api_verified",
      reviewedBy: "",
      reviewedAt: "",
      rejectionReason: "",
      createdAt: now,
      updatedAt: now,
    };

    const created = await createDocument(env, "founderApplications", applicationId, payload);
    if (!created.created) {
      await updateDocument(env, `founderApplications/${applicationId}`, {
        displayName,
        firstName,
        lastName,
        paymentId,
        receiptReference,
        updatedAt: now,
      });
    }

    return json({ ok: true, status: "pending_review", applicationId, paymentId, duplicatePayment: verification.duplicate });
  } catch (error) {
    const message = errorMessage(error);
    const status = message === "UNAUTHORIZED" ? 401 : 500;
    return json({ ok: false, error: message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "ACTIVATION_FAILED" }, { status });
  }
}

export async function onRequestGet({ request, env }: Context) {
  try {
    const user = await requireFirebaseUser(request, env);
    const applications = await queryEquals(env, "founderApplications", "userId", user.uid, 5);
    const payments = await queryEquals(env, "founderPayments", "userId", user.uid, 5);
    return json({
      ok: true,
      application: applications[0] || null,
      payment: payments[0] || null,
    });
  } catch (error) {
    const message = errorMessage(error);
    return json({ ok: false, error: message === "UNAUTHORIZED" ? "UNAUTHORIZED" : "FETCH_FAILED" }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
