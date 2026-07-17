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

export function verificationUrl(publicFounderId: string) {
  const base = APP.founders.verificationBaseUrl.replace(/\/$/, "");
  return `${base}/${encodeURIComponent(publicFounderId)}`;
}

export function qrCodeUrl(publicFounderId: string) {
  return `https://quickchart.io/qr?size=220&margin=2&text=${encodeURIComponent(verificationUrl(publicFounderId))}`;
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

export async function getFounderByUserId(userId: string) {
  const snap = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.founders), where("userId", "==", userId), limit(1)),
  );
  const docSnap = snap.docs[0];
  return docSnap ? { id: docSnap.id, ...docSnap.data() } : null;
}

export async function getFounderByPublicId(publicFounderId: string) {
  const snap = await getDocs(
    query(collection(db, FOUNDER_COLLECTIONS.founders), where("publicFounderId", "==", publicFounderId), limit(1)),
  );
  const docSnap = snap.docs[0];
  return docSnap ? { id: docSnap.id, ...docSnap.data() } : null;
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
