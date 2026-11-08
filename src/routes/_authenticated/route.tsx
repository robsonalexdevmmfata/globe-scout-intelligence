import { createFileRoute, Link, Outlet, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  LayoutDashboard, Radar, Users, PlugZap, Workflow, ShieldCheck, Settings, UserCog, LogOut, Menu, History, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { clearDemoSession, isDemoAuthed } from "@/lib/mock-auth";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    if (isDemoAuthed()) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { redirect: location.href } });
  },
  component: AppShell,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/prospeccao", label: "Nova Prospecção", icon: Radar },
  { to: "/leads", label: "Gestão de Leads", icon: Users },
  { to: "/execucoes", label: "Execuções", icon: History },
  { to: "/conectores", label: "Conectores", icon: PlugZap },
  { to: "/automacoes", label: "Automações", icon: Workflow },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, role, isAdmin } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    clearDemoSession();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  };
  const items = isAdmin ? [...NAV, { to: "/admin", label: "Usuários", icon: UserCog } as const] : NAV;
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="p-5"><Logo /></div>
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((n) => {
          const active = path === n.to || path.startsWith(n.to + "/");
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
              <n.icon className={cn("h-4 w-4", active && "text-primary")} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="m-3 rounded-xl border bg-card/60 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-violet" /> {ROLE_LABEL[role]}</div>
        <Link to="/perfil" onClick={onNavigate} className="mt-1 block truncate text-sm font-medium hover:text-primary">{user?.email}</Link>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2 text-muted-foreground" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );
}

function AppShell() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r lg:block"><Sidebar /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0"><Sidebar onNavigate={() => setOpen(false)} /></SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu className="h-5 w-5" /></Button>
          <Logo />
        </header>
        <main className="mx-auto max-w-[1400px] p-4 md:p-8"><Outlet /></main>
        <SiteFooter />
      </div>
    </div>
  );
}
