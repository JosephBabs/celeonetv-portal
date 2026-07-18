import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
// @ts-ignore
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";
import {
  addDocument,
  createDocument,
  getDocument,
  listDocuments,
  queryEquals,
  requireAdmin,
  updateDocument,
} from "./firebase-admin";
import { downloadStorageObject, uploadStorageObject } from "./storage";
import type { PortalEnv } from "./types";

type FounderRecord = Record<string, unknown> & {
  id: string;
  userId: string;
  publicFounderId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  founderLevel?: string;
  status?: string;
  joinedAt?: string;
  profilePhotoUrl?: string;
  paymentId?: string;
  certificateNumber?: string;
  certificateVersion?: number;
  qrVerificationToken?: string;
  certificateStatus?: string;
};

type FounderApplication = Record<string, unknown> & {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  paymentId?: string;
  publicFounderId?: string;
  founderId?: string;
  profilePhotoUrl?: string;
  publicRecognitionConsent?: boolean;
  claimedAmount?: number;
  claimedCurrency?: string;
};

type FounderPayment = Record<string, unknown> & {
  id: string;
  userId?: string;
  verified?: boolean;
  founderId?: string;
  founderLevel?: string;
  customerEmail?: string;
  amount?: number;
  currency?: string;
};

let wasmReady: Promise<void> | null = null;

const COLORS = {
  primary: "#2FA5A9",
  deep: "#123B40",
  gold: "#D7A84B",
  cream: "#FAF7EF",
  white: "#FFFFFF",
  dark: "#1B2D31",
};

function isoDate(value: unknown, fallback = new Date().toISOString()) {
  if (typeof value === "string" && value) return value;
  return fallback;
}

function displayName(founder: FounderRecord) {
  const full = String(founder.displayName || `${founder.firstName || ""} ${founder.lastName || ""}` || "").trim();
  return full || "FOUNDER";
}

function levelLabel(level?: string) {
  if (level === "legacy") return "LEGACY FOUNDER";
  if (level === "pioneer") return "PIONEER FOUNDER";
  if (level === "builder") return "BUILDER FOUNDER";
  return "SUPPORTER FOUNDER";
}

function joinedYear(joinedAt?: string) {
  return String(isoDate(joinedAt)).slice(0, 4);
}

function frenchDate(value?: string) {
  const date = new Date(isoDate(value));
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function verificationUrl(env: PortalEnv, founder: FounderRecord) {
  const base = (env.CELEONE_PUBLIC_URL || "https://portal.celeone.com").replace(/\/$/, "");
  return `${base}/founders/verify/${encodeURIComponent(String(founder.publicFounderId || ""))}`;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("") || "CO";
}

async function ensureResvg() {
  if (!wasmReady) wasmReady = initWasm(resvgWasm);
  await wasmReady;
}

async function qrSvg(url: string, size = 360) {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: size,
    color: { dark: COLORS.deep, light: COLORS.white },
    errorCorrectionLevel: "H",
  });
}

async function renderSvgToPng(svg: string, width: number) {
  await ensureResvg();
  const image = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render();
  return image.asPng();
}

function hashHex(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((digest) => Array.from(new Uint8Array(digest)).map((item) => item.toString(16).padStart(2, "0")).join(""));
}

function securityText() {
  return "CELE ONE VERIFIED FOUNDING SUPPORTER • OFFICIAL DIGITAL CERTIFICATE • ";
}

function statusLabel(status?: string) {
  if (status === "revoked") return "REVOKED";
  if (status === "suspended") return "TEMPORARILY SUSPENDED";
  if (status === "under_review") return "UNDER REVIEW";
  return "VERIFIED ACTIVE FOUNDER";
}

