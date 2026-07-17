export function uppercaseFounderName(value: string) {
  return String(value || "").trim().replace(/\s+/g, " ").toLocaleUpperCase();
}

export function fitFounderName(name: string) {
  const normalized = uppercaseFounderName(name);
  const length = normalized.length;
  if (length <= 24) return { fontSize: 34, lines: [normalized] };
  if (length <= 40) return { fontSize: 30, lines: [normalized] };
  if (length <= 58) return { fontSize: 24, lines: [normalized] };
  const words = normalized.split(" ");
  const midpoint = Math.ceil(words.length / 2);
  return {
    fontSize: Math.max(20, 42 - Math.floor(length / 5)),
    lines: [words.slice(0, midpoint).join(" "), words.slice(midpoint).join(" ")],
  };
}

export function certificateStatusLabel(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "revoked") return "CERTIFICAT REVOQUE";
  if (normalized === "suspended") return "CERTIFICAT TEMPORAIREMENT SUSPENDU";
  if (normalized === "under_review") return "CERTIFICAT EN REVUE";
  return "CERTIFICAT VERIFIE";
}

export function founderLevelLabel(level?: string) {
  const normalized = String(level || "").toLowerCase();
  if (normalized === "legacy") return "LEGACY";
  if (normalized === "pioneer") return "PIONEER";
  if (normalized === "builder") return "BUILDER";
  return "SUPPORTER";
}
