import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BR_CLASS, LEAD_STATUS, type BrClass, type LeadStatus } from "@/lib/constants";

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint, tone = "primary" }: {
  label: string; value: ReactNode; icon: LucideIcon; hint?: string; tone?: "primary" | "violet" | "success" | "warning";
}) {
  const toneCls = { primary: "text-primary bg-primary/10", violet: "text-violet bg-violet/10", success: "text-success bg-success/10", warning: "text-warning bg-warning/10" }[tone];
  return (
    <div className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", toneCls)}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, children, className, actions }: { title?: string; children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5", className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function BrBadge({ value }: { value: BrClass }) {
  const cls = { confirmado: "bg-success/15 text-success border-success/30", provavel: "bg-warning/15 text-warning border-warning/30", nao_identificado: "bg-muted text-muted-foreground" }[value];
  return <Badge variant="outline" className={cls}>{BR_CLASS[value]}</Badge>;
}

export function StatusBadge({ value }: { value: LeadStatus }) {
  const cls: Record<LeadStatus, string> = {
    novo: "bg-primary/15 text-primary border-primary/30",
    qualificado: "bg-violet/15 text-violet border-violet/30",
    em_prospeccao: "bg-chart-5/15 text-chart-5 border-chart-5/30",
    contatado: "bg-warning/15 text-warning border-warning/30",
    em_negociacao: "bg-warning/15 text-warning border-warning/30",
    convertido: "bg-success/15 text-success border-success/30",
    descartado: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cls[value]}>{LEAD_STATUS[value]}</Badge>;
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 70 ? "text-success" : score >= 45 ? "text-warning" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-brand" style={{ width: `${score}%` }} />
      </div>
      <span className={cn("text-xs font-semibold tabular-nums", tone)}>{score}</span>
    </div>
  );
}

export function DemoTag() {
  return <Badge variant="outline" className="border-violet/40 bg-violet/10 text-[10px] text-violet">DEMO</Badge>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