function certificateSvg(founder: FounderRecord, verificationSvg: string) {
  const name = displayName(founder).toUpperCase();
  const certificateNumber = String(founder.certificateNumber || "");
  const publicFounderId = String(founder.publicFounderId || "");
  const issuedAt = isoDate(founder.issuedAt);
  const status = String(founder.certificateStatus || founder.status || "active").toLowerCase();
  const revokedBanner = status === "revoked"
    ? `<g transform="rotate(-18 1754 1240)"><rect x="760" y="1110" width="1988" height="180" fill="#8B1E24" opacity="0.16"/><text x="1754" y="1232" text-anchor="middle" font-size="110" font-weight="800" fill="#8B1E24" letter-spacing="10">CERTIFICAT REVOQUE</text></g>`
    : "";
  const micro = securityText().repeat(10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="3508" height="2480" viewBox="0 0 3508 2480">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.cream}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <linearGradient id="teal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.deep}"/>
      <stop offset="100%" stop-color="${COLORS.primary}"/>
    </linearGradient>
    <pattern id="pattern" width="120" height="120" patternUnits="userSpaceOnUse">
      <path d="M0 60 H120 M60 0 V120" stroke="#E8E2D7" stroke-width="1" opacity="0.6"/>
      <circle cx="60" cy="60" r="18" fill="none" stroke="#E8E2D7" stroke-width="1" opacity="0.35"/>
    </pattern>
  </defs>
  <rect width="3508" height="2480" fill="url(#bg)"/>
  <rect x="78" y="78" width="3352" height="2324" rx="36" fill="none" stroke="${COLORS.gold}" stroke-width="12"/>
  <rect x="118" y="118" width="3272" height="2244" rx="24" fill="url(#pattern)" opacity="0.55"/>
  <rect x="174" y="174" width="3160" height="2132" rx="22" fill="none" stroke="${COLORS.deep}" stroke-width="2"/>
  <text x="1754" y="140" text-anchor="middle" font-size="26" fill="${COLORS.gold}" opacity="0.75">${micro}</text>
  <text x="1754" y="2372" text-anchor="middle" font-size="26" fill="${COLORS.gold}" opacity="0.75">${micro}</text>
  <circle cx="520" cy="420" r="182" fill="${COLORS.primary}" opacity="0.08"/>
  <circle cx="2990" cy="1980" r="240" fill="${COLORS.deep}" opacity="0.04"/>
  <text x="1754" y="274" text-anchor="middle" font-size="66" font-weight="800" fill="${COLORS.deep}" letter-spacing="9">CELE ONE</text>
  <text x="1754" y="392" text-anchor="middle" font-size="104" font-weight="800" fill="${COLORS.deep}">CERTIFICAT DE SOUTIEN FONDATEUR</text>
  <text x="1754" y="470" text-anchor="middle" font-size="44" fill="${COLORS.primary}" font-weight="700">Certificate of Founding Support</text>
  <text x="1754" y="710" text-anchor="middle" font-size="54" fill="${COLORS.dark}">Ce certificat est officiellement decerne a</text>
  <text x="1754" y="894" text-anchor="middle" font-size="132" font-weight="800" fill="${COLORS.deep}">${escapeXml(name)}</text>
  <text x="1754" y="1032" text-anchor="middle" font-size="50" fill="${COLORS.dark}">en reconnaissance de son engagement en tant que</text>
  <text x="1754" y="1160" text-anchor="middle" font-size="78" font-weight="800" fill="${COLORS.gold}">${escapeXml(levelLabel(String(founder.founderLevel || "")))}</text>
  <text x="1754" y="1260" text-anchor="middle" font-size="46" fill="${COLORS.dark}">au developpement et a la vision de Cele One.</text>
  ${revokedBanner}
  <rect x="346" y="1436" width="1600" height="566" rx="28" fill="#ffffff" opacity="0.92" stroke="#E5D9BE" stroke-width="2"/>
  <rect x="2054" y="1436" width="1108" height="566" rx="28" fill="#ffffff" opacity="0.92" stroke="#DCE7E8" stroke-width="2"/>
  <text x="430" y="1538" font-size="34" font-weight="800" fill="${COLORS.primary}">Founder ID</text>
  <text x="430" y="1608" font-size="56" font-weight="800" fill="${COLORS.deep}">${escapeXml(publicFounderId)}</text>
  <text x="430" y="1710" font-size="34" font-weight="800" fill="${COLORS.primary}">Certificate No</text>
  <text x="430" y="1780" font-size="54" font-weight="800" fill="${COLORS.deep}">${escapeXml(certificateNumber)}</text>
  <text x="430" y="1882" font-size="34" font-weight="800" fill="${COLORS.primary}">Membre fondateur depuis</text>
  <text x="430" y="1952" font-size="46" font-weight="700" fill="${COLORS.dark}">${escapeXml(frenchDate(founder.joinedAt as string))}</text>
  <text x="1210" y="1882" font-size="34" font-weight="800" fill="${COLORS.primary}">Date d'emission</text>
  <text x="1210" y="1952" font-size="46" font-weight="700" fill="${COLORS.dark}">${escapeXml(frenchDate(issuedAt))}</text>
  <g transform="translate(2190 1500) scale(0.82)">${verificationSvg.replace(/<\?xml[^>]*>/, "").replace(/<!DOCTYPE[^>]*>/, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "")}</g>
  <text x="2540" y="1914" text-anchor="middle" font-size="32" font-weight="800" fill="${COLORS.primary}">Verification URL</text>
  <text x="2540" y="1970" text-anchor="middle" font-size="28" fill="${COLORS.dark}">${escapeXml(String(founder.verificationUrl || ""))}</text>
  <circle cx="2980" cy="460" r="186" fill="url(#teal)" opacity="0.95"/>
  <circle cx="2980" cy="460" r="148" fill="none" stroke="${COLORS.gold}" stroke-width="10"/>
  <text x="2980" y="410" text-anchor="middle" font-size="34" font-weight="800" fill="${COLORS.white}">CELE ONE</text>
  <text x="2980" y="466" text-anchor="middle" font-size="30" font-weight="700" fill="${COLORS.gold}">OFFICIAL VERIFIED</text>
  <text x="2980" y="520" text-anchor="middle" font-size="32" font-weight="700" fill="${COLORS.white}">FOUNDER</text>
  <text x="2980" y="576" text-anchor="middle" font-size="28" font-weight="700" fill="${COLORS.gold}">${escapeXml(joinedYear(founder.joinedAt as string))}</text>
  <line x1="478" y1="2174" x2="1220" y2="2174" stroke="${COLORS.dark}" stroke-width="2"/>
  <line x1="1520" y1="2174" x2="2260" y2="2174" stroke="${COLORS.dark}" stroke-width="2"/>
  <text x="478" y="2226" font-size="32" font-weight="700" fill="${COLORS.dark}">Founder &amp; Project Lead</text>
  <text x="478" y="2274" font-size="28" fill="${COLORS.dark}">Cele One</text>
  <text x="1520" y="2226" font-size="32" font-weight="700" fill="${COLORS.dark}">Program Administrator</text>
  <text x="1520" y="2274" font-size="28" fill="${COLORS.dark}">Cele One Founder&apos;s Pass</text>
  <text x="260" y="2350" font-size="28" fill="${COLORS.dark}" opacity="0.82">Ce certificat confirme l'enregistrement de son detenteur en tant que soutien fondateur verifie de Cele One. Il ne constitue ni une action, ni un titre financier, ni une garantie de rendement.</text>
</svg>`;
}

function cardSvg(founder: FounderRecord, verificationSvg: string, side: "front" | "back") {
  const name = displayName(founder);
  const primary = COLORS.primary;
  const deep = COLORS.deep;
  const gold = COLORS.gold;
  const status = statusLabel(String(founder.certificateStatus || founder.status || "active").toLowerCase());
  const photo = String(founder.profilePhotoUrl || "");
  const avatarBlock = photo
    ? `<image href="${escapeXml(photo)}" x="1088" y="166" width="314" height="314" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`
    : `<text x="1246" y="366" text-anchor="middle" font-size="132" font-weight="800" fill="${COLORS.white}">${escapeXml(initials(name))}</text>`;
  if (side === "front") {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1008" viewBox="0 0 1600 1008">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0C2E33"/>
      <stop offset="100%" stop-color="${primary}"/>
    </linearGradient>
    <clipPath id="avatarClip"><circle cx="1246" cy="323" r="142"/></clipPath>
  </defs>
  <rect width="1600" height="1008" rx="72" fill="url(#cardBg)"/>
  <rect x="34" y="34" width="1532" height="940" rx="50" fill="none" stroke="${gold}" stroke-width="4"/>
  <circle cx="260" cy="826" r="260" fill="#FFFFFF" opacity="0.06"/>
  <circle cx="1380" cy="120" r="200" fill="#FFFFFF" opacity="0.08"/>
  <text x="120" y="158" font-size="48" font-weight="800" fill="#FFFFFF" letter-spacing="6">CELE ONE</text>
  <text x="120" y="234" font-size="72" font-weight="800" fill="#FFFFFF">FOUNDER'S PASS</text>
  <text x="120" y="404" font-size="88" font-weight="800" fill="#FFFFFF">${escapeXml(name.toUpperCase())}</text>
  <text x="120" y="500" font-size="48" font-weight="700" fill="${gold}">${escapeXml(levelLabel(String(founder.founderLevel || "")))}</text>
  <text x="120" y="618" font-size="40" fill="#DDEDEF">ID ${escapeXml(String(founder.publicFounderId || ""))}</text>
  <text x="120" y="698" font-size="34" fill="#DDEDEF">MEMBER SINCE ${escapeXml(joinedYear(founder.joinedAt as string))}</text>
  <rect x="120" y="782" width="560" height="102" rx="24" fill="#FFFFFF" opacity="0.12"/>
  <text x="160" y="846" font-size="34" font-weight="800" fill="#FFFFFF">${escapeXml(status)}</text>
  <circle cx="1246" cy="323" r="146" fill="none" stroke="${gold}" stroke-width="8"/>
  <circle cx="1246" cy="323" r="142" fill="#FFFFFF" opacity="${photo ? "1" : "0.12"}"/>
  ${avatarBlock}
  <circle cx="1360" cy="792" r="118" fill="#FFFFFF" opacity="0.16"/>
  <text x="1360" y="775" text-anchor="middle" font-size="28" font-weight="800" fill="#FFFFFF">OFFICIAL</text>
  <text x="1360" y="828" text-anchor="middle" font-size="28" font-weight="800" fill="${gold}">VERIFIED</text>
  <text x="1360" y="878" text-anchor="middle" font-size="26" font-weight="700" fill="#FFFFFF">${escapeXml(joinedYear(founder.joinedAt as string))}</text>
</svg>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1008" viewBox="0 0 1600 1008">
  <defs>
    <linearGradient id="cardBgBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${deep}"/>
      <stop offset="100%" stop-color="#0F5560"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1008" rx="72" fill="url(#cardBgBack)"/>
  <rect x="34" y="34" width="1532" height="940" rx="50" fill="none" stroke="${gold}" stroke-width="4"/>
  <text x="120" y="148" font-size="46" font-weight="800" fill="#FFFFFF">VERIFY THIS PASS</text>
  <g transform="translate(118 196) scale(0.92)">${verificationSvg.replace(/<\?xml[^>]*>/, "").replace(/<!DOCTYPE[^>]*>/, "").replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "")}</g>
  <text x="800" y="316" font-size="32" font-weight="700" fill="${gold}">Verification URL</text>
  <text x="800" y="382" font-size="36" fill="#FFFFFF">${escapeXml(String(founder.verificationUrl || ""))}</text>
  <text x="800" y="498" font-size="32" font-weight="700" fill="${gold}">Certificate</text>
  <text x="800" y="560" font-size="44" font-weight="800" fill="#FFFFFF">${escapeXml(String(founder.certificateNumber || ""))}</text>
  <text x="800" y="658" font-size="32" font-weight="700" fill="${gold}">Status</text>
  <text x="800" y="720" font-size="42" font-weight="800" fill="#FFFFFF">${escapeXml(status)}</text>
  <text x="800" y="806" font-size="32" font-weight="700" fill="${gold}">Program year</text>
  <text x="800" y="864" font-size="38" font-weight="700" fill="#FFFFFF">${escapeXml(joinedYear(founder.joinedAt as string))}</text>
  <text x="120" y="934" font-size="26" fill="#DDEDEF">Cele One Founder&apos;s Pass • celeonetv.com • support@celeonetv.com</text>
</svg>`;
}

