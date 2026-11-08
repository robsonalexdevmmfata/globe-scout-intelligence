// Fictitious data generator. Every record is flagged is_demo=true and suffixed "(DEMO)".
// Never presented as real results.
import { CITY_SUGGESTIONS, SEGMENTS } from "./constants";
import { classifyBrazilian } from "./lead-rules";

const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Fernanda", "Gustavo", "Juliana", "Lucas", "Mariana", "Rafael", "Patrícia", "Thiago"];
const LAST = ["Silva", "Souza", "Oliveira", "Costa", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Lima", "Gomes"];
const PREFIX: Record<string, string[]> = {
  Restaurantes: ["Sabor", "Cantinho", "Brasa", "Tempero"],
  "Clínicas médicas": ["Clínica", "Instituto", "Centro Médico"],
  "Clínicas odontológicas": ["Odonto", "Sorriso", "Dental"],
  "Salões de beleza": ["Studio", "Espaço", "Bella"],
  Barbearias: ["Barbearia", "Barber"],
  default: ["Grupo", "Nova", "Prime", "Atlântico"],
};
const SUFFIX = ["Brasil", "Tropical", "Verde Amarelo", "Rio", "Bahia", "Minas", "Paulista", "Carioca", "Gaúcho"];

const PHONE_PREFIX: Record<string, string> = {
  "Estados Unidos": "+1 555", Canadá: "+1 555", Portugal: "+351 900", Espanha: "+34 900",
  Inglaterra: "+44 7700 900", França: "+33 6 00", Alemanha: "+49 1500", Itália: "+39 300", Irlanda: "+353 85 000", Outros: "+999",
};

function pick<T>(a: readonly T[], r: () => number): T { return a[Math.floor(r() * a.length)]; }

export type DemoLead = Record<string, unknown>;

export function generateDemoLeads(opts: {
  countries: string[]; cities: string[]; segments: string[]; quantity: number; filters: Record<string, boolean>;
}): DemoLead[] {
  const r = Math.random;
  const out: DemoLead[] = [];
  const countries = opts.countries.length ? opts.countries : ["Estados Unidos", "Portugal"];
  const segments = opts.segments.length ? opts.segments : [...SEGMENTS.slice(0, 6)];
  for (let i = 0; i < opts.quantity; i++) {
    const country = pick(countries, r);
    const cityPool = opts.cities.length ? opts.cities : CITY_SUGGESTIONS[country] ?? ["Cidade"];
    const city = pick(cityPool.length ? cityPool : ["Cidade"], r);
    const segment = pick(segments, r);
    const owner = `${pick(FIRST, r)} ${pick(LAST, r)}`;
    const company = `${pick(PREFIX[segment] ?? PREFIX.default, r)} ${pick(SUFFIX, r)} (DEMO)`;
    const slug = company.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 18);
    const f = opts.filters;
    const hasSite = f.without_website ? false : f.with_website ? true : r() > 0.35;
    const hasIg = f.with_instagram ? true : r() > 0.3;
    const hasLi = f.with_linkedin ? true : r() > 0.55;
    const hasEmail = f.with_email ? true : r() > 0.25;
    const hasPhone = f.with_phone ? true : r() > 0.2;
    let explicit = r() > 0.55 ? 1 : 0;
    let indicators = Math.floor(r() * 3);
    if (f.br_confirmed) { explicit = 1; indicators = Math.max(1, indicators); }
    else if (f.br_probable) { explicit = 0; indicators = 2; }
    const br = classifyBrazilian({ explicit, indicators });
    const sources: string[] = [];
    if (explicit) sources.push("Página 'Sobre' institucional (demonstração)");
    if (indicators > 0) sources.push("Descrição do perfil comercial (demonstração)");
    if (indicators > 1) sources.push("Associação comercial Brasil-local (demonstração)");
    out.push({
      company_name: company, owner_name: owner, contact_name: owner, contact_role: "Proprietário(a)",
      segment, country, city, address: `${100 + Math.floor(r() * 900)} Demo Street, ${city}`,
      website: hasSite ? `https://${slug}.example.com` : null,
      instagram: hasIg ? `@${slug}` : null,
      linkedin: hasLi ? `https://linkedin.com/company/${slug}-demo` : null,
      email: hasEmail ? `contato@${slug}.example.com` : null,
      phone: hasPhone ? `${PHONE_PREFIX[country] ?? "+999"} ${String(1000 + Math.floor(r() * 8999))}` : null,
      source: "Gerador de demonstração",
      br_classification: br,
      br_confidence: br === "confirmado" ? 80 + Math.floor(r() * 15) : br === "provavel" ? 50 + Math.floor(r() * 20) : Math.floor(r() * 30),
      br_sources: sources,
      br_justification:
        br === "confirmado" ? "Demonstração: declaração explícita de origem brasileira em fonte institucional, corroborada por fonte independente."
        : br === "provavel" ? "Demonstração: múltiplos indicadores compatíveis (idioma do conteúdo, associação comercial), sem declaração explícita."
        : "Demonstração: evidências insuficientes. O nome da pessoa não é usado como critério.",
      is_demo: true,
    });
  }
  return out;
}
