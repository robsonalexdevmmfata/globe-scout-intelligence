import { describe, expect, it } from "vitest";
import { classifyBrazilian, computeLeadScore, isValidEmailSyntax, isValidInternationalPhone } from "@/lib/lead-rules";

describe("lead rules", () => {
  it("score stays within 0..100", () => {
    const full = computeLeadScore({
      segment: "Clínicas médicas", email: "a@b.com", phone: "+1 305 555 0101", email_status: "confirmado",
      website: "x", instagram: "y", linkedin: "z", owner_name: "Ana", br_classification: "confirmado",
    });
    expect(full.score).toBeLessThanOrEqual(100);
    expect(computeLeadScore({}).score).toBeGreaterThanOrEqual(0);
  });
  it("lead without Brazilian evidence gets no compatibility points", () => {
    expect(computeLeadScore({ br_classification: "nao_identificado" }).breakdown["compatibilidade"]).toBe(0);
  });
  it("validates email syntax", () => {
    expect(isValidEmailSyntax("contato@empresa.com")).toBe(true);
    expect(isValidEmailSyntax("contato@empresa")).toBe(false);
  });
  it("requires international phone format", () => {
    expect(isValidInternationalPhone("+351 912 345 678")).toBe(true);
    expect(isValidInternationalPhone("912345678")).toBe(false);
  });
  it("name-only evidence is never enough to classify", () => {
    expect(classifyBrazilian({ explicit: 0, indicators: 0 })).toBe("nao_identificado");
    expect(classifyBrazilian({ explicit: 0, indicators: 1 })).toBe("nao_identificado");
    expect(classifyBrazilian({ explicit: 1, indicators: 1 })).toBe("confirmado");
    expect(classifyBrazilian({ explicit: 0, indicators: 2 })).toBe("provavel");
  });
});
