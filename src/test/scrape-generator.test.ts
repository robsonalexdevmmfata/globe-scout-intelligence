import { describe, expect, it } from "vitest";
import { generateScrapedLeads } from "@/lib/scrape-generator";

describe("scrape generator", () => {
  it("gera a quantidade pedida sem marcar DEMO", () => {
    const leads = generateScrapedLeads({
      countries: ["Estados Unidos"],
      cities: ["Miami"],
      segments: ["Restaurantes"],
      quantity: 5,
      filters: { with_email: true, with_phone: true },
    });
    expect(leads).toHaveLength(5);
    for (const lead of leads) {
      expect(lead.is_demo).toBe(false);
      expect(String(lead.company_name)).not.toContain("(DEMO)");
      expect(lead.email).toBeTruthy();
      expect(lead.phone).toBeTruthy();
      expect(String(lead.source)).toMatch(/Coletor local/);
    }
  });
});
