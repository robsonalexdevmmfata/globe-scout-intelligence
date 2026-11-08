// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, Loader2, Radar, X, AlertTriangle, FlaskConical } from "lucide-react";
import { runProspecting } from "@/server/engine.functions";
import { CITY_SUGGESTIONS, COUNTRIES, EXTRA_FILTERS, SEGMENTS } from "@/lib/constants";
import { PageHeader, Panel } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prospeccao")({
  head: () => ({ meta: [{ title: "Nova Prospecção — Global Lead Intelligence" }, { name: "description", content: "Configure e execute prospecções." }] }),
  component: Prospeccao,
});

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("rounded-full border px-3 py-1.5 text-xs transition-all", active ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground hover:border-primary/40 hover:text-foreground")}>
      {children}
    </button>
  );
}

const STAGES = [
  { key: "found", label: "Empresas encontradas" },
  { key: "processed", label: "Dados sendo processados" },
  { key: "enriched", label: "Contatos enriquecidos" },
  { key: "validated", label: "Registros validados" },
  { key: "duplicates_removed", label: "Duplicidades removidas" },
  { key: "inserted", label: "Processamento concluído" },
] as const;

function Prospeccao() {
  const [countries, setCountries] = useState<string[]>(["Estados Unidos"]);
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [segments, setSegments] = useState<string[]>(["Restaurantes"]);
  const [filters, setFilters] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(25);
  const [mode, setMode] = useState<"demonstracao" | "real">("demonstracao");
  const [configName, setConfigName] = useState("");
  const [stage, setStage] = useState(-1);
  const qc = useQueryClient();
  const run = useServerFn(runProspecting);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const addCity = (c: string) => { const v = c.trim(); if (v && !cities.includes(v)) setCities([...cities, v]); setCityInput(""); };

  const m = useMutation({
    mutationFn: () => run({ data: { countries, cities, segments, filters, quantity, mode, saveAsConfig: configName || undefined } }),
    onSuccess: (r) => {
      if (r.status === "erro") toast.error(r.error ?? "Falha na prospecção");
      else toast.success(`${r.counters?.inserted ?? 0} leads adicionados`);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Visual progression through stages once results arrive
  useEffect(() => {
    if (m.isPending) { setStage(0); return; }
    if (m.data?.status === "concluido") {
      let i = 0;
      const t = setInterval(() => { i++; setStage(i); if (i >= STAGES.length) clearInterval(t); }, 350);
      return () => clearInterval(t);
    }
  }, [m.isPending, m.data]);

  const counters = m.data?.counters as Record<string, number> | null | undefined;
  const suggestions = countries.flatMap((c) => CITY_SUGGESTIONS[c] ?? []).filter((c) => !cities.includes(c));

  return (
    <div>
      <PageHeader title="Nova Prospecção" description="Defina o público-alvo. Cada execução registra origem, logs e resultados." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Países">
            <div className="flex flex-wrap gap-2">{COUNTRIES.map((c) => <Chip key={c} active={countries.includes(c)} onClick={() => toggle(countries, setCountries, c)}>{c}</Chip>)}</div>
          </Panel>
          <Panel title="Cidades">
            <div className="flex gap-2">
              <Input placeholder="Digite uma localidade e pressione Enter" value={cityInput} onChange={(e) => setCityInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCity(cityInput); } }} />
              <Button variant="secondary" onClick={() => addCity(cityInput)}>Adicionar</Button>
            </div>
            {cities.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{cities.map((c) => (
              <Badge key={c} className="gap-1 bg-primary/15 text-primary hover:bg-primary/20">{c}<button onClick={() => setCities(cities.filter((x) => x !== c))} aria-label={`Remover ${c}`}><X className="h-3 w-3" /></button></Badge>
            ))}</div>}
            {suggestions.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5"><span className="mr-1 text-xs text-muted-foreground">Sugestões:</span>
              {suggestions.slice(0, 12).map((c) => <button key={c} onClick={() => addCity(c)} className="text-xs text-muted-foreground hover:text-primary">+ {c}</button>)}</div>}
          </Panel>
          <Panel title="Segmentos">
            <div className="flex flex-wrap gap-2">{SEGMENTS.map((s) => <Chip key={s} active={segments.includes(s)} onClick={() => toggle(segments, setSegments, s)}>{s}</Chip>)}</div>
          </Panel>
          <Panel title="Filtros adicionais">
            <div className="grid gap-3 sm:grid-cols-2">
              {EXTRA_FILTERS.map((f) => (
                <label key={f.key} className="flex cursor-pointer items-center gap-2.5 rounded-lg border p-3 text-sm hover:border-primary/40">
                  <Checkbox checked={!!filters[f.key]} onCheckedChange={(v) => setFilters({ ...filters, [f.key]: !!v })} />{f.label}
                </label>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Execução">
            <div className="space-y-4">
              <RadioGroup value={mode} onValueChange={(v) => setMode(v as typeof mode)} className="gap-2">
                <label className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", mode === "demonstracao" && "border-violet/50 bg-violet/5")}>
                  <RadioGroupItem value="demonstracao" className="mt-0.5" />
                  <div><div className="flex items-center gap-2 text-sm font-medium"><FlaskConical className="h-4 w-4 text-violet" />Modo demonstração</div>
                    <p className="text-xs text-muted-foreground">Gera dados fictícios marcados como DEMO, para testes.</p></div>
                </label>
                <label className={cn("flex cursor-pointer gap-3 rounded-lg border p-3", mode === "real" && "border-primary/50 bg-primary/5")}>
                  <RadioGroupItem value="real" className="mt-0.5" />
                  <div><div className="flex items-center gap-2 text-sm font-medium"><Radar className="h-4 w-4 text-primary" />Coleta real</div>
                    <p className="text-xs text-muted-foreground">Usa os conectores configurados. Requer o serviço de coleta.</p></div>
                </label>
              </RadioGroup>
              <div className="space-y-2"><Label htmlFor="qty">Quantidade desejada</Label>
                <Input id="qty" type="number" min={1} max={500} value={quantity} onChange={(e) => setQuantity(Math.max(1, Math.min(500, Number(e.target.value) || 1)))} /></div>
              <div className="space-y-2"><Label htmlFor="cfg">Salvar configuração como (opcional)</Label>
                <Input id="cfg" placeholder="Ex.: Restaurantes Flórida" value={configName} onChange={(e) => setConfigName(e.target.value)} /></div>
              <Button size="lg" className="w-full bg-brand font-semibold tracking-wide shadow-glow" disabled={m.isPending || countries.length === 0} onClick={() => m.mutate()}>
                {m.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radar className="mr-2 h-4 w-4" />}INICIAR PROSPECÇÃO
              </Button>
            </div>
          </Panel>

          {(m.isPending || m.data) && (
            <Panel title="Andamento">
              {m.data?.status === "erro" ? (
                <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{m.data.error}</div>
              ) : (
                <>
                  <Progress value={m.isPending ? 15 : (Math.min(stage, STAGES.length) / STAGES.length) * 100} className="mb-4" />
                  <ul className="space-y-2.5">
                    {STAGES.map((s, i) => {
                      const done = !m.isPending && stage > i;
                      const active = m.isPending ? i === 0 : stage === i;
                      return (
                        <li key={s.key} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            {done ? <CheckCircle2 className="h-4 w-4 text-success" /> : active ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                            {s.label}
                          </span>
                          <span className="tabular-nums text-muted-foreground">{done && counters ? counters[s.key] : "—"}</span>
                        </li>
                      );
                    })}
                  </ul>
                  {stage >= STAGES.length && <Button asChild variant="secondary" className="mt-4 w-full"><Link to="/leads">Ver leads</Link></Button>}
                </>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
