import type { ChariowSale } from "./types";

const FOUNDER_ID_PATTERN = /^COF-\d{4}-\d{6}$/i;
const preferredFieldKeys = [
  "founder_id",
  "founderid",
  "celeone_founder_id",
  "celeonefounderid",
  "founder_pass_id",
  "founderpassid",
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function normalizeFounderId(value: unknown) {
  const text = clean(value).toUpperCase();
  return FOUNDER_ID_PATTERN.test(text) ? text : "";
}

function fieldKey(value: Record<string, unknown>) {
  return clean(value.key || value.slug || value.code || value.name || value.label).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function fieldValue(value: Record<string, unknown>) {
  return clean(value.value || value.answer || value.text || value.content);
}

function candidateValues(source: unknown): string[] {
  if (Array.isArray(source)) {
    return source.flatMap((item) => {
      if (!item || typeof item !== "object") return [clean(item)];
      const row = item as Record<string, unknown>;
      const direct = fieldValue(row);
      const nested = candidateValues(row.value);
      return [direct, ...nested];
    });
  }

  if (source && typeof source === "object") {
    const row = source as Record<string, unknown>;
    const preferred = Object.values(row)
      .filter((item) => item && typeof item === "object")
      .map((item) => item as Record<string, unknown>)
      .filter((item) => preferredFieldKeys.includes(fieldKey(item)))
      .map((item) => fieldValue(item));

    const directEntries = Object.entries(row).flatMap(([key, value]) => {
      if (preferredFieldKeys.includes(clean(key).toLowerCase().replace(/[^a-z0-9]+/g, ""))) return [clean(value)];
      if (value && typeof value === "object") return [fieldValue(value as Record<string, unknown>)];
      return [clean(value)];
    });

    return [...preferred, ...directEntries];
  }

  return [clean(source)];
}

export function extractFounderReferenceId(sale: ChariowSale | null | undefined) {
  const source = sale?.custom_fields_values;
  if (!source) return "";
  const values = candidateValues(source).map(normalizeFounderId).filter(Boolean);
  return values[0] || "";
}
