import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Radar, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Logo } from "@/components/brand";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Lead Intelligence — Prospecção B2B de empresários brasileiros no exterior" },
      { name: "description", content: "Encontre, qualifique e organize empresários brasileiros com negócios nos EUA e na Europa, com IA e conformidade LGPD/GDPR." },
      { property: "og:title", content: "Global Lead Intelligence" },
      { property: "og:description", content: "Inteligência comercial e lead scoring com IA para agências de marketing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Radar, title: "Central de prospecção", text: "Configure países, cidades, segmentos e filtros, e acompanhe cada etapa da coleta." },
  { icon: Target, title: "Identificação brasileira", text: "Classificação Confirmado, Provável ou Não identificado, com fontes e justificativa. Nunca pelo nome." },
  { icon: Brain, title: "IA e Lead Score", text: "Resumo, oportunidades de marketing e abordagem personalizada, com score de 0 a 100 configurável." },
  { icon: ShieldCheck, title: "Compliance", text: "Origem dos dados, auditoria, lista de supressão e política de retenção para LGPD e GDPR." },
];

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="absolute -top-40 left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between p-6">
        <Logo />
        <div className="flex gap-2">
          <Button asChild variant="ghost"><Link to="/auth" search={{ redirect: undefined }}>Entrar</Link></Button>
          <Button asChild className="bg-brand"><Link to="/auth" search={{ redirect: undefined }}>Começar</Link></Button>
        </div>
      </header>
      <section className="relative mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-24">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-violet" /> Inteligência comercial com IA
        </div>
        <h1 className="text-4xl font-semibold leading-[1.05] md:text-6xl">
          Os empresários brasileiros<br />do mundo, <span className="text-brand">em uma só base.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Encontre, enriqueça e qualifique negócios de brasileiros nos Estados Unidos e na Europa, com origem de dados registrada e score de potencial comercial.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" className="bg-brand shadow-glow"><Link to="/auth" search={{ redirect: undefined }}>Acessar plataforma <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
      <section className="relative mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card/70 p-5 backdrop-blur transition-colors hover:border-primary/40">
            <f.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
      <SiteFooter className="relative" />
    </div>
  );
}
