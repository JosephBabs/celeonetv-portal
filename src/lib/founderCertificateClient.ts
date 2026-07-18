import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { fitFounderName } from "./founderCertificateUtils";
import { founderLevelLabel, verificationUrl } from "./founders";

const TEMPLATE_URL = "/founders/founder-certificate-template.pdf";
const GABRIOLA_FONT_URL = "/fonts/Gabriola.ttf";
const LOGO_URL = "/favicon.png";

let cachedTemplateBytes: Uint8Array | null = null;
let cachedGabriolaFontBytes: Uint8Array | null = null;
let cachedLogoBytes: Uint8Array | null = null;

function stringValue(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function certificateNumber(founder: Record<string, unknown>) {
  const publicFounderId = stringValue(founder.publicFounderId, "COF-XXXX-000000");
  return stringValue(founder.certificateNumber, `CERT-${publicFounderId}`);
}

function issueDate(founder: Record<string, unknown>) {
  const value = stringValue(founder.issuedAt || founder.joinedAt, new Date().toISOString());
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(date);
}

function founderName(founder: Record<string, unknown>) {
  return stringValue(founder.displayName || `${founder.firstName || ""} ${founder.lastName || ""}`, "FOUNDER");
}

function centerText(page: PDFPage, text: string, y: number, size: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, color: ReturnType<typeof rgb>) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - width) / 2, y, size, font, color });
}

async function loadBytes(url: string, cache: Uint8Array | null) {
  if (cache) return cache;
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Unable to load asset: ${url}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function loadTemplateBytes() {
  cachedTemplateBytes = await loadBytes(TEMPLATE_URL, cachedTemplateBytes);
  return cachedTemplateBytes;
}

async function loadGabriolaFontBytes() {
  cachedGabriolaFontBytes = await loadBytes(GABRIOLA_FONT_URL, cachedGabriolaFontBytes);
  return cachedGabriolaFontBytes;
}

async function loadLogoBytes() {
  cachedLogoBytes = await loadBytes(LOGO_URL, cachedLogoBytes);
  return cachedLogoBytes;
}

function drawLogoInBox(page: PDFPage, image: Awaited<ReturnType<PDFDocument["embedPng"]>>) {
  const boxX = 114;
  const boxY = 118;
  const boxWidth = 130;
  const boxHeight = 146;
  const maxWidth = 92;
  const maxHeight = 92;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  const x = boxX + (boxWidth - width) / 2;
  const y = boxY + (boxHeight - height) / 2 + 10;
  page.drawImage(image, { x, y, width, height });
}

export async function buildFounderCertificatePdf(founder: Record<string, unknown>) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const templateDoc = await PDFDocument.load(await loadTemplateBytes());
  const [templatePage] = await pdf.copyPages(templateDoc, [0]);
  const page = pdf.addPage(templatePage);

  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const nameFont = await (async () => {
    try {
      return await pdf.embedFont(await loadGabriolaFontBytes(), { subset: true });
    } catch {
      return pdf.embedFont(StandardFonts.TimesRomanBoldItalic);
    }
  })();
  const logo = await pdf.embedPng(await loadLogoBytes());

  const green = rgb(0.0, 0.37, 0.30);
  const dark = rgb(0.14, 0.18, 0.18);
  const gold = rgb(0.84, 0.62, 0.10);
  const soft = rgb(0.42, 0.48, 0.49);

  const name = founderName(founder);
  const fit = fitFounderName(name);
  const publicFounderId = stringValue(founder.publicFounderId, "-");
  const founderLevel = founderLevelLabel(stringValue(founder.founderLevel)).toUpperCase();
  const certNo = certificateNumber(founder);
  const issued = issueDate(founder);
  const verify = verificationUrl(publicFounderId);

  centerText(page, "CERTIFICAT PASS-FONDATEUR", 742, 34, serif, gold);
  centerText(page, "Cele One Founder's Pass", 706, 18, sansBold, green);
  centerText(page, "decerne officiellement a", 642, 16, sans, soft);

  if (fit.lines.length === 1) {
    centerText(page, fit.lines[0], 548, fit.fontSize + 28, nameFont, dark);
  } else {
    centerText(page, fit.lines[0], 582, fit.fontSize + 22, nameFont, dark);
    centerText(page, fit.lines[1], 522, fit.fontSize + 22, nameFont, dark);
  }

  centerText(page, `pour son soutien en tant que ${founderLevel} FOUNDER`, 470, 18, sansBold, green);
  centerText(page, "au developpement et au lancement de Cele One.", 438, 15, sans, soft);

  page.drawText(publicFounderId, { x: 270, y: 248, size: 22, font: sansBold, color: green });
  page.drawText("Founder ID", { x: 270, y: 278, size: 11, font: sansBold, color: gold });

  page.drawText("Certificate Number", { x: 588, y: 120, size: 11, font: sansBold, color: gold });
  page.drawText(certNo, { x: 588, y: 98, size: 16, font: sansBold, color: dark });

  page.drawText("Issue Date", { x: 886, y: 120, size: 11, font: sansBold, color: gold });
  page.drawText(issued, { x: 886, y: 98, size: 14, font: sans, color: dark });

  page.drawText("Verification", { x: 100, y: 58, size: 10, font: sansBold, color: gold });
  page.drawText(verify, { x: 100, y: 42, size: 9, font: sans, color: soft });

  drawLogoInBox(page, logo);

  const pdfBytes = await pdf.save();
  return new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
}
