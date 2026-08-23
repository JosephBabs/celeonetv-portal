import fs from "node:fs";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  terminate,
  where,
  writeBatch,
} from "firebase/firestore";

const WRITE = process.argv.includes("--write");
const pdfPath = "C:\\Users\\ADMIN\\Downloads\\CCC-Hymns.pdf";
const batchSize = 450;

const firebaseConfig = {
  apiKey: "AIzaSyBC3MTssV5lPRkkuf2Sct_UtGjWX1PfYzk",
  authDomain: "celeone-e5843.firebaseapp.com",
  projectId: "celeone-e5843",
  storageBucket: "celeone-e5843.firebasestorage.app",
  messagingSenderId: "275960060318",
  appId: "1:275960060318:web:489485dc1e2be2c1eade8f",
};

function extractPdf() {
  const code = String.raw`
import json, re
import fitz

pdf_path = r"C:\Users\ADMIN\Downloads\CCC-Hymns.pdf"

def normalize_text(text):
    text = (text or "").replace("\r", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()

def column_text(doc, side):
    chunks = []
    for page in doc:
        clip = fitz.Rect(60, 65, 292, 780) if side == "left" else fitz.Rect(292, 65, 535, 780)
        chunks.append(page.get_text("text", clip=clip))
    return normalize_text("\n\n".join(chunks))

def parse_hymns(text, side):
    text = re.sub(r"\n\s*Hymn\s+The way of salvation", "\nHymn 970\nThe way of salvation", text, flags=re.IGNORECASE)
    if side == "right":
        text = re.sub(r"(\n\s*Hymn\s*(\d+)\b)\s*\n\s*Orin+\s*\2\b", r"\1", text, flags=re.IGNORECASE)
    pattern = re.compile(r"(?:^|\n)\s*(Orin+|Hymns?|Songs?)\s*(\d+)\b", re.IGNORECASE)
    matches = list(pattern.finditer(text))
    hymns = []
    for index, match in enumerate(matches):
        marker = match.group(1).lower()
        number = int(match.group(2))
        start = match.start() + (1 if match.group(0).startswith("\n") else 0)
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        raw = normalize_text(text[start:end])
        if re.search(r"\b(?:reserv|reveser)", raw[:180], re.IGNORECASE):
            continue
        if marker.startswith("song"):
            continue
        language = "english" if side == "right" and marker.startswith("hymn") else "yoruba"
        title_marker = "Hymn" if language == "english" else "Orin"
        raw = re.sub(r"^\s*(?:Orin+|Hymns?|Songs?)\s*" + str(number) + r"\b\s*", title_marker + " " + str(number) + "\n", raw, flags=re.IGNORECASE)
        hymns.append({"number": number, "raw": raw, "language": language})
    return hymns

doc = fitz.open(pdf_path)
result = {
    "pages": doc.page_count,
    "items": parse_hymns(column_text(doc, "left"), "left") + parse_hymns(column_text(doc, "right"), "right"),
}
print(json.dumps(result, ensure_ascii=False))
`;
  const result = spawnSync("python", ["-c", code], {
    encoding: "utf8",
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    maxBuffer: 40 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || "PDF extraction failed");
  return JSON.parse(result.stdout);
}

function stripHeader(raw, language, number) {
  const marker = language === "yoruba" ? "Orin" : "Hymn";
  return removeLeadingEditLabels(
    trimTrailingHeadings(String(raw || "").replace(new RegExp(`^\\s*${marker}\\s+${number}\\b\\s*`, "i"), "")),
  );
}

function removeLeadingEditLabels(text) {
  const lines = String(text || "").split("\n");
  while (lines.length) {
    const value = lines[0]?.trim() || "";
    if (!/^(?:new\s+edit|edited|ne\s+edited)$/i.test(value)) break;
    lines.shift();
    while (lines.length && !lines[0]?.trim()) lines.shift();
  }
  return lines.join("\n").trim();
}

function trimTrailingHeadings(text) {
  const lines = String(text || "").split("\n");
  while (lines.length && !lines.at(-1)?.trim()) lines.pop();
  while (lines.length) {
    const value = lines.at(-1)?.trim() || "";
    if (!isSectionHeading(value)) break;
    lines.pop();
    while (lines.length && !lines.at(-1)?.trim()) lines.pop();
  }
  return lines.join("\n").trim();
}

function isSectionHeading(line) {
  const value = line.trim();
  if (!value || value.length > 70) return false;
  if (/^(amin|amen)$/i.test(value)) return false;
  if (/^\d+\s*[:.)-]/.test(value)) return false;
  if (looksLikeNotation(value)) return false;
  const letters = value.replace(/[^\p{L}]/gu, "");
  if (letters.length < 5) return false;
  return letters === letters.toUpperCase();
}

