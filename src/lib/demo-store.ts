import { generateDemoLeads } from "@/lib/demo-generator";
import { generateScrapedLeads } from "@/lib/scrape-generator";
import { computeLeadScore, isValidEmailSyntax, isValidInternationalPhone, normalizeKey } from "@/lib/lead-rules";

const LEADS_KEY = "gli_demo_leads";
const JOBS_KEY = "gli_demo_jobs";

export type DemoLeadRow = Record<string, unknown> & {
  id: string;
  company_name: string;
  discovered_at: string;
  score: number;
  status: string;
  is_demo: boolean;
};

export type DemoJobRow = {
  id: string;
  mode: string;
  status: string;
  created_at: string;
  counters?: Record<string, number> | null;
  error?: string | null;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("gli-demo-data"));
}

export function listDemoLeads(): DemoLeadRow[] {
  return readJson<DemoLeadRow[]>(LEADS_KEY, []);
}

export function listDemoJobs(): DemoJobRow[] {
  return readJson<DemoJobRow[]>(JOBS_KEY, []);
}

export function clearDemoData() {
  localStorage.removeItem(LEADS_KEY);
  localStorage.removeItem(JOBS_KEY);
  window.dispatchEvent(new Event("gli-demo-data"));
}

export async function runLocalProspecting(input: {
  countries: string[];
  cities: string[];
  segments: string[];
  filters: Record<string, boolean>;
  quantity: number;
  mode: "demonstracao" | "real";
}) {
  // Pequeno delay para a UI de andamento aparecer
  await new Promise((r) => setTimeout(r, 400));

  const raw =
    input.mode === "real"
      ? generateScrapedLeads(input)
      : generateDemoLeads(input);

  const existing = listDemoLeads();
  const seen = new Set(existing.map((e) => normalizeKey(String(e.company_name), e.city as string)));
  const unique: Record<string, unknown>[] = [];
  for (const l of raw) {
    const k = normalizeKey(String(l.company_name), l.city as string);
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(l);
  }

  let validated = 0;
  let enriched = 0;
  const now = new Date().toISOString();
  const rows: DemoLeadRow[] = unique.map((l) => {
    const email_status = isValidEmailSyntax(l.email as string) ? "sintaxe_valida" : l.email ? "invalido" : "nao_verificado";
    const phone_status = isValidInternationalPhone(l.phone as string) ? "formato_valido" : l.phone ? "invalido" : "nao_verificado";
    if (email_status === "sintaxe_valida" || phone_status === "formato_valido") validated++;
    if (l.email || l.phone || l.website) enriched++;
    const { score } = computeLeadScore({ ...(l as object), email_status } as never);
    return {
      ...l,
      id: crypto.randomUUID(),
      email_status,
      phone_status,
      website_status: "nao_verificado",
      score,
      status: "novo",
      discovered_at: now,
      created_by: "demo-admin",
      is_demo: input.mode === "demonstracao" ? true : Boolean(l.is_demo),
    } as DemoLeadRow;
  });

  writeJson(LEADS_KEY, [...rows, ...existing]);

  const counters = {
    found: raw.length,
    processed: raw.length,
    enriched,
    validated,
    duplicates_removed: raw.length - unique.length,
    inserted: rows.length,
  };

  const job: DemoJobRow = {
    id: crypto.randomUUID(),
    mode: input.mode,
    status: "concluido",
    created_at: now,
    counters,
    error: null,
  };
  writeJson(JOBS_KEY, [job, ...listDemoJobs()]);

  return {
    jobId: job.id,
    status: "concluido" as const,
    error: null,
    counters,
    logs: [
      { at: now, step: "coleta", message: `${raw.length} empresas encontradas (modo local)` },
      { at: now, step: "concluido", message: `${rows.length} leads adicionados à base local` },
    ],
  };
}
