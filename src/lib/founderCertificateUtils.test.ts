import { describe, expect, it } from "vitest";
import { certificateStatusLabel, fitFounderName, uppercaseFounderName } from "./founderCertificateUtils";

describe("founderCertificateUtils", () => {
  it("uppercases founder names with accents", () => {
    expect(uppercaseFounderName("Jean-Baptiste Adeyemi")).toContain("JEAN-BAPTISTE");
  });

  it("keeps medium names on one line", () => {
    const value = fitFounderName("Joseph Aremou Sunday Babatounde");
    expect(value.lines).toHaveLength(1);
    expect(value.fontSize).toBeLessThanOrEqual(30);
  });

  it("splits long names into two lines", () => {
    const value = fitFounderName("A very long multi part founder name that should span two centered lines safely");
    expect(value.lines.length).toBeGreaterThan(1);
    expect(value.fontSize).toBeGreaterThanOrEqual(20);
  });

  it("maps revoked status to the expected certificate label", () => {
    expect(certificateStatusLabel("revoked")).toBe("CERTIFICAT REVOQUE");
  });
});
