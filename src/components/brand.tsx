import { Globe2 } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand shadow-glow">
        <Globe2 className="h-5 w-5 text-primary-foreground" />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold">Global Lead</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Intelligence</div>
        </div>
      )}
    </div>
  );
}
