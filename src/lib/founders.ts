/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  addDoc,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { APP } from "./config";
import { db } from "./firebase";

export type FounderApplicationStatus = "pending" | "approved" | "rejected" | "more_info_requested";
export type FounderStatus = "active" | "inactive" | "suspended" | "revoked";
export type FounderLevelId = "supporter" | "builder" | "pioneer" | "legacy";

export type FounderApplicationInput = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  purchaseEmail: string;
  chariowOrderReference: string;
  claimedAmount: number;
  claimedCurrency: string;
  purchaseDate: string;
  paymentMethod: string;
  receiptFileName?: string;
  receiptUrl?: string;
  profilePhotoUrl?: string;
  publicRecognitionConsent: boolean;
  termsAccepted: boolean;
};

export type FounderActivationVerification = {
  founderReferenceId: string;
  saleId: string;
  paymentId: string;
  amount: number;
  currency: string;
  purchaseDate: string;
  paymentMethod: string;
  purchaseEmail: string;
  customerName: string;
  customerPhone: string;
  customerCountry: string;
  founderLevel: FounderLevelId;
};

export const FOUNDER_COLLECTIONS = {
  applications: "founderApplications",
  payments: "founderPayments",
  founders: "founders",
  benefits: "founderBenefits",
  invitations: "founderInvitations",
  announcements: "founderAnnouncements",
  auditLogs: "founderAuditLogs",
};

export function founderLevelForAmount(amount: number): FounderLevelId {
  const levels = APP.founders.levels;
  const sorted = [...levels].sort((a, b) => b.minAmount - a.minAmount);
  return (sorted.find((level) => amount >= level.minAmount)?.id || "supporter") as FounderLevelId;
}

export function founderLevelLabel(levelId?: string) {
  return APP.founders.levels.find((level) => level.id === levelId)?.label || "Supporter";
}

export function founderCertificateNumber(publicFounderId: string) {
  const normalized = String(publicFounderId || "").trim().toUpperCase();
  if (!normalized) return "";
  return normalized.startsWith("CERT-") ? normalized : `CERT-${normalized}`;
}

export function founderPublicIdFromIdentifier(identifier: string) {
  return String(identifier || "").trim().toUpperCase().replace(/^CERT-/, "");
}

export function verificationUrl(identifier: string) {
  const base = APP.founders.verificationBaseUrl.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(String(identifier || "").trim().toUpperCase())}`;
}

export function qrCodeUrl(identifier: string) {
  return `https://quickchart.io/qr?size=220&margin=2&text=${encodeURIComponent(verificationUrl(identifier))}`;
}

export async function assertUniqueOrderReference(reference: string) {
  const normalized = reference.trim();
  const existing = await getDocs(
    query(
      collection(db, FOUNDER_COLLECTIONS.applications),
      where("chariowOrderReference", "==", normalized),
      limit(1),
    ),
  );
  if (!existing.empty) throw new Error("DUPLICATE_ORDER_REFERENCE");
}

