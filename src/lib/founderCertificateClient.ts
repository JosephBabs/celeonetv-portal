import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { founderLevelLabel, verificationUrl } from "./founders";

const TEMPLATE_URL = "/founders/founder-certificate-template.pdf";

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

function drawCentered(page: PDFPage, text: string, y: number, size: number, color: ReturnType<typeof rgb>, font: PDFFont) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, { x, y, size, font, color });
}

function fitNameFont(font: PDFFont, pageWidth: number, text: string, maxSize = 34, minSize = 18, margin = 120) {
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(text, size) > pageWidth - margin * 2) size -= 1;
  return size;
}

export async function buildFounderCertificatePdf(founder: Record<string, unknown>) {
  const templateResponse = await fetch(TEMPLATE_URL);
  if (!templateResponse.ok) throw new Error("CERTIFICATE_TEMPLATE_MISSING");
  const templateBytes = await templateResponse.arrayBuffer();
  const pdf = await PDFDocument.load(templateBytes);
  const page = pdf.getPage(0);
  const { width } = page.getSize();

  const serif = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const dark = rgb(0.06, 0.24, 0.21);
  const gold = rgb(0.63, 0.49, 0.13);
  const soft = rgb(0.2, 0.32, 0.28);

  const name = founderName(founder).toUpperCase();
  const publicFounderId = stringValue(founder.publicFounderId, "-");
  const founderLevel = founderLevelLabel(stringValue(founder.founderLevel)).toUpperCase();
  const certNo = certificateNumber(founder);
  const issued = issueDate(founder);
  const verifyUrl = verificationUrl(publicFounderId);

  const nameSize = fitNameFont(serif, width, name, 34, 18, 100);
  drawCentered(page, name, 360, nameSize, dark, serif);
  drawCentered(page, "Cele One Founder's Pass", 324, 14, gold, sansBold);

  page.drawText("Founder ID", { x: 98, y: 218, size: 10, font: sansBold, color: gold });
  page.drawText(publicFounderId, { x: 98, y: 198, size: 14, font: sansBold, color: dark });

  page.drawText("Certificate No", { x: 98, y: 166, size: 10, font: sansBold, color: gold });
  page.drawText(certNo, { x: 98, y: 146, size: 13, font: sansBold, color: dark });

  page.drawText("Founder Level", { x: 420, y: 218, size: 10, font: sansBold, color: gold });
  page.drawText(founderLevel, { x: 420, y: 198, size: 14, font: sansBold, color: dark });

  page.drawText("Issue Date", { x: 420, y: 166, size: 10, font: sansBold, color: gold });
  page.drawText(issued, { x: 420, y: 146, size: 12, font: sans, color: dark });

  page.drawText("Verification", { x: 96, y: 90, size: 10, font: sansBold, color: gold });
  page.drawText(verifyUrl, { x: 96, y: 72, size: 9, font: sans, color: soft });

  page.drawText("Official digital founder certificate generated locally for the account holder.", {
    x: 96,
    y: 52,
    size: 8,
    font: sans,
    color: soft,
  });

  const pdfBytes = await pdf.save();
  return new Blob([Uint8Array.from(pdfBytes)], { type: "application/pdf" });
}
