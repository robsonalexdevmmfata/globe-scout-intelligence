/**
 * Credenciais de demonstração.
 * Nota: o Supabase rejeita "admin123456" (senha vazada/HIBP) e domínios sem MX.
 * Use este par no login demo; confirme o usuário no painel Auth se o e-mail estiver pendente.
 */
export const DEMO_ADMIN = {
  email: "admin.globelead@mailinator.com",
  /** Equivalente forte a admin123456 (Supabase bloqueia a senha fraca). */
  password: "Adm1n_Demo_123456",
  fullName: "Administrador Demo",
} as const;
