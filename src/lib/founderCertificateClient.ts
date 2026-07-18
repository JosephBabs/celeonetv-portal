import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { fitFounderName } from "./founderCertificateUtils";
import { founderLevelLabel, verificationUrl } from "./founders";

const PAGE_WIDTH = 1536;
const PAGE_HEIGHT = 1024;
const GABRIOLA_FONT_URL = "/fonts/Gabriola.ttf";

let cachedGabriolaFontBytes: Uint8Array | null = null;

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

function centerText(page: PDFDocument["addPage"] extends (...args: never[]) => infer T ? T : never, text: string, y: number, size: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, color: ReturnType<typeof rgb>) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_WIDTH - width) / 2, y, size, font, color });
}

function drawRibbon(page: PDFDocument["addPage"] extends (...args: never[]) => infer T ? T : never) {
  const green = rgb(0.0, 0.39, 0.31);
  const dark = rgb(0.0, 0.24, 0.20);
  const gold = rgb(0.88, 0.66, 0.12);
  const white = rgb(0.96, 0.96, 0.95);

  page.drawRectangle({ x: -40, y: 760, width: 300, height: 120, color: gold, rotate: degrees(62) });
  page.drawRectangle({ x: -10, y: 776, width: 290, height: 100, color: green, rotate: degrees(62) });
  page.drawRectangle({ x: 84, y: 804, width: 370, height: 130, color: dark, rotate: degrees(62) });
  page.drawRectangle({ x: 150, y: 810, width: 250, height: 90, color: green, rotate: degrees(62) });

  page.drawRectangle({ x: 1280, y: -32, width: 300, height: 120, color: gold, rotate: degrees(62) });
  page.drawRectangle({ x: 1262, y: -14, width: 290, height: 100, color: green, rotate: degrees(62) });
  page.drawRectangle({ x: 1340, y: -8, width: 340, height: 120, color: dark, rotate: degrees(62) });
  page.drawRectangle({ x: 1386, y: 12, width: 220, height: 82, color: green, rotate: degrees(62) });

  page.drawRectangle({ x: 105, y: 0, width: 110, height: PAGE_HEIGHT, color: white, opacity: 0.72, rotate: degrees(-18) });
  page.drawRectangle({ x: 1290, y: -50, width: 110, height: PAGE_HEIGHT + 120, color: white, opacity: 0.72, rotate: degrees(-18) });
}

function drawBorder(page: PDFDocument["addPage"] extends (...args: never[]) => infer T ? T : never) {
  const gold = rgb(0.84, 0.62, 0.10);
  page.drawRectangle({ x: 18, y: 18, width: PAGE_WIDTH - 36, height: PAGE_HEIGHT - 36, borderColor: gold, borderWidth: 2 });
  page.drawLine({ start: { x: 46, y: PAGE_HEIGHT - 28 }, end: { x: PAGE_WIDTH - 166, y: PAGE_HEIGHT - 28 }, thickness: 1.6, color: gold });
  page.drawLine({ start: { x: 46, y: PAGE_HEIGHT - 38 }, end: { x: PAGE_WIDTH - 178, y: PAGE_HEIGHT - 38 }, thickness: 1, color: gold });
  page.drawLine({ start: { x: 24, y: 26 }, end: { x: PAGE_WIDTH - 24, y: 26 }, thickness: 1.4, color: gold });
}