function looksLikeNotation(line) {
  const value = line.trim();
  if (!value) return false;
  const compact = value.replace(/\s+/g, "");
  if (/^[drmfslti0-9;:,\-–—()[\]{}.\sce]+$/i.test(value) && /[drmfslti]/i.test(value)) return true;
  if ((value.match(/[;:]/g) || []).length >= 3 && /^[^A-ZÀ-ÖØ-ÞẸỌṢÈÉÍÓÚÁÀÂÊÎÔÛÄËÏÖÜÑÇ]{0,}$/u.test(value.replace(/[drmfslti0-9;:,\-–—()[\]{}.\sce\s]/gi, ""))) return true;
  if (compact.length <= 4 && /^[ivxlcdm]+$/i.test(compact)) return false;
  return false;
}

function titleFromRaw(raw, language, number) {
  const body = stripHeader(raw, language, number);
  const lines = body.split("\n").map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    const clean = line
      .replace(/^\d+\s*[:.)-]\s*/, "")
      .replace(/^Chorus\s*[:.)-]\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!clean || looksLikeNotation(clean)) continue;
    if (/^(amin|amen)$/i.test(clean)) continue;
    return clean.slice(0, 90);
  }
  return language === "yoruba" ? `Orin ${number}` : `Hymn ${number}`;
}

function htmlFromRaw(raw, language, number) {
  const body = stripHeader(raw, language, number);
  const lines = body.split("\n");
  const html = [];
  let lastWasBreak = false;
  for (const line of lines) {
    const value = line.trim();
    if (!value) {
      if (!lastWasBreak && html.length) html.push("<br>");
      lastWasBreak = true;
      continue;
    }
    html.push(`<p>${escapeHtml(value)}</p>`);
    lastWasBreak = false;
  }
  return html.join("\n").replace(/(?:\n<br>)+$/g, "").trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function duplicateNumbers(items) {
  const seen = new Set();
  const dupes = new Set();
  for (const item of items) {
    if (seen.has(item.number)) dupes.add(item.number);
    seen.add(item.number);
  }
  return [...dupes].sort((a, b) => a - b);
}

function versionedId(language, number, seen) {
  const key = `${language}_${number}`;
  const count = (seen.get(key) || 0) + 1;
  seen.set(key, count);
  return count === 1 ? key : `${key}_v${count}`;
}

async function existingIds(db, language) {
  const snap = await getDocs(query(collection(db, "cantiques"), where("language", "==", language)));
  return new Set(snap.docs.map((entry) => entry.id));
}

function toPayload(item, language) {
  const number = Number(item.number);
  return {
    title: titleFromRaw(item.raw, language, number),
    hymnNumber: number,
    language,
    musicalKey: "",
    hymnContent: htmlFromRaw(item.raw, language, number),
    source: "CCC-Hymns.pdf",
    sourceSide: language === "yoruba" ? "left" : "right",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

async function commitCreates(db, creates) {
  let committed = 0;
  for (let i = 0; i < creates.length; i += batchSize) {
    const batch = writeBatch(db);
    for (const item of creates.slice(i, i + batchSize)) {
      batch.set(doc(db, "cantiques", item.id), item.payload);
    }
    await batch.commit();
    committed += Math.min(batchSize, creates.length - i);
    console.log(`Committed ${committed}/${creates.length}`);
  }
}

async function main() {
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);
  const extracted = extractPdf();
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const yorubaItems = extracted.items.filter((item) => item.language === "yoruba");
  const englishItems = extracted.items.filter((item) => item.language === "english");
  const groups = [
    ["yoruba", yorubaItems],
    ["english", englishItems],
  ];

  console.log(`PDF pages: ${extracted.pages}`);
  for (const [language, items] of groups) {
    const dupes = duplicateNumbers(items);
    console.log(`${language}: parsed=${items.length} first=${items[0]?.number} last=${items.at(-1)?.number} duplicates=${dupes.join(",") || "none"}`);
  }

  const creates = [];
  for (const [language, items] of groups) {
    const existing = await existingIds(db, language);
    const seenIds = new Map();
    let skipped = 0;
    for (const item of items) {
      const id = versionedId(language, item.number, seenIds);
      if (existing.has(id)) {
        skipped += 1;
        continue;
      }
      creates.push({ id, payload: toPayload(item, language) });
    }
    console.log(`${language}: existing=${existing.size} skipped=${skipped}`);
  }

  console.log(`New documents to create: ${creates.length}`);
  console.log("Preview:", creates.slice(0, 6).map((item) => ({ id: item.id, ...item.payload, createdAt: "[serverTimestamp]", updatedAt: "[serverTimestamp]" })));

  if (!WRITE) {
    console.log("Dry run only. Re-run with --write to publish.");
    await terminate(db);
    return;
  }

  await commitCreates(db, creates);
  await terminate(db);
  console.log("Import complete.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
