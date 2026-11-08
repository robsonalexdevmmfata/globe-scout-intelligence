export const COUNTRIES = [
  "Estados Unidos", "Portugal", "Espanha", "Inglaterra", "França",
  "Alemanha", "Itália", "Irlanda", "Canadá", "Outros",
] as const;

export const CITY_SUGGESTIONS: Record<string, string[]> = {
  "Estados Unidos": ["Miami", "Orlando", "Boston", "Nova York", "Newark", "Fort Lauderdale", "Atlanta", "Houston"],
  Portugal: ["Lisboa", "Porto", "Braga", "Coimbra", "Faro"],
  Espanha: ["Madri", "Barcelona", "Valência", "Málaga"],
  Inglaterra: ["Londres", "Manchester", "Birmingham"],
  França: ["Paris", "Lyon", "Marselha"],
  Alemanha: ["Berlim", "Munique", "Frankfurt", "Hamburgo"],
  Itália: ["Roma", "Milão", "Florença"],
  Irlanda: ["Dublin", "Cork", "Galway"],
  Canadá: ["Toronto", "Vancouver", "Montreal", "Calgary"],
  Outros: [],
};

export const SEGMENTS = [
  "Restaurantes", "Clínicas médicas", "Clínicas odontológicas", "Salões de beleza", "Barbearias",
  "Construção civil", "Imobiliárias", "Advocacia", "Contabilidade", "Comércio", "E-commerce",
  "Tecnologia", "Consultorias", "Prestadores de serviços", "Outros",
] as const;

export const EXTRA_FILTERS = [
  { key: "with_website", label: "Empresas com site" },
  { key: "without_website", label: "Empresas sem site" },
  { key: "with_instagram", label: "Empresas com Instagram" },
  { key: "with_linkedin", label: "Empresas com LinkedIn" },
  { key: "with_email", label: "Empresas com e-mail comercial" },
  { key: "with_phone", label: "Empresas com telefone" },
  { key: "br_confirmed", label: "Identificação brasileira confirmada" },
  { key: "br_probable", label: "Identificação brasileira provável" },
] as const;

export const LEAD_STATUS = {
  novo: "Novo",
  qualificado: "Qualificado",
  em_prospeccao: "Em prospecção",
  contatado: "Contatado",
  em_negociacao: "Em negociação",
  convertido: "Convertido",
  descartado: "Descartado",
} as const;
export type LeadStatus = keyof typeof LEAD_STATUS;

export const BR_CLASS = {
  confirmado: "Confirmado",
  provavel: "Provável",
  nao_identificado: "Não identificado",
} as const;
export type BrClass = keyof typeof BR_CLASS;

export const EMAIL_STATUS: Record<string, string> = {
  nao_verificado: "Não verificado",
  sintaxe_valida: "Sintaxe válida",
  dominio_valido: "Domínio válido (MX)",
  confirmado: "Confirmado",
  invalido: "Inválido",
};

export const ROLE_LABEL = { admin: "Administrador", gestor: "Gestor", operador: "Operador" } as const;