async function loadGabriolaFontBytes() {
  if (cachedGabriolaFontBytes) return cachedGabriolaFontBytes;
  const response = await fetch(GABRIOLA_FONT_URL, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Unable to load certificate font: ${response.status}`);
  }
  cachedGabriolaFontBytes = new Uint8Array(await response.arrayBuffer());
  return cachedGabriolaFontBytes;
}

export async function buildFounderCertificatePdf(founder: Record<string, unknown>) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
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
  const dark = rgb(0.16, 0.18, 0.18);
  const gold = rgb(0.84, 0.62, 0.10);
  const soft = rgb(0.55, 0.58, 0.57);
  const pale = rgb(0.92, 0.94, 0.93);

  page.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: rgb(0.99, 0.99, 0.98) });

  for (let i = 0; i < 72; i += 1) {
    const y = 44 + i * 13;
    page.drawLine({
      start: { x: 48, y },
      end: { x: PAGE_WIDTH - 48, y: y + 10 },
      thickness: 0.22,
      color: rgb(0.95, 0.95, 0.94),
      opacity: 0.6,
    });
  }

  drawRibbon(page);
  drawBorder(page);

  page.drawCircle({ x: PAGE_WIDTH / 2, y: 500, size: 210, borderColor: pale, borderWidth: 6, opacity: 0.65 });
  page.drawCircle({ x: PAGE_WIDTH / 2, y: 500, size: 186, borderColor: pale, borderWidth: 4, opacity: 0.4 });

  const name = founderName(founder);
  const fit = fitFounderName(name);
  const publicFounderId = stringValue(founder.publicFounderId, "-");
  const founderLevel = founderLevelLabel(stringValue(founder.founderLevel)).toUpperCase();
  const certNo = certificateNumber(founder);
  const issued = issueDate(founder);
  const verify = verificationUrl(publicFounderId);

  centerText(page, "CERTIFICAT DE FONDATEUR", 720, 36, serif, gold);
  centerText(page, "Cele One Founder’s Pass", 686, 18, sansBold, green);
  centerText(page, "decerne officiellement a", 628, 17, sans, soft);

  if (fit.lines.length === 1) {
    centerText(page, fit.lines[0], 544, fit.fontSize + 30, nameFont, dark);
  } else {
    centerText(page, fit.lines[0], 572, fit.fontSize + 24, nameFont, dark);
    centerText(page, fit.lines[1], 514, fit.fontSize + 24, nameFont, dark);
  }

  centerText(page, `pour son soutien en tant que ${founderLevel} FOUNDER`, 474, 18, sansBold, green);
  centerText(page, "au developpement et au lancement de Cele One.", 444, 15, sans, soft);

  page.drawLine({ start: { x: 132, y: 430 }, end: { x: 355, y: 430 }, thickness: 1.2, color: soft });
  page.drawLine({ start: { x: 438, y: 430 }, end: { x: 708, y: 430 }, thickness: 1.2, color: soft });
  page.drawLine({ start: { x: 794, y: 430 }, end: { x: 1014, y: 430 }, thickness: 1.2, color: soft });
  page.drawLine({ start: { x: 1098, y: 430 }, end: { x: 1260, y: 430 }, thickness: 1.2, color: soft });

  page.drawRectangle({ x: 114, y: 118, width: 130, height: 146, borderColor: gold, borderWidth: 2 });
  page.drawText(publicFounderId, { x: 268, y: 244, size: 22, font: sansBold, color: green });
  page.drawLine({ start: { x: 268, y: 214 }, end: { x: 528, y: 214 }, thickness: 2.2, color: green });
  page.drawRectangle({ x: 268, y: 166, width: 258, height: 28, color: green });

  page.drawText("Founder ID", { x: 268, y: 274, size: 11, font: sansBold, color: gold });
  page.drawText("Certificate Number", { x: 584, y: 116, size: 11, font: sansBold, color: gold });
  page.drawText(certNo, { x: 584, y: 96, size: 16, font: sansBold, color: dark });
  page.drawLine({ start: { x: 584, y: 104 }, end: { x: 794, y: 104 }, thickness: 1.4, color: soft });

  page.drawText("Issue Date", { x: 876, y: 116, size: 11, font: sansBold, color: gold });
  page.drawText(issued, { x: 876, y: 96, size: 14, font: sans, color: dark });
  page.drawLine({ start: { x: 876, y: 104 }, end: { x: 1072, y: 104 }, thickness: 1.4, color: soft });

  page.drawCircle({ x: 1165, y: 170, size: 47, borderColor: pale, borderWidth: 2 });
  page.drawText("Cele One", { x: 1116, y: 166, size: 12, font: sansBold, color: pale });

  page.drawText("Verification", { x: 102, y: 58, size: 10, font: sansBold, color: gold });
  page.drawText(verify, { x: 102, y: 42, size: 9, font: sans, color: soft });

  const pdfBytes = await pdf.save();
  return new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
}
