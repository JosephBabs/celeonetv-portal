process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const apiv2 = require("C:/Users/ADMIN/AppData/Roaming/npm/node_modules/firebase-tools/lib/apiv2.js");
const configstoreModule = require("C:/Users/ADMIN/AppData/Roaming/npm/node_modules/firebase-tools/lib/configstore.js");

const { configstore } = configstoreModule;

const projectId = process.env.FIREBASE_PROJECT_ID || "celeone-e5843";
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) args[key] = "true";
    else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  const fields = Object.fromEntries(Object.entries(value).map(([key, item]) => [key, encodeValue(item)]));
  return { mapValue: { fields } };
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

async function createDocument(token, collection, id, data) {
  const response = await fetch(`${baseUrl}/${encodeURIComponent(collection)}?documentId=${encodeURIComponent(id)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: encodeFields(data) }),
  });

  if (response.status === 409) return { created: false };
  const body = await response.text();
  if (!response.ok) throw new Error(`${collection}/${id}: ${response.status} ${body}`);
  return { created: true };
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function splitName(displayName) {
  const normalized = displayName.trim().replace(/\s+/g, " ");
  const [firstName = "", ...rest] = normalized.split(" ");
  return {
    displayName: normalized,
    firstName,
    lastName: rest.join(" "),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const displayName = String(args.name || "Test Founder").trim();
  const email = String(args.email || "founder.test@celeonetv.com").trim().toLowerCase();
  const founderLevel = String(args.level || "supporter").trim().toLowerCase();
  const amount = Number(args.amount || 5000);
  const currency = String(args.currency || "XOF").trim().toUpperCase();
  const publicRecognitionConsent = String(args.public || "true") !== "false";

  const { firstName, lastName } = splitName(displayName);
  const tokenConfig = configstore.get("tokens") || {};
  if (!tokenConfig.refresh_token) throw new Error("FIREBASE_REFRESH_TOKEN_MISSING");
  apiv2.setRefreshToken(tokenConfig.refresh_token);
  const token = await apiv2.getAccessToken();

  const now = new Date().toISOString();
  const stamp = Date.now();
  const publicFounderId = String(args.founderId || `COF-${new Date().getFullYear()}-${String(stamp).slice(-6)}`).toUpperCase();
  const reservationId = `reservation_${publicFounderId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const saleId = String(args.saleId || `sal_seed_${stamp}`);
  const paymentId = saleId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const applicationId = `activation_${paymentId}`;
  const founderId = `founder_${publicFounderId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const uid = String(args.uid || `seed_user_${slugify(displayName)}_${String(stamp).slice(-5)}`);

  const reservationDoc = {
    publicFounderId,
    firstName,
    lastName,
    displayName,
    status: "approved",
    activationStatus: "approved",
    source: "seed_script",
    paymentId,
    applicationId,
    founderId,
    userId: uid,
    email,
    createdAt: now,
    updatedAt: now,
  };

  const paymentDoc = {
    provider: "chariow",
    providerSaleId: saleId,
    providerTransactionId: `txn_${stamp}`,
    providerCustomerId: `cus_${stamp}`,
    providerProductId: process.env.CHARIOW_FOUNDERS_PRODUCT_ID || "prd_htdw78o8",
    providerStoreId: process.env.CHARIOW_STORE_ID || "",
    customerEmail: email,
    customerName: displayName,
    customerPhone: "",
    amount,
    currency,
    paymentStatus: "success",
    saleStatus: "completed",
    channel: "seed",
    paymentMethod: "Seed Payment",
    completedAt: now,
    verified: true,
    verifiedAt: now,
    verificationSource: "seed_script",
    founderId,
    founderReferenceId: publicFounderId,
    userId: uid,
    matchedUserId: uid,
    activationStatus: "active",
    founderLevel,
    rawPayloadRestricted: { seeded: true, saleId },
    createdAt: now,
    updatedAt: now,
  };

  const applicationDoc = {
    userId: uid,
    paymentId,
    firstName,
    lastName,
    displayName,
    email,
    phone: "",
    country: "BJ",
    city: "Cotonou",
    purchaseEmail: email,
    chariowOrderReference: saleId,
    publicFounderId,
    claimedAmount: amount,
    claimedCurrency: currency,
    purchaseDate: now,
    paymentMethod: "Seed Payment",
    receiptReference: `receipt_${stamp}`,
    receiptFileName: "",
    receiptUrl: "",
    profilePhotoUrl: "",
    publicRecognitionConsent,
    termsAccepted: true,
    founderLevel,
    status: "approved",
    verificationMethod: "seed_script",
    reviewedBy: "seed_script",
    reviewedAt: now,
    rejectionReason: "",
    founderId,
    createdAt: now,
    updatedAt: now,
  };

  const founderDoc = {
    userId: uid,
    publicFounderId,
    applicationId,
    paymentId,
    firstName,
    lastName,
    displayName,
    email,
    phone: "",
    country: "BJ",
    city: "Cotonou",
    profilePhotoUrl: "",
    founderLevel,
    status: "active",
    joinedAt: now,
    issuedAt: now,
    publicRecognitionConsent,
    badgeEnabled: true,
    certificateNumber: `CERT-${publicFounderId}`,
    certificateVersion: 0,
    certificateStatus: "active",
    qrVerificationToken: `seed-${stamp}`,
    credentialStatus: "generating",
    credentialGenerationError: "",
    verificationUrl: `https://celeonetv.com/founders/verify/${encodeURIComponent(publicFounderId)}`,
    createdAt: now,
    updatedAt: now,
  };

  const auditDoc = {
    action: "seed_founder_created",
    entityType: "founder",
    entityId: founderId,
    userId: uid,
    adminId: "seed_script",
    metadata: { publicFounderId, paymentId, applicationId },
    createdAt: now,
  };

  await createDocument(token, "founderReservations", reservationId, reservationDoc);
  await createDocument(token, "founderPayments", paymentId, paymentDoc);
  await createDocument(token, "founderApplications", applicationId, applicationDoc);
  await createDocument(token, "founders", founderId, founderDoc);
  await createDocument(token, "founderAuditLogs", `seed_${stamp}`, auditDoc);

  console.log(JSON.stringify({
    ok: true,
    projectId,
    founderId,
    publicFounderId,
    reservationId,
    paymentId,
    applicationId,
    userId: uid,
    email,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
