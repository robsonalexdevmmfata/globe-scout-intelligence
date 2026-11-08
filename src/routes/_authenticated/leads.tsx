import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, BrBadge, StatusBadge, ScorePill, DemoTag } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportLeads } from "@/lib/export";

export const Route = createFileRoute("/_authenticated/leads")({
  head: () => ({ meta: [{ title: "Gestão de Leads — Global Lead Intelligence" }] }),
  component: Leads,
});

function Leads() {
  const [q, setQ] = useState("");
  const { data = [], isLoading } = useQuery({
    queryKey: ["leads", q],
    queryFn: async () => {
      let s = supabase.from("leads").select("*").order("discovered_at", { ascending: false }).limit(500);
      if (q) s = s.or(`company_name.ilike.%${q}%,owner_name.ilike.%${q}%,city.ilike.%${q}%`);
      const { data, error } = await s; if (error) throw error; return data;
    },
  });
  return (
    <div>
      <PageHeader title="Gestão de Leads" description={`${data.length} registros`}
        actions={<>{(["xlsx","csv","json"] as const).map((f) => <Button key={f} variant="secondary" size="sm" onClick={() => exportLeads(data, f)}><Download className="mr-1 h-4 w-4" />{f.toUpperCase()}</Button>)}</>} />
      <Input placeholder="Buscar empresa, empresário ou cidade" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground"><tr>{["Empresa","Empresário","País","Cidade","Segmento","E-mail","Telefone","Classificação","Score","Status"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {isLoading ? <tr><td className="p-4" colSpan={10}>Carregando…</td></tr> : data.map((l) => (
              <tr key={l.id} className="border-t hover:bg-accent/40">
                <td className="p-3 font-medium">{l.company_name} {l.is_demo && <DemoTag />}</td>
                <td className="p-3">{l.owner_name}</td><td className="p-3">{l.country}</td><td className="p-3">{l.city}</td>
                <td className="p-3">{l.segment}</td><td className="p-3">{l.email}</td><td className="p-3">{l.phone}</td>
                <td className="p-3"><BrBadge value={l.br_classification} /></td><td className="p-3"><ScorePill score={l.score} /></td>
                <td className="p-3"><StatusBadge value={l.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
