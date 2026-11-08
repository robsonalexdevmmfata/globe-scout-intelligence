// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { DEMO_ADMIN, isDemoCredentials, setDemoSession } from "@/lib/mock-auth";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined }),
  head: () => ({
    meta: [
      { title: "Entrar — Global Lead Intelligence" },
      { name: "description", content: "Acesse sua conta da plataforma Global Lead Intelligence." },
      { property: "og:title", content: "Entrar — Global Lead Intelligence" },
      { property: "og:description", content: "Acesse sua conta da plataforma Global Lead Intelligence." },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  if (!p) return "/dashboard";
  try { const u = new URL(p, window.location.origin); return u.origin === window.location.origin ? u.pathname + u.search : "/dashboard"; }
  catch { return "/dashboard"; }
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  const go = () => navigate({ to: safePath(redirect) as "/dashboard" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        if (isDemoCredentials(email, password)) {
          setDemoSession();
          go();
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        go();
      } else if (mode === "signup") {
        if (isDemoCredentials(email, password)) {
          setDemoSession();
          go();
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) go();
        else toast.success("Conta criada! Confirme seu e-mail para entrar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        toast.success("Enviamos um link de recuperação para seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na autenticação");
    } finally { setLoading(false); }
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) return toast.error("Não foi possível entrar com Google");
    if (r.redirected) return;
    go();
  };

  const fillDemoAdmin = () => {
    setMode("login");
    setEmail(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
  };

  const loginAsDemoAdmin = async () => {
    setMode("login");
    setEmail(DEMO_ADMIN.email);
    setPassword(DEMO_ADMIN.password);
    setLoading(true);
    try {
      // Sessão local — zero Supabase
      setDemoSession();
      go();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r bg-grid lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-violet/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/"><Logo /></Link>
          <div>
            <h2 className="text-4xl font-semibold leading-tight">Encontre empresários brasileiros<br /><span className="text-brand">nos EUA e na Europa.</span></h2>
            <p className="mt-4 max-w-md text-muted-foreground">Prospecção B2B, enriquecimento e qualificação com IA, com origem dos dados registrada e conformidade com LGPD e GDPR.</p>
          </div>
          <SiteFooter className="border-0 px-0 py-0 text-left" />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          {mode === "forgot" ? (
            <form onSubmit={submit} className="space-y-4">
              <h1 className="text-2xl font-semibold">Recuperar senha</h1>
              <p className="text-sm text-muted-foreground">Informe seu e-mail para receber o link.</p>
              <div className="space-y-2"><Label htmlFor="em">E-mail</Label><Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <Button className="w-full" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enviar link</Button>
              <button type="button" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => setMode("login")}>Voltar ao login</button>
            </form>
          ) : (
            <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")}>
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Criar conta</TabsTrigger></TabsList>
              {(["login", "signup"] as const).map((m) => (
                <TabsContent key={m} value={m}>
                  <form onSubmit={submit} className="mt-4 space-y-4">
                    {m === "signup" && <div className="space-y-2"><Label htmlFor="nm">Nome</Label><Input id="nm" required value={name} onChange={(e) => setName(e.target.value)} /></div>}
                    <div className="space-y-2"><Label htmlFor={`e-${m}`}>E-mail</Label><Input id={`e-${m}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between"><Label htmlFor={`p-${m}`}>Senha</Label>
                        {m === "login" && <button type="button" className="text-xs text-primary hover:underline" onClick={() => setMode("forgot")}>Esqueci a senha</button>}</div>
                      <Input id={`p-${m}`} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>
                    <Button className="w-full bg-brand shadow-glow" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{m === "login" ? "Entrar" : "Criar conta"}</Button>
                  </form>
                </TabsContent>
              ))}
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
              <button type="button" onClick={google} className="flex h-10 w-full items-center justify-center gap-2.5 rounded-md border border-[#8E918F] bg-[#131314] text-sm font-medium text-[#E3E3E3]">
                <GoogleIcon /> Continuar com Google
              </button>
              <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Acesso demo local (sem Supabase)</p>
                <p className="mt-1">E-mail: {DEMO_ADMIN.email} (ou só <strong>admin</strong>)</p>
                <p>Senha: {DEMO_ADMIN.password}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" variant="secondary" size="sm" className="h-8" onClick={fillDemoAdmin}>Preencher</Button>
                  <Button type="button" size="sm" className="h-8 bg-brand" disabled={loading} onClick={loginAsDemoAdmin}>
                    {loading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Entrar como admin
                  </Button>
                </div>
              </div>
            </Tabs>
          )}
          <SiteFooter className="mt-8 border-0 lg:hidden" />
        </div>
      </div>
    </div>
  );
}