export async function submitFounderApplication(input: FounderApplicationInput) {
  if (!input.termsAccepted) throw new Error("TERMS_REQUIRED");
  if (!input.chariowOrderReference.trim()) throw new Error("ORDER_REFERENCE_REQUIRED");
  if (!Number.isFinite(input.claimedAmount) || input.claimedAmount <= 0) throw new Error("INVALID_AMOUNT");
  await assertUniqueOrderReference(input.chariowOrderReference);

  const payload = {
    ...input,
    chariowOrderReference: input.chariowOrderReference.trim(),
    purchaseEmail: input.purchaseEmail.trim().toLowerCase(),
    email: input.email.trim().toLowerCase(),
    claimedCurrency: input.claimedCurrency.trim().toUpperCase(),
    status: "pending" satisfies FounderApplicationStatus,
    verificationMethod: "manual_pending",
    reviewedBy: "",
    reviewedAt: null,
    rejectionReason: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const created = await addDoc(collection(db, FOUNDER_COLLECTIONS.applications), payload);
  await addAuditLog("application_submitted", "founderApplication", created.id, input.userId, "", {
    chariowOrderReference: input.chariowOrderReference.trim(),
  });
  return created.id;
}

export async function getLatestFounderApplication(userId: string) {
  const snap = await getDocs(
    query(
      collection(db, FOUNDER_COLLECTIONS.applications),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(1),
    ),
  ).catch(async () => {
    return getDocs(query(collection(db, FOUNDER_COLLECTIONS.applications), where("userId", "==", userId), limit(1)));
  });
  const docSnap = snap.docs[0];
  return docSnap ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getLatestFounderPayment(userId: string, email = "") {
  const byUser = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.payments), where("userId", "==", userId), limit(1)),
  ).catch(() => null);
  const first = byUser?.docs[0];
  if (first) return { id: first.id, ...first.data() };
  if (!email.trim()) return null;
  const byEmail = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.payments), where("customerEmail", "==", email.trim().toLowerCase()), limit(1)),
  ).catch(() => null);
  const second = byEmail?.docs[0];
  return second ? { id: second.id, ...second.data() } : null;
}

export async function getFounderByUserId(userId: string) {
  const snap = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.founders), where("userId", "==", userId), limit(1)),
  );
  const docSnap = snap.docs[0];
  return docSnap ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getFounderByPublicId(publicFounderId: string) {
  const normalized = String(publicFounderId || "").trim().toUpperCase();
  if (!normalized) return null;
  const byCertificate = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.founders), where("certificateNumber", "==", normalized), limit(1)),
  ).catch(() => null);
  const certificateDoc = byCertificate?.docs[0];
  if (certificateDoc) return { id: certificateDoc.id, ...certificateDoc.data() };

  const byPublicFounderId = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.founders), where("publicFounderId", "==", founderPublicIdFromIdentifier(normalized)), limit(1)),
  );
  const founderDoc = byPublicFounderId.docs[0];
  if (founderDoc) return { id: founderDoc.id, ...founderDoc.data() };

  const reservationPublicId = founderPublicIdFromIdentifier(normalized);
  const reservationSnap = await getDoc(doc(db, "founderReservations", reservationDocumentId(reservationPublicId))).catch(() => null);
  if (!reservationSnap?.exists()) return null;
  const reservation = reservationSnap.data() as Record<string, any>;
  const status = String(reservation.activationStatus || reservation.status || "").trim();
  const active = status === "active" || status === "verified";
  return {
    id: reservationSnap.id,
    publicFounderId: reservationPublicId,
    displayName: String(reservation.displayName || `${reservation.firstName || ""} ${reservation.lastName || ""}`).trim() || "-",
    founderLevel: String(reservation.founderLevel || ""),
    certificateNumber: founderCertificateNumber(reservationPublicId),
    joinedAt: String(reservation.updatedAt || reservation.createdAt || ""),
    issuedAt: String(reservation.updatedAt || reservation.createdAt || ""),
    status: active ? "active" : status || "pending_review",
    certificateStatus: active ? "active" : "pending_review",
    activationStatus: status || "pending_review",
    verificationUrl: verificationUrl(founderCertificateNumber(reservationPublicId)),
    source: "founderReservations",
  };
}

