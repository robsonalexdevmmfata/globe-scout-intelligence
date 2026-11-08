/**
 * Auth demo 100% local — sem Supabase, sem confirmação de e-mail.
 * Credenciais: admin / admin123456
 */
export const DEMO_ADMIN = {
  email: "admin@local",
  password: "admin123456",
  fullName: "Administrador Demo",
  id: "00000000-0000-4000-8000-000000000001",
} as const;

const SESSION_KEY = "gli_demo_session";

export type DemoSession = {
  id: string;
  email: string;
  full_name: string;
  role: "admin";
  created_at: string;
};

export function isDemoCredentials(email: string, password: string) {
  const e = email.trim().toLowerCase();
  return (e === DEMO_ADMIN.email || e === "admin") && password === DEMO_ADMIN.password;
}

export function getDemoSession(): DemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSession;
  } catch {
    return null;
  }
}

export function setDemoSession(): DemoSession {
  const session: DemoSession = {
    id: DEMO_ADMIN.id,
    email: DEMO_ADMIN.email,
    full_name: DEMO_ADMIN.fullName,
    role: "admin",
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event("gli-demo-auth"));
  return session;
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("gli-demo-auth"));
}

export function isDemoAuthed() {
  return !!getDemoSession();
}

/** Shape compatível com o que a UI usa de User do Supabase. */
export function demoUserFromSession(s: DemoSession) {
  return {
    id: s.id,
    email: s.email,
    app_metadata: {},
    user_metadata: { full_name: s.full_name },
    aud: "demo",
    created_at: s.created_at,
  };
}
