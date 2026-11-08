import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/ui-kit";
import { Construction } from "lucide-react";
export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Global Lead Intelligence" }] }),
  component: () => (<div><PageHeader title="Configurações" /><EmptyState icon={Construction} title="Módulo em construção" description="Esta tela será concluída na próxima etapa." /></div>),
});