export function reservationDocumentId(publicFounderId: string) {
  return `reservation_${String(publicFounderId || "").toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

export function paymentDocumentId(saleId: string) {
  return String(saleId || "").replace(/[^a-zA-Z0-9_-]/g, "_");
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

export async function submitFounderActivationClient(params: {
  uid: string;
  accountEmail: string;
  founderReferenceId: string;
  receiptReference: string;
  verification: FounderActivationVerification;
}) {
  const uid = String(params.uid || "").trim();
  const accountEmail = String(params.accountEmail || "").trim().toLowerCase();
  const founderReferenceId = String(params.founderReferenceId || "").trim().toUpperCase();
  const receiptReference = String(params.receiptReference || "").trim();
  if (!uid || !accountEmail || !founderReferenceId || !receiptReference) throw new Error("ACTIVATION_DATA_INCOMPLETE");

  const reservationRef = doc(db, "founderReservations", reservationDocumentId(founderReferenceId));
  const reservationSnap = await getDoc(reservationRef);
  if (!reservationSnap.exists()) throw new Error("FOUNDER_REFERENCE_NOT_FOUND");
  const reservation = reservationSnap.data() as Record<string, any>;
  if (String(reservation.founderId || "").trim()) throw new Error("FOUNDER_REFERENCE_ALREADY_USED");
  if (String(reservation.paymentId || "").trim() && String(reservation.paymentId) !== params.verification.paymentId) throw new Error("FOUNDER_REFERENCE_ALREADY_USED");

  const displayName = String(reservation.displayName || "").trim();
  const { firstName, lastName } = splitDisplayName(displayName);
  const now = new Date().toISOString();
  const paymentId = params.verification.paymentId || paymentDocumentId(params.verification.saleId);
  const applicationId = `activation_${paymentId}`;
  const founderDocId = founderReferenceId;
  const founderStatus = "active";
  const certificateNumber = founderCertificateNumber(founderReferenceId);

  await setDoc(doc(db, "founderPayments", paymentId), {
    provider: "chariow",
    providerSaleId: params.verification.saleId,
    providerTransactionId: "",
    providerCustomerId: "",
    providerProductId: "",
    providerStoreId: "",
    customerEmail: params.verification.purchaseEmail,
    customerName: displayName || params.verification.customerName,
    customerPhone: params.verification.customerPhone,
    amount: params.verification.amount,
    currency: params.verification.currency,
    paymentStatus: "success",
    saleStatus: "completed",
    channel: "",
    paymentMethod: params.verification.paymentMethod,
    completedAt: params.verification.purchaseDate,
    verified: true,
    verifiedAt: now,
    verificationSource: "client_verified_via_backend",
    founderId: founderDocId,
    founderReferenceId,
    userId: uid,
    matchedUserId: uid,
    activationStatus: "active",
    founderLevel: params.verification.founderLevel,
    rawPayloadRestricted: { saleId: params.verification.saleId, clientRecordedAt: now },
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  await setDoc(doc(db, "founderApplications", applicationId), {
    userId: uid,
    paymentId,
    firstName,
    lastName,
    displayName,
    email: accountEmail,
    phone: params.verification.customerPhone,
    country: params.verification.customerCountry,
    city: "",
    purchaseEmail: params.verification.purchaseEmail,
    chariowOrderReference: params.verification.saleId,
    publicFounderId: founderReferenceId,
    claimedAmount: params.verification.amount,
    claimedCurrency: params.verification.currency,
    purchaseDate: params.verification.purchaseDate,
    paymentMethod: params.verification.paymentMethod,
    receiptReference,
    receiptFileName: "",
    receiptUrl: "",
    profilePhotoUrl: "",
    publicRecognitionConsent: true,
    termsAccepted: true,
    founderLevel: params.verification.founderLevel,
    status: "pending",
    verificationMethod: "chariow_api_verified",
    reviewedBy: "",
    reviewedAt: "",
    rejectionReason: "",
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  await updateDoc(reservationRef, {
    userId: uid,
    email: accountEmail,
    paymentId,
    applicationId,
    founderId: founderDocId,
    status: "verified",
    activationStatus: "active",
    updatedAt: now,
  });

  await setDoc(doc(db, FOUNDER_COLLECTIONS.founders, founderDocId), {
    userId: uid,
    publicFounderId: founderReferenceId,
    applicationId,
    paymentId,
    firstName,
    lastName,
    displayName: displayName || params.verification.customerName,
    email: accountEmail,
    phone: params.verification.customerPhone,
    country: params.verification.customerCountry,
    city: "",
    profilePhotoUrl: "",
    founderLevel: params.verification.founderLevel,
    status: founderStatus,
    certificateStatus: founderStatus,
    joinedAt: params.verification.purchaseDate || now,
    issuedAt: params.verification.purchaseDate || now,
    publicRecognitionConsent: true,
    badgeEnabled: true,
    certificateNumber,
    certificateUrl: "",
    passCardUrl: "",
    qrVerificationToken: certificateNumber,
    benefitAccess: {
      levels: [params.verification.founderLevel],
      coreFounder: true,
    },
    source: "client_activation_verified",
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  return { paymentId, applicationId, founderId: founderDocId, publicFounderId: founderReferenceId };
}

export async function reconcileFounderActivationState(params: {
  userId: string;
  founder?: Record<string, any> | null;
  payment?: Record<string, any> | null;
}) {
  const founder = params.founder || null;
  const payment = params.payment || null;
  const publicFounderId = String(founder?.publicFounderId || payment?.founderReferenceId || "").trim().toUpperCase();
  const paymentId = String(payment?.id || founder?.paymentId || payment?.paymentId || "").trim();
  if (!params.userId || !publicFounderId || !paymentId) return false;

  const updates: Promise<unknown>[] = [];

  if (payment && String(payment.activationStatus || "") !== "active") {
    updates.push(updateDoc(doc(db, FOUNDER_COLLECTIONS.payments, paymentId), {
      activationStatus: "active",
      founderId: String(founder?.id || publicFounderId).trim(),
      founderReferenceId: publicFounderId,
      updatedAt: new Date().toISOString(),
    }).catch(() => null));
  }

  const reservationId = reservationDocumentId(publicFounderId);
  updates.push(updateDoc(doc(db, "founderReservations", reservationId), {
    userId: params.userId,
    founderId: String(founder?.id || publicFounderId).trim(),
    paymentId,
    status: "verified",
    activationStatus: "active",
    updatedAt: new Date().toISOString(),
  }).catch(() => null));

  await Promise.all(updates);
  return updates.length > 0;
}

export async function generateFounderId() {
  const countSnap = await getCountFromServer(collection(db, FOUNDER_COLLECTIONS.founders));
  const next = countSnap.data().count + 1;
  return `COF-${new Date().getFullYear()}-${String(next).padStart(6, "0")}`;
}

export async function approveFounderApplication(applicationId: string, adminId: string) {
  const ref = doc(db, FOUNDER_COLLECTIONS.applications, applicationId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("APPLICATION_NOT_FOUND");
  const application: any = { id: snap.id, ...snap.data() };
  if (application.status === "approved") throw new Error("ALREADY_APPROVED");

  const publicFounderId = await generateFounderId();
  const paymentRef = doc(collection(db, FOUNDER_COLLECTIONS.payments));
  const founderRef = doc(collection(db, FOUNDER_COLLECTIONS.founders));
  const level = founderLevelForAmount(Number(application.claimedAmount || 0));
  const token = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  await setDoc(paymentRef, {
    userId: application.userId,
    applicationId,
    provider: "chariow",
    providerProductId: "",
    providerOrderReference: application.chariowOrderReference,
    providerTransactionReference: application.chariowOrderReference,
    customerEmail: application.purchaseEmail,
    amount: Number(application.claimedAmount || 0),
    currency: application.claimedCurrency,
    paymentMethod: application.paymentMethod,
    paymentStatus: "manual_verified",
    providerPayload: {},
    verified: true,
    verifiedAt: serverTimestamp(),
    refunded: false,
    refundedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(founderRef, {
    userId: application.userId,
    publicFounderId,
    applicationId,
    paymentId: paymentRef.id,
    firstName: application.firstName,
    lastName: application.lastName,
    displayName: `${application.firstName || ""} ${application.lastName || ""}`.trim(),
    email: application.email,
    phone: application.phone,
    country: application.country,
    city: application.city,
    profilePhotoUrl: application.profilePhotoUrl || "",
    founderLevel: level,
    status: "active" satisfies FounderStatus,
    joinedAt: serverTimestamp(),
    publicRecognitionConsent: !!application.publicRecognitionConsent,
    badgeEnabled: true,
    certificateUrl: "",
    passCardUrl: "",
    qrVerificationToken: token,
    benefitAccess: {
      levels: [level],
      coreFounder: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(ref, {
    status: "approved",
    verificationMethod: "manual_admin",
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    paymentId: paymentRef.id,
    founderId: founderRef.id,
    publicFounderId,
  });

  await addAuditLog("application_approved", "founderApplication", applicationId, application.userId, adminId, {
    publicFounderId,
    paymentId: paymentRef.id,
    founderId: founderRef.id,
  });

  return { publicFounderId, founderId: founderRef.id, paymentId: paymentRef.id };
}

export async function rejectFounderApplication(applicationId: string, adminId: string, rejectionReason: string) {
  await updateDoc(doc(db, FOUNDER_COLLECTIONS.applications, applicationId), {
    status: "rejected",
    rejectionReason,
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addAuditLog("application_rejected", "founderApplication", applicationId, "", adminId, { rejectionReason });
}

export async function updateFounderStatus(founderId: string, adminId: string, status: FounderStatus) {
  await updateDoc(doc(db, FOUNDER_COLLECTIONS.founders, founderId), {
    status,
    updatedAt: serverTimestamp(),
  });
  await addAuditLog("founder_status_changed", "founder", founderId, "", adminId, { status });
}

export async function addAuditLog(action: string, entityType: string, entityId: string, userId = "", adminId = "", metadata: Record<string, unknown> = {}) {
  await addDoc(collection(db, FOUNDER_COLLECTIONS.auditLogs), {
    action,
    entityType,
    entityId,
    userId,
    adminId,
    metadata,
    createdAt: serverTimestamp(),
  }).catch(() => null);
}

export function formatDate(value: any) {
  if (!value) return "-";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleDateString();
  if (typeof value === "string") return value;
  return String(value);
}

export function maskReference(value = "") {
  const text = String(value || "");
  if (text.length <= 8) return text;
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

export function synthesizeFounderRecord(params: {
  application?: Record<string, any> | null;
  payment?: Record<string, any> | null;
  user?: { uid?: string; email?: string | null; displayName?: string | null } | null;
}) {
  const application = params.application || null;
  const payment = params.payment || null;
  const user = params.user || null;
  const publicFounderId = String(application?.publicFounderId || payment?.founderReferenceId || "").trim().toUpperCase();
  if (!publicFounderId) return null;
  const displayName = String(
    application?.displayName ||
    `${application?.firstName || ""} ${application?.lastName || ""}` ||
    payment?.customerName ||
    user?.displayName ||
    "",
  ).trim();
  const timestamp = String(application?.purchaseDate || payment?.completedAt || payment?.purchaseDate || new Date().toISOString());
  const founderLevel = String(application?.founderLevel || payment?.founderLevel || founderLevelForAmount(Number(application?.claimedAmount || payment?.amount || 0)));

  return {
    id: publicFounderId,
    userId: String(application?.userId || payment?.userId || user?.uid || "").trim(),
    publicFounderId,
    applicationId: String(application?.id || payment?.applicationId || "").trim(),
    paymentId: String(payment?.id || application?.paymentId || payment?.paymentId || "").trim(),
    firstName: String(application?.firstName || "").trim(),
    lastName: String(application?.lastName || "").trim(),
    displayName: displayName || "Founder",
    email: String(application?.email || payment?.customerEmail || user?.email || "").trim().toLowerCase(),
    phone: String(application?.phone || payment?.customerPhone || "").trim(),
    country: String(application?.country || payment?.customerCountry || "").trim(),
    city: String(application?.city || "").trim(),
    profilePhotoUrl: String(application?.profilePhotoUrl || "").trim(),
    founderLevel,
    status: "active",
    certificateStatus: "active",
    joinedAt: timestamp,
    issuedAt: timestamp,
    publicRecognitionConsent: true,
    badgeEnabled: true,
    certificateNumber: founderCertificateNumber(publicFounderId),
    certificateUrl: "",
    passCardUrl: "",
    qrVerificationToken: founderCertificateNumber(publicFounderId),
    verificationUrl: verificationUrl(founderCertificateNumber(publicFounderId)),
  };
}
