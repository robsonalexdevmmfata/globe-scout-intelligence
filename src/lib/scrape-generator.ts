// Coleta simulada (raspagem mock). Registros NÃO levam sufixo (DEMO),
// mas a origem deixa claro que vieram do coletor local/simulado.
import { CITY_SUGGESTIONS, SEGMENTS } from "./constants";
import { classifyBrazilian } from "./lead-rules";

const FIRST = ["Ana", "Bruno", "Carla", "Diego", "Fernanda", "Gustavo", "Juliana", "Lucas", "Mariana", "Rafael", "Patrícia", "Thiago", "Camila", "Eduardo"];
const LAST = ["Silva", "Souza", "Oliveira", "Costa", "Pereira", "Almeida", "Ribeiro", "Carvalho", "Lima", "Gomes", "Martins", "Rocha"];
const PREFIX: Record<string, string[]> = {
  Restaurantes: ["Sabor", "Cantinho", "Brasa", "Tempero", "Casa"],
  "Clínicas médicas": ["Clínica", "Instituto", "Centro Médico", "Health"],
  "Clínicas odontológicas": ["Odonto", "Sorriso", "Dental", "Oral"],
  "Salões de beleza": ["Studio", "Espaço", "Bella", "Glow"],
  Barbearias: ["Barbearia", "Barber", "Corte"],
  default: ["Grupo", "Nova", "Prime", "Atlântico", "Global"],
};
const SUFFIX = ["Brasil", "Tropical", "Verde Amarelo", "Rio", "Bahia", "Minas", "Paulista", "Carioca", "Gaúcho", "São Paulo"];
const DIRECTORIES = [
  "Diretório empresarial público",
  "Câmara de comércio local",
  "Listagem setorial pública",
  "Página Sobre institucional",
];

const PHONE_PREFIX: Record<string, string> = {
  "Estados Unidos": "+1 305", Canadá: "+1 416", Portugal: "+351 21", Espanha: "+34 91",
  Inglaterra: "+44 20", França: "+33 1", Alemanha: "+49 30", Itália: "+39 02", Irlanda: "+353 1", Outros: "+999",
};

function pick<T>(a: readonly T[], r: () => number): T {
  return a[Math.floor(r() * a.length)];
}

export type ScrapedLead = Record<string, unknown>;

/** Gera leads no formato esperado pelo pipeline de prospecção (coleta real simulada). */
export function generateScrapedLeads(opts: {
  countries: string[];
  cities: string[];
  segments: string[];
  quantity: number;
  filters: Record<string, boolean>;
}): ScrapedLead[] {
  const r = Math.random;
  const out: ScrapedLead[] = [];
  const countries = opts.countries.length ? opts.countries : ["Estados Unidos", "Portugal"];
  const segments = opts.segments.length ? opts.segments : [...SEGMENTS.slice(0, 6)];

  for (let i = 0; i < opts.quantity; i++) {
    const country = pick(countries, r);
    const cityPool = opts.cities.length ? opts.cities : CITY_SUGGESTIONS[country] ?? ["Cidade"];
    const city = pick(cityPool.length ? cityPool : ["Cidade"], r);
    const segment = pick(segments, r);
    const owner = `${pick(FIRST, r)} ${pick(LAST, r)}`;
    const company = `${pick(PREFIX[segment] ?? PREFIX.default, r)} ${pick(SUFFIX, r)}`;
    const slug = company.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "").slice(0, 18);
    const f = opts.filters;
    const hasSite = f.without_website ? false : f.with_website ? true : r() > 0.3;
    const hasIg = f.with_instagram ? true : r() > 0.35;
    const hasLi = f.with_linkedin ? true : r() > 0.5;
    const hasEmail = f.with_email ? true : r() > 0.2;
    const hasPhone = f.with_phone ? true : r() > 0.15;

    let explicit = r() > 0.5 ? 1 : 0;
    let indicators = Math.floor(r() * 3);
    if (f.br_confirmed) {
      explicit = 1;
      indicators = Math.max(1, indicators);
    } else if (f.br_probable) {
      explicit = 0;
      indicators = 2;
    }
    const br = classifyBrazilian({ explicit, indicators });
    const sources: string[] = [];
    if (explicit) sources.push("Página 'Sobre' institucional");
    if (indicators > 0) sources.push("Descrição do perfil comercial");
    if (indicators > 1) sources.push("Associação comercial Brasil-local");

    out.push({
      company_name: company,
      owner_name: owner,
      contact_name: owner,
      contact_role: "Proprietário(a)",
      segment,
      country,
      city,
      address: `${100 + Math.floor(r() * 900)} Main St, ${city}`,
      website: hasSite ? `https://www.${slug}.com` : null,
      instagram: hasIg ? `@${slug}` : null,
      linkedin: hasLi ? `https://linkedin.com/company/${slug}` : null,
      email: hasEmail ? `contato@${slug}.com` : null,
      phone: hasPhone ? `${PHONE_PREFIX[country] ?? "+999"} ${String(1000 + Math.floor(r() * 8999))}` : null,
      source: `Coletor local · ${pick(DIRECTORIES, r)}`,
      br_classification: br,
      br_confidence:
        br === "confirmado" ? 75 + Math.floor(r() * 20)
          : br === "provavel" ? 45 + Math.floor(r() * 25)
            : Math.floor(r() * 35),
      br_sources: sources,
      br_justification:
        br === "confirmado"
          ? "Declaração explícita de origem brasileira em fonte institucional, corroborada por fonte independente."
          : br === "provavel"
            ? "Múltiplos indicadores compatíveis (idioma, associação comercial), sem declaração explícita."
            : "Evidências insuficientes. O nome da pessoa não é usado como critério.",
      is_demo: false,
    });
  }
  return out;
}
