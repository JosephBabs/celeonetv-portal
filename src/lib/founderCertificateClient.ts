import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { fitFounderName } from "./founderCertificateUtils";
import { founderCertificateNumber, founderLevelLabel, verificationUrl } from "./founders";

const TEMPLATE_URL = "/founders/founder-certificate-template.pdf";
const GABRIOLA_FONT_URL = "/fonts/Gabriola.ttf";

let cachedTemplateBytes: Uint8Array | null = null;
let cachedGabriolaFontBytes: Uint8Array | null = null;

function stringValue(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function certificateNumber(founder: Record<string, unknown>) {
  const publicFounderId = stringValue(founder.publicFounderId, "COF-XXXX-000000");
  return stringValue(founder.certificateNumber, founderCertificateNumber(publicFounderId));
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
  const verify = verificationUrl(certNo);

  centerText(page, "CERTIFICAT PASS-FONDATEUR", 470, 28, serif, gold);
  centerText(page, "Cele One Founder's Pass", 438, 14, sansBold, green);
  centerText(page, "decerne officiellement a", 392, 13, sans, soft);

  if (fit.lines.length === 1) {
    centerText(page, fit.lines[0], 314, Math.min(fit.fontSize + 18, 34), nameFont, dark);
  } else {
    centerText(page, fit.lines[0], 336, Math.min(fit.fontSize + 12, 28), nameFont, dark);
    centerText(page, fit.lines[1], 286, Math.min(fit.fontSize + 12, 28), nameFont, dark);
  }

  centerText(page, `pour son soutien en tant que ${founderLevel} FOUNDER`, 232, 14, sansBold, green);
  centerText(page, "au developpement et au lancement de Cele One.", 208, 12, sans, soft);

  page.drawText("Founder ID", { x: 306, y: 126, size: 9, font: sansBold, color: gold });
  page.drawText(publicFounderId, { x: 306, y: 106, size: 14, font: sansBold, color: green });

  page.drawText("Certificate Number", { x: 490, y: 126, size: 9, font: sansBold, color: gold });
  page.drawText(certNo, { x: 490, y: 106, size: 12, font: sansBold, color: dark });

  page.drawText("Issue Date", { x: 680, y: 126, size: 9, font: sansBold, color: gold });
  page.drawText(issued, { x: 680, y: 106, size: 11, font: sansBold, color: dark });

  page.drawText("Verification", { x: 306, y: 74, size: 9, font: sansBold, color: gold });
  page.drawText(verify, { x: 306, y: 56, size: 7, font: sans, color: soft });

  const pdfBytes = await pdf.save();
  return new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
}