function badgeSvg(founder: FounderRecord) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720">
  <defs>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${COLORS.deep}"/>
      <stop offset="100%" stop-color="${COLORS.primary}"/>
    </linearGradient>
  </defs>
  <circle cx="360" cy="360" r="328" fill="url(#badge)"/>
  <circle cx="360" cy="360" r="282" fill="none" stroke="${COLORS.gold}" stroke-width="18"/>
  <text x="360" y="214" text-anchor="middle" font-size="46" font-weight="800" fill="${COLORS.white}">CELE ONE</text>
  <text x="360" y="328" text-anchor="middle" font-size="54" font-weight="800" fill="${COLORS.gold}">${escapeXml(levelLabel(String(founder.founderLevel || "")).replace(" FOUNDER", ""))}</text>
  <text x="360" y="394" text-anchor="middle" font-size="52" font-weight="800" fill="${COLORS.white}">FOUNDER</text>
  <text x="360" y="478" text-anchor="middle" font-size="42" font-weight="700" fill="${COLORS.white}">${escapeXml(joinedYear(founder.joinedAt as string))}</text>
  <text x="360" y="566" text-anchor="middle" font-size="32" font-weight="800" fill="${COLORS.gold}">VERIFIED</text>
</svg>`;
}

async function pdfFromPng(title: string, width: number, height: number, pngBytes: Uint8Array, opts: { landscape?: boolean; secondImage?: Uint8Array } = {}) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor("Cele One");
  doc.setSubject("Founder's Pass Credential");
  doc.setKeywords(["Cele One", "Founder", "Certificate", "Founder Card"]);
  const page = doc.addPage([width, height]);
  const image = await doc.embedPng(pngBytes);
  page.drawImage(image, { x: 0, y: 0, width, height });
  if (opts.secondImage) {
    const secondPage = doc.addPage([width, height]);
    const second = await doc.embedPng(opts.secondImage);
    secondPage.drawImage(second, { x: 0, y: 0, width, height });
  }
  return doc.save();
}

function escapeXml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function history(env: PortalEnv, founderId: string, credentialType: string, action: string, performedBy: string, details: Record<string, unknown> = {}) {
  await addDocument(env, "founderCredentialHistory", {
    founderId,
    credentialType,
    action,
    performedBy,
    createdAt: new Date().toISOString(),
    ...details,
  });
}

function maxFounderSuffix(rows: Array<Record<string, unknown>>) {
  return rows.reduce((highest, row) => {
    const publicId = String((row as { publicFounderId?: string }).publicFounderId || "");
    const suffix = Number(publicId.split("-").pop() || 0);
    return Number.isFinite(suffix) && suffix > highest ? suffix : highest;
  }, 0);
}

export async function nextPublicFounderId(env: PortalEnv) {
  const [founders, reservations] = await Promise.all([
    listDocuments(env, "founders", 500),
    listDocuments(env, "founderReservations", 500).catch(() => ({ rows: [] as Array<Record<string, unknown>> })),
  ]);
  const max = Math.max(maxFounderSuffix(founders.rows), maxFounderSuffix(reservations.rows));
  return `COF-${new Date().getFullYear()}-${String(max + 1).padStart(6, "0")}`;
}

function certificateNumber(publicFounderId: string) {
  return `CERT-${publicFounderId}`;
}

async function buildArtifacts(env: PortalEnv, founder: FounderRecord) {
  const verification = verificationUrl(env, founder);
  const qr = await qrSvg(verification, 360);
  const certificate = certificateSvg({ ...founder, verificationUrl: verification }, qr);
  const front = cardSvg({ ...founder, verificationUrl: verification }, qr, "front");
  const back = cardSvg({ ...founder, verificationUrl: verification }, qr, "back");
  const badge = badgeSvg(founder);
  const certificatePng = await renderSvgToPng(certificate, 3508);
  const frontPng = await renderSvgToPng(front, 1600);
  const backPng = await renderSvgToPng(back, 1600);
  const badgePng = await renderSvgToPng(badge, 720);
  const certificatePdf = await pdfFromPng("Cele One Founder Certificate", 1190.55, 841.89, certificatePng);
  const cardPdf = await pdfFromPng("Cele One Founder Card", 242.65, 153.01, frontPng, { secondImage: backPng });
  return {
    verificationUrl: verification,
    qrSvg: qr,
    certificateSvg: certificate,
    certificatePng,
    certificatePdf,
    cardFrontSvg: front,
    cardFrontPng: frontPng,
    cardBackSvg: back,
    cardBackPng: backPng,
    cardPdf,
    badgeSvg: badge,
    badgePng,
  };
}

async function uploadArtifacts(env: PortalEnv, founder: FounderRecord, artifacts: Awaited<ReturnType<typeof buildArtifacts>>, version: number) {
  const founderId = founder.id;
  const certificateBase = `founders/${founderId}/certificate/v${version}`;
  const cardBase = `founders/${founderId}/card/v${version}`;
  const badgeBase = `founders/${founderId}/badge/v${version}`;
  const qrBase = `founders/${founderId}/qr/v${version}`;
  const uploads = await Promise.all([
    uploadStorageObject(env, `${certificateBase}/certificate-preview.png`, artifacts.certificatePng, "image/png"),
    uploadStorageObject(env, `${certificateBase}/certificate.pdf`, artifacts.certificatePdf, "application/pdf"),
    uploadStorageObject(env, `${certificateBase}/certificate.svg`, new TextEncoder().encode(artifacts.certificateSvg), "image/svg+xml"),
    uploadStorageObject(env, `${cardBase}/front.png`, artifacts.cardFrontPng, "image/png"),
    uploadStorageObject(env, `${cardBase}/back.png`, artifacts.cardBackPng, "image/png"),
    uploadStorageObject(env, `${cardBase}/founder-card.pdf`, artifacts.cardPdf, "application/pdf"),
    uploadStorageObject(env, `${badgeBase}/badge.svg`, new TextEncoder().encode(artifacts.badgeSvg), "image/svg+xml"),
    uploadStorageObject(env, `${badgeBase}/badge.png`, artifacts.badgePng, "image/png"),
    uploadStorageObject(env, `${qrBase}/code.svg`, new TextEncoder().encode(artifacts.qrSvg), "image/svg+xml"),
  ]);
  return {
    certificatePreviewPath: uploads[0].path,
    certificatePdfPath: uploads[1].path,
    certificateSvgPath: uploads[2].path,
    cardFrontPath: uploads[3].path,
    cardBackPath: uploads[4].path,
    cardPdfPath: uploads[5].path,
    badgeSvgPath: uploads[6].path,
    badgePngPath: uploads[7].path,
    qrCodePath: uploads[8].path,
  };
}

async function persistCredentialState(env: PortalEnv, founder: FounderRecord, version: number, paths: Awaited<ReturnType<typeof uploadArtifacts>>, metadata: { hash: string; performedBy: string; status?: string }) {
  const now = new Date().toISOString();
  await updateDocument(env, `founders/${founder.id}`, {
    certificateVersion: version,
    certificateNumber: founder.certificateNumber || certificateNumber(String(founder.publicFounderId || "")),
    certificateHash: metadata.hash,
    issuedAt: founder.issuedAt || founder.joinedAt || now,
    generatedAt: now,
    certificateGeneratedAt: now,
    certificateGeneratedBy: metadata.performedBy,
    certificateStatus: metadata.status || founder.certificateStatus || founder.status || "active",
    certificatePreviewPath: paths.certificatePreviewPath,
    certificateStoragePath: paths.certificatePdfPath,
    certificateSvgPath: paths.certificateSvgPath,
    cardFrontPath: paths.cardFrontPath,
    cardBackPath: paths.cardBackPath,
    cardPdfPath: paths.cardPdfPath,
    cardGeneratedAt: now,
    badgeSvgPath: paths.badgeSvgPath,
    badgePngPath: paths.badgePngPath,
    badgeGeneratedAt: now,
    qrCodePath: paths.qrCodePath,
    qrCodeGeneratedAt: now,
    credentialStatus: "ready",
    credentialGenerationError: "",
    credentialUpdatedAt: now,
    verificationUrl: String(founder.verificationUrl || ""),
    passCardUrl: paths.cardFrontPath,
    certificateUrl: paths.certificatePdfPath,
  });
}

export async function generateFounderBadge(env: PortalEnv, founderId: string, performedBy: string) {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  const artifacts = await buildArtifacts(env, founder);
  const version = Number(founder.certificateVersion || 0) || 1;
  const paths = await uploadArtifacts(env, founder, artifacts, version);
  const hash = await hashHex(`${founderId}:${founder.certificateNumber || ""}:${version}:badge`);
  await persistCredentialState(env, founder, version, paths, { hash, performedBy });
  await history(env, founderId, "badge", "generated", performedBy, { version, newPath: paths.badgePngPath });
  return { founderId, version, paths };
}

export async function generateCertificate(env: PortalEnv, founderId: string, performedBy: string) {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  if (String(founder.status || "").toLowerCase() !== "active") throw new Error("FOUNDER_NOT_ACTIVE");
  if (!founder.publicFounderId) throw new Error("FOUNDER_ID_MISSING");
  const version = Number(founder.certificateVersion || 0) + 1 || 1;
  const normalized = {
    ...founder,
    certificateNumber: String(founder.certificateNumber || certificateNumber(String(founder.publicFounderId))),
    certificateVersion: version,
    issuedAt: String(founder.issuedAt || founder.joinedAt || new Date().toISOString()),
    verificationUrl: verificationUrl(env, founder),
    certificateStatus: String(founder.certificateStatus || founder.status || "active"),
  } as FounderRecord;
  const artifacts = await buildArtifacts(env, normalized);
  const paths = await uploadArtifacts(env, normalized, artifacts, version);
  const hash = await hashHex([
    founderId,
    normalized.certificateNumber,
    normalized.founderLevel,
    normalized.joinedAt,
    normalized.issuedAt,
    version,
  ].join("|"));
  await persistCredentialState(env, normalized, version, paths, { hash, performedBy });
  await history(env, founderId, "certificate", version === 1 ? "generated" : "regenerated", performedBy, {
    version,
    newPath: paths.certificatePdfPath,
  });
  await history(env, founderId, "card", version === 1 ? "generated" : "regenerated", performedBy, {
    version,
    newPath: paths.cardPdfPath,
  });
  await addDocument(env, "notifications", {
    userId: founder.userId,
    title: "Founder's Pass",
    body: "Vos identifiants fondateurs sont disponibles dans votre tableau de bord.",
    type: "founder_credentials_ready",
    link: "/founders/dashboard",
    read: false,
    createdAt: new Date().toISOString(),
  });
  return { founderId, version, paths };
}

export async function generateFounderCard(env: PortalEnv, founderId: string, performedBy: string) {
  return generateCertificate(env, founderId, performedBy);
}

export async function generateQrCode(env: PortalEnv, founderId: string, performedBy: string) {
  return generateCertificate(env, founderId, performedBy);
}

export async function regenerateCredentials(env: PortalEnv, founderId: string, performedBy: string) {
  return generateCertificate(env, founderId, performedBy);
}

export async function revokeCertificate(env: PortalEnv, founderId: string, performedBy: string, note = "") {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  await updateDocument(env, `founders/${founderId}`, {
    certificateStatus: "revoked",
    status: "revoked",
    credentialUpdatedAt: new Date().toISOString(),
    internalCredentialNote: note,
  });
  await history(env, founderId, "certificate", "revoked", performedBy, { reason: note, version: founder.certificateVersion || 1 });
}

export async function restoreCertificate(env: PortalEnv, founderId: string, performedBy: string, note = "") {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  await updateDocument(env, `founders/${founderId}`, {
    certificateStatus: "active",
    status: "active",
    credentialUpdatedAt: new Date().toISOString(),
    internalCredentialNote: note,
  });
  await history(env, founderId, "certificate", "restored", performedBy, { reason: note, version: founder.certificateVersion || 1 });
}

export async function founderCredentialBundle(env: PortalEnv, founderId: string) {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  const historyRows = await queryEquals(env, "founderCredentialHistory", "founderId", founderId, 50);
  return {
    founder,
    history: historyRows,
  };
}

export async function credentialAsset(env: PortalEnv, founderId: string, kind: string) {
  const founder = await getDocument(env, `founders/${founderId}`) as FounderRecord | null;
  if (!founder) throw new Error("FOUNDER_NOT_FOUND");
  const map: Record<string, string> = {
    certificatePreview: String(founder.certificatePreviewPath || ""),
    certificatePdf: String(founder.certificateStoragePath || ""),
    certificateSvg: String(founder.certificateSvgPath || ""),
    cardFront: String(founder.cardFrontPath || ""),
    cardBack: String(founder.cardBackPath || ""),
    cardPdf: String(founder.cardPdfPath || ""),
    badgePng: String(founder.badgePngPath || ""),
    badgeSvg: String(founder.badgeSvgPath || ""),
    qrCode: String(founder.qrCodePath || ""),
  };
  const path = map[kind];
  if (!path) throw new Error("ASSET_NOT_FOUND");
  return downloadStorageObject(env, path);
}

export async function approveFounderApplicationTrusted(env: PortalEnv, applicationId: string, adminId: string) {
  const application = await getDocument(env, `founderApplications/${applicationId}`) as FounderApplication | null;
  if (!application) throw new Error("APPLICATION_NOT_FOUND");
  if (String(application.status || "") === "approved" && application.founderId) {
    await generateCertificate(env, String(application.founderId), adminId);
    return { founderId: String(application.founderId), publicFounderId: String(application.publicFounderId || "") };
  }
  const payment = await getDocument(env, `founderPayments/${String(application.paymentId || "")}`) as FounderPayment | null;
  if (!payment?.verified) throw new Error("PAYMENT_NOT_VERIFIED");
  const existingFounders = await queryEquals(env, "founders", "applicationId", applicationId, 1);
  if (existingFounders.length) {
    await generateCertificate(env, existingFounders[0].id, adminId);
    return { founderId: existingFounders[0].id, publicFounderId: String((existingFounders[0] as { publicFounderId?: string }).publicFounderId || "") };
  }
  const reservedPublicFounderId = String(application.publicFounderId || "").trim().toUpperCase();
  const publicFounderId = reservedPublicFounderId || await nextPublicFounderId(env);
  const founderId = `founder_${publicFounderId.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  const now = new Date().toISOString();
  const founderDoc = {
    userId: application.userId,
    publicFounderId,
    applicationId,
    paymentId: String(application.paymentId || ""),
    firstName: String(application.firstName || "").trim(),
    lastName: String(application.lastName || "").trim(),
    displayName: String(application.displayName || `${application.firstName || ""} ${application.lastName || ""}`).trim(),
    email: String(application.email || "").trim().toLowerCase(),
    phone: String(application.phone || ""),
    country: String(application.country || ""),
    city: String(application.city || ""),
    profilePhotoUrl: String(application.profilePhotoUrl || ""),
    founderLevel: String(payment.founderLevel || application.founderLevel || "supporter"),
    status: "active",
    joinedAt: now,
    issuedAt: now,
    publicRecognitionConsent: Boolean(application.publicRecognitionConsent),
    badgeEnabled: true,
    certificateNumber: certificateNumber(publicFounderId),
    certificateVersion: 0,
    certificateStatus: "active",
    qrVerificationToken: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    credentialStatus: "generating",
    credentialGenerationError: "",
    verificationUrl: verificationUrl(env, { id: founderId, publicFounderId } as FounderRecord),
    createdAt: now,
    updatedAt: now,
  };
  await createDocument(env, "founders", founderId, founderDoc);
  await updateDocument(env, `founderApplications/${applicationId}`, {
    status: "approved",
    reviewedBy: adminId,
    reviewedAt: now,
    updatedAt: now,
    founderId,
    publicFounderId,
  });
  await updateDocument(env, `founderPayments/${payment.id}`, {
    founderId,
    userId: application.userId,
    founderReferenceId: publicFounderId,
    activationStatus: "active",
    updatedAt: now,
  });
  if (reservedPublicFounderId) {
    const reservations = await queryEquals(env, "founderReservations", "publicFounderId", reservedPublicFounderId, 1).catch(() => []);
    if (reservations[0]?.id) {
      await updateDocument(env, `founderReservations/${reservations[0].id}`, {
        status: "approved",
        founderId,
        paymentId: payment.id,
        applicationId,
        userId: application.userId,
        email: String(application.email || ""),
        updatedAt: now,
      }).catch(() => null);
    }
  }
  await addDocument(env, "founderAuditLogs", {
    action: "application_approved",
    entityType: "founderApplication",
    entityId: applicationId,
    userId: application.userId,
    adminId,
    metadata: { founderId, publicFounderId, paymentId: payment.id },
    createdAt: now,
  });
  await generateCertificate(env, founderId, adminId);
  return { founderId, publicFounderId };
}

export async function requireAdminForFounderAction(request: Request, env: PortalEnv) {
  return requireAdmin(request, env);
}
