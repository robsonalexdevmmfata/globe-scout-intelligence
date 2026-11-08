import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, CheckCircle2, Clock, Flag, Mail, Phone, Radar, Sparkles, Star, TrendingUp, Activity } from "lucide-react";
import { formatDistanceToNow, format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Global Lead Intelligence" }, { name: "description", content: "Indicadores de prospecção." }] }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 };

function countBy<T>(arr: T[], key: (x: T) => string | null | undefined) {
  const m = new Map<string, number>();
  arr.forEach((x) => { const k = key(x) || "—"; m.set(k, (m.get(k) ?? 0) + 1); });
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function Dashboard() {
  const leadsQ = useQuery({
    queryKey: ["dash-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads")
        .select("id,country,segment,br_classification,email,email_status,phone,phone_status,status,score,source,discovered_at,company_id,is_demo")
        .limit(5000);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });
  const jobsQ = useQuery({ queryKey: ["dash-jobs"], queryFn: async () => (await supabase.from("prospecting_jobs").select("id", { count: "exact", head: true })).count ?? 0 });
  const actQ = useQuery({
    queryKey: ["dash-activity"],
    queryFn: async () => (await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(12)).data ?? [],
    refetchInterval: 30000,
  });

  if (leadsQ.isLoading) return <div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  if (leadsQ.error) return <EmptyState icon={Activity} title="Erro ao carregar indicadores" description={(leadsQ.error as Error).message} />;
  const leads = leadsQ.data ?? [];
  const weekAgo = subDays(new Date(), 7);
  const br = leads.filter((l) => l.br_classification !== "nao_identificado").length;
  const qualified = leads.filter((l) => l.score >= 60 || l.status === "qualificado").length;
  const emailsOk = leads.filter((l) => l.email_status === "dominio_valido" || l.email_status === "confirmado").length;
  const phones = leads.filter((l) => l.phone).length;
  const pending = leads.filter((l) => l.email && l.email_status === "nao_verificado" || l.email_status === "sintaxe_valida").length;
  const newLeads = leads.filter((l) => new Date(l.discovered_at) > weekAgo).length;
  const quality = leads.length ? Math.round(leads.reduce((a, l) => a + l.score, 0) / leads.length) : 0;
  const companies = new Set(leads.map((l) => l.id)).size;
  const demoCount = leads.filter((l) => l.is_demo).length;

  const daily = Array.from({ length: 14 }).map((_, i) => {
    const d = subDays(new Date(), 13 - i);
    const key = format(d, "yyyy-MM-dd");
    return { name: format(d, "dd/MM"), leads: leads.filter((l) => l.discovered_at.slice(0, 10) === key).length };
  });
  const brDist = [
    { name: "Confirmado", value: leads.filter((l) => l.br_classification === "confirmado").length },
    { name: "Provável", value: leads.filter((l) => l.br_classification === "provavel").length },
    { name: "Não identificado", value: leads.filter((l) => l.br_classification === "nao_identificado").length },
  ];

  return (
    <div>
      <PageHeader title="Dashboard executivo" description="Indicadores da sua base, atualizados automaticamente."
        actions={<Button asChild className="bg-brand shadow-glow"><Link to="/prospeccao"><Radar className="mr-2 h-4 w-4" />Nova prospecção</Link></Button>} />
      {demoCount > 0 && (
        <div className="mb-6 rounded-lg border border-violet/30 bg-violet/10 px-4 py-2.5 text-sm text-violet">
          {demoCount} de {leads.length} registros são <strong>dados de demonstração</strong> fictícios. Eles podem ser excluídos em Compliance.
        </div>
      )}
      {leads.length === 0 ? (
        <EmptyState icon={Radar} title="Sua base ainda está vazia" description="Execute uma prospecção (real ou em modo demonstração) para ver os indicadores."
          action={<Button asChild><Link to="/prospeccao">Iniciar prospecção</Link></Button>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Empresas identificadas" value={companies} icon={Building2} />
            <StatCard label="Empresários brasileiros" value={br} icon={Flag} tone="violet" hint="Confirmados + prováveis" />
            <StatCard label="Leads qualificados" value={qualified} icon={Star} tone="success" />
            <StatCard label="E-mails com domínio válido" value={emailsOk} icon={Mail} />
            <StatCard label="Telefones encontrados" value={phones} icon={Phone} tone="violet" />
            <StatCard label="Pendentes de validação" value={pending} icon={Clock} tone="warning" />
            <StatCard label="Novos (7 dias)" value={newLeads} icon={TrendingUp} tone="success" />
            <StatCard label="Qualidade da base" value={`${quality}%`} icon={CheckCircle2} hint="Score médio" />
            <StatCard label="Campanhas executadas" value={jobsQ.data ?? 0} icon={Radar} tone="violet" />
            <StatCard label="Total de leads" value={leads.length} icon={Sparkles} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Panel title="Evolução diária da captação" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={daily}>
                  <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="leads" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Confiabilidade da identificação">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={brDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {brDist.map((_, i) => <Cell key={i} fill={[COLORS[2], COLORS[3], "var(--muted)"][i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 text-xs text-muted-foreground">{brDist.map((d) => <span key={d.name}>{d.name}: {d.value}</span>)}</div>
            </Panel>
            <Panel title="Leads por país">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={countBy(leads, (l) => l.country).slice(0, 8)} layout="vertical">
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={100} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Leads por segmento">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={countBy(leads, (l) => l.segment).slice(0, 8)} layout="vertical">
                  <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={120} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--accent)" }} />
                  <Bar dataKey="value" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title="Fontes que mais geram contatos">
              <div className="space-y-3">
                {countBy(leads, (l) => l.source).slice(0, 6).map((s, i) => (
                  <div key={s.name}>
                    <div className="flex justify-between text-xs"><span>{s.name}</span><span className="text-muted-foreground">{s.value}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(s.value / leads.length) * 100}%`, background: COLORS[i % 5] }} /></div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}
      <Panel title="Atividades recentes" className="mt-6">
        {(actQ.data ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma atividade ainda.</p> : (
          <ul className="divide-y">
            {(actQ.data ?? []).map((a) => {
              const d = (a.details ?? {}) as Record<string, unknown>;
              const label: Record<string, string> = { lead_created: "Nova empresa identificada", lead_updated: "Lead atualizado", lead_deleted: "Lead excluído", role_changed: "Permissão alterada" };
              return (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span><span className="text-muted-foreground">{label[a.action] ?? a.action}:</span> {String(d.company ?? d.role ?? a.entity_id ?? "")}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDistanceToNow(new Date(a.created_at), { locale: ptBR, addSuffix: true })}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
