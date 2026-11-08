import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { Construction } from "lucide-react";
export const Route = createFileRoute("/_authenticated/conectores")({
  head: () => ({ meta: [{ title: "Conectores — Global Lead Intelligence" }] }),
  component: () => (<div><PageHeader title="Conectores" /><EmptyState icon={Construction} title="Módulo em construção" description="Esta tela será concluída na próxima etapa." /></div>),
});
