// Pure business rules: validation + lead scoring. Shared by client and server.

export function isValidEmailSyntax(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email.trim());
}

export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  return at > 0 ? email.slice(at + 1).toLowerCase() : null;
}

/** International phone: optional +, 8-15 digits (E.164), spaces/dashes/parens allowed. */
export function isValidInternationalPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed.startsWith("+")) return false;
  const digits = trimmed.replace(/[\s\-().]/g, "").slice(1);
  return /^[1-9]\d{7,14}$/.test(digits);
}

export function normalizeKey(name: string, city?: string | null): string {
  return `${name}|${city ?? ""}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9|]/g, "");
}

export type ScoreWeights = {
  perfil: number; qualidade: number; presenca: number;
  responsavel: number; potencial: number; compatibilidade: number;
};

export const DEFAULT_WEIGHTS: ScoreWeights = {
  perfil: 20, qualidade: 20, presenca: 15, responsavel: 15, potencial: 15, compatibilidade: 15,
};

export type ScoreInput = {
  segment?: string | null;
  email?: string | null; phone?: string | null; email_status?: string | null;
  website?: string | null; instagram?: string | null; linkedin?: string | null;
  owner_name?: string | null; contact_name?: string | null;
  br_classification?: string | null;
};

const HIGH_POTENTIAL = ["Clínicas médicas", "Clínicas odontológicas", "Imobiliárias", "Advocacia", "Construção civil", "Restaurantes"];

/** Each criterion scored 0..1, then weighted. Weights are normalized so the total is always 0..100. */
export function computeLeadScore(l: ScoreInput, w: ScoreWeights = DEFAULT_WEIGHTS) {
  const parts = {
    perfil: l.segment && l.segment !== "Outros" ? 1 : 0.4,
    qualidade:
      (isValidEmailSyntax(l.email) ? 0.4 : 0) +
      (isValidInternationalPhone(l.phone) ? 0.3 : 0) +
      (l.email_status === "confirmado" ? 0.3 : l.email_status === "dominio_valido" ? 0.2 : 0),
    presenca: [l.website, l.instagram, l.linkedin].filter(Boolean).length / 3,
    responsavel: l.owner_name || l.contact_name ? 1 : 0,
    // Weak digital presence = marketing opportunity for an agency.
    potencial: (HIGH_POTENTIAL.includes(l.segment ?? "") ? 0.6 : 0.3) + (!l.website || !l.instagram ? 0.4 : 0.1),
    compatibilidade: l.br_classification === "confirmado" ? 1 : l.br_classification === "provavel" ? 0.6 : 0,
  };
  const totalW = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  let score = 0;
  const breakdown: Record<string, number> = {};
  (Object.keys(parts) as (keyof ScoreWeights)[]).forEach((k) => {
    const v = Math.min(1, parts[k]) * (w[k] / totalW) * 100;
    breakdown[k] = Math.round(v);
    score += v;
  });
  return { score: Math.max(0, Math.min(100, Math.round(score))), breakdown };
}

/** Brazilian identification must never come from the name alone. */
export function classifyBrazilian(evidence: { explicit: number; indicators: number }) {
  if (evidence.explicit >= 1 && evidence.explicit + evidence.indicators >= 2) return "confirmado" as const;
  if (evidence.indicators >= 2 || evidence.explicit === 1) return "provavel" as const;
  return "nao_identificado" as const;
}
