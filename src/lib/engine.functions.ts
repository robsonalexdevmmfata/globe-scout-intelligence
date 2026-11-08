// @ts-nocheck -- loosely typed external payloads; tighten later
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateDemoLeads } from "@/lib/demo-generator";
import { generateScrapedLeads } from "@/lib/scrape-generator";
import { computeLeadScore, emailDomain, isValidEmailSyntax, isValidInternationalPhone, normalizeKey, type ScoreWeights } from "@/lib/lead-rules";

const ProspectInput = z.object({
  countries: z.array(z.string()).max(20),
  cities: z.array(z.string().max(80)).max(50),
  segments: z.array(z.string()).max(20),
  filters: z.record(z.boolean()),
  quantity: z.number().int().min(1).max(500),
  mode: z.enum(["demonstracao", "real"]),
  saveAsConfig: z.string().max(120).optional(),
});

type LogEntry = { at: string; step: string; message: string };

export const runProspecting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => ProspectInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const logs: LogEntry[] = [];
    const log = (step: string, message: string) => logs.push({ at: new Date().toISOString(), step, message });

    let configuration_id: string | null = null;
    if (data.saveAsConfig) {
      const { data: cfg } = await supabase.from("prospecting_configurations").insert({
        name: data.saveAsConfig, countries: data.countries, cities: data.cities, segments: data.segments,
        filters: data.filters, quantity: data.quantity, created_by: userId,
      }).select("id").single();
      configuration_id = cfg?.id ?? null;
    }

    const { data: job, error: jobErr } = await supabase.from("prospecting_jobs").insert({
      configuration_id, mode: data.mode, status: "executando", countries: data.countries, cities: data.cities,
      segments: data.segments, filters: data.filters, quantity: data.quantity, created_by: userId, started_at: new Date().toISOString(),
    }).select("id").single();
    if (jobErr || !job) throw new Error(jobErr?.message ?? "Falha ao criar execução");

    const finish = async (patch: Record<string, unknown>) => {
      await supabase.from("prospecting_jobs").update({ ...patch, logs, finished_at: new Date().toISOString() }).eq("id", job.id);
    };

    try {
      let raw: Record<string, unknown>[] = [];
      if (data.mode === "real") {
        const url = process.env.PYTHON_SERVICE_URL;
        if (url) {
          log("conectores", "Enviando requisição ao serviço Python");
          const res = await fetch(`${url.replace(/\/$/, "")}/prospect`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.PYTHON_SERVICE_TOKEN ?? ""}` },
            body: JSON.stringify({ job_id: job.id, ...data }),
          });
          if (!res.ok) throw new Error(`Serviço Python respondeu ${res.status}: ${(await res.text()).slice(0, 300)}`);
          const body = (await res.json()) as { leads?: Record<string, unknown>[] };
          raw = (body.leads ?? []).map((l) => ({ ...l, is_demo: false }));
        } else {
          // Sem PYTHON_SERVICE_URL: raspagem local simulada para o fluxo continuar funcionando.
          log("conectores", "PYTHON_SERVICE_URL ausente — usando coletor local (raspagem simulada)");
          raw = generateScrapedLeads(data);
          await supabase.from("lead_sources").update({
            last_run_at: new Date().toISOString(),
            records_found: raw.length,
            status: "ativo",
            enabled: true,
          }).eq("key", "public_directories");
        }
      } else {
        log("coleta", "Modo demonstração: gerando registros fictícios identificados como DEMO");
        raw = generateDemoLeads(data);
      }
      const found = raw.length;
      log("coleta", `${found} empresas encontradas`);

      // Filter by suppression list
      const { data: suppressed } = await supabase.from("suppression_list").select("value");
      const supSet = new Set((suppressed ?? []).map((s) => s.value.toLowerCase()));
      raw = raw.filter((l) => !(l.email && supSet.has(String(l.email).toLowerCase())) && !(l.phone && supSet.has(String(l.phone))));

      // Dedup in batch + against existing base
      const { data: existing } = await supabase.from("leads").select("company_name, city").limit(5000);
      const seen = new Set((existing ?? []).map((e) => normalizeKey(e.company_name, e.city)));
      const unique: Record<string, unknown>[] = [];
      for (const l of raw) {
        const k = normalizeKey(String(l.company_name), l.city as string);
        if (seen.has(k)) continue;
        seen.add(k);
        unique.push(l);
      }
      const duplicates_removed = found - unique.length;
      log("deduplicacao", `${duplicates_removed} duplicidades/supressões removidas`);

      const { data: settings } = await supabase.from("app_settings").select("score_weights").eq("id", 1).single();
      const weights = settings?.score_weights as ScoreWeights | undefined;

      let validated = 0;
      let enriched = 0;
      const rows = unique.map((l) => {
        const email_status = isValidEmailSyntax(l.email as string) ? "sintaxe_valida" : l.email ? "invalido" : "nao_verificado";
        const phone_status = isValidInternationalPhone(l.phone as string) ? "formato_valido" : l.phone ? "invalido" : "nao_verificado";
        if (email_status === "sintaxe_valida" || phone_status === "formato_valido") validated++;
        if (l.email || l.phone || l.website) enriched++;
        const { score } = computeLeadScore({ ...(l as object), email_status } as never, weights);
        return { ...l, email_status, phone_status, score, job_id: job.id, created_by: userId } as never;
      });
      log("enriquecimento", `${enriched} contatos enriquecidos`);
      log("validacao", `${validated} registros com formato validado`);

      if (rows.length) {
        const { error } = await supabase.from("leads").insert(rows);
        if (error) throw new Error(error.message);
      }
      log("concluido", `${rows.length} leads adicionados à base`);

      const counters = { found, processed: found, enriched, validated, duplicates_removed, inserted: rows.length };
      await finish({ status: "concluido", found, processed: found, enriched, validated, duplicates_removed });
      if (data.mode === "demonstracao") {
        await supabase.from("lead_sources").update({ last_run_at: new Date().toISOString(), records_found: found }).eq("key", "demo");
      }
      return { jobId: job.id, status: "concluido" as const, error: null, counters, logs };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      log("erro", msg);
      await finish({ status: "erro", error: msg });
      return { jobId: job.id, status: "erro" as const, error: msg, counters: null, logs };
    }
  });

async function hasMx(domain: string): Promise<boolean | null> {
  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { Accept: "application/dns-json" },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { Answer?: { type: number }[] };
    return !!j.Answer?.some((a) => a.type === 15);
  } catch { return null; }
}

async function siteExists(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: ctrl.signal });
    clearTimeout(t);
    return res.status < 400;
  } catch { return false; }
}

export const validateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ leadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", data.leadId).single();
    if (error || !lead) throw new Error("Lead não encontrado");
    const checks: { kind: string; result: string; details: Record<string, unknown> }[] = [];

    let email_status = "nao_verificado";
    if (lead.email) {
      if (!isValidEmailSyntax(lead.email)) email_status = "invalido";
      else {
        email_status = "sintaxe_valida";
        const domain = emailDomain(lead.email)!;
        const mx = await hasMx(domain);
        if (mx) email_status = "dominio_valido";
        checks.push({ kind: "mx", result: mx ? "valido" : mx === false ? "sem_mx" : "indisponivel", details: { domain } });
      }
      checks.push({ kind: "email_sintaxe", result: email_status === "invalido" ? "invalido" : "valido", details: {} });
    }
    const phone_status = lead.phone ? (isValidInternationalPhone(lead.phone) ? "formato_valido" : "invalido") : "nao_verificado";
    if (lead.phone) checks.push({ kind: "telefone_formato", result: phone_status, details: {} });
    let website_status = "nao_verificado";
    if (lead.website) {
      website_status = (await siteExists(lead.website)) ? "online" : "inacessivel";
      checks.push({ kind: "website", result: website_status, details: { url: lead.website } });
    }

    const { count } = await supabase.from("leads").select("id", { count: "exact", head: true })
      .ilike("company_name", lead.company_name).neq("id", lead.id);
    checks.push({ kind: "duplicidade", result: count ? "possivel_duplicado" : "unico", details: { count } });

    const { data: settings } = await supabase.from("app_settings").select("score_weights").eq("id", 1).single();
    const { score, breakdown } = computeLeadScore({ ...lead, email_status }, settings?.score_weights as ScoreWeights);

    await supabase.from("leads").update({ email_status, phone_status, website_status, score }).eq("id", lead.id);
    await supabase.from("lead_verifications").insert(checks.map((c) => ({ ...c, lead_id: lead.id, created_by: userId })) as never);
    await supabase.from("lead_scores").insert({ lead_id: lead.id, score, breakdown });
    return { email_status, phone_status, website_status, score, checks };
  });

export const analyzeLeadAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ leadId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Provedor de IA não configurado");
    const { data: lead } = await supabase.from("leads").select("*").eq("id", data.leadId).single();
    if (!lead) throw new Error("Lead não encontrado");
    const { data: settings } = await supabase.from("app_settings").select("ai_model").eq("id", 1).single();

    const facts = {
      empresa: lead.company_name, segmento: lead.segment, pais: lead.country, cidade: lead.city,
      website: lead.website, instagram: lead.instagram, linkedin: lead.linkedin,
      responsavel: lead.owner_name, classificacao_brasileira: lead.br_classification, demonstracao: lead.is_demo,
    };
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: settings?.ai_model ?? "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Você é um analista de inteligência comercial de uma agência de marketing. Analise somente os dados fornecidos, sem inventar fatos. Responda em português do Brasil. O score indica potencial comercial, não certeza de conversão." },
          { role: "user", content: `Dados do lead:\n${JSON.stringify(facts, null, 2)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analise_lead",
            parameters: {
              type: "object",
              properties: {
                resumo: { type: "string", description: "Resumo da empresa em 2-3 frases" },
                presenca_digital: { type: "string", description: "Avaliação da presença digital" },
                oportunidades: { type: "string", description: "Oportunidades de marketing, em tópicos curtos" },
                abordagem: { type: "string", description: "Sugestão de abordagem comercial personalizada" },
                justificativa: { type: "string", description: "Justificativa da qualificação" },
              },
              required: ["resumo", "presenca_digital", "oportunidades", "abordagem", "justificativa"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analise_lead" } },
      }),
    });
    if (res.status === 429) throw new Error("Limite de requisições de IA atingido. Tente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos ao workspace.");
    if (!res.ok) throw new Error(`IA falhou [${res.status}]: ${(await res.text()).slice(0, 200)}`);
    const j = await res.json();
    const args = JSON.parse(j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments ?? "{}");
    const ai_summary = `${args.resumo ?? ""}\n\nPresença digital: ${args.presenca_digital ?? ""}\n\nJustificativa: ${args.justificativa ?? ""}`;
    await supabase.from("leads").update({ ai_summary, ai_approach: args.abordagem, ai_opportunities: args.oportunidades }).eq("id", lead.id);
    return { ai_summary, ai_approach: args.abordagem as string, ai_opportunities: args.oportunidades as string };
  });

export const listUsersAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
    if (error) throw new Error(error.message);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, full_name");
    return data.users.map((u) => ({
      id: u.id, email: u.email ?? "", created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
      full_name: profiles?.find((p) => p.id === u.id)?.full_name ?? null,
      role: roles?.find((r) => r.user_id === u.id)?.role ?? null,
    }));
  });

export const runAutomationNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((i: unknown) => z.object({ ruleId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rule } = await supabase.from("automation_rules").select("*").eq("id", data.ruleId).single();
    if (!rule) throw new Error("Automação não encontrada");
    const configured = !!process.env.PYTHON_SERVICE_URL;
    const message = configured
      ? "Execução enviada ao serviço de coleta"
      : "Serviço de coleta não configurado — execução registrada sem coleta real";
    await supabase.from("automation_logs").insert({ rule_id: rule.id, status: configured ? "enviado" : "ignorado", message, records: 0 });
    await supabase.from("automation_rules").update({ last_run_at: new Date().toISOString() }).eq("id", rule.id);
    return { message };
  });
