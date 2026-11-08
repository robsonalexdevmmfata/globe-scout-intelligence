/**
 * Cria (ou valida) o usuário admin de demonstração no Supabase.
 * Uso: npm run seed:admin
 *
 * Preferível: SUPABASE_SERVICE_ROLE_KEY no ambiente (confirma e-mail automaticamente).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://vymtwmaedowwlukupmxb.supabase.co";
const anon =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_NjdG-ULg0j2STBU5_30MAw_MPf1SwLf";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = "admin.globelead@mailinator.com";
const password = "Adm1n_Demo_123456";

const client = createClient(url, service || anon, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const login = await client.auth.signInWithPassword({ email, password });
if (!login.error && login.data.user) {
  console.log("OK: admin já existe e a senha bate.");
  console.log("email:", email);
  console.log("password:", password);
  console.log("user_id:", login.data.user.id);
  process.exit(0);
}

console.log("Login falhou:", login.error?.message ?? "sem sessão");

if (service) {
  const admin = createClient(url, service, { auth: { autoRefreshToken: false, persistSession: false } });
  const listed = await admin.auth.admin.listUsers({ perPage: 200 });
  const existing = listed.data?.users?.find((u) => u.email === email);
  if (existing) {
    const upd = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name: "Administrador Demo" },
    });
    if (upd.error) {
      console.error("Falha ao atualizar admin:", upd.error.message);
      process.exit(1);
    }
    console.log("OK: admin atualizado e e-mail confirmado via service role.");
    console.log("email:", email);
    console.log("password:", password);
    console.log("user_id:", existing.id);
    process.exit(0);
  }

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Administrador Demo" },
  });
  if (created.error) {
    console.error("Falha ao criar com service role:", created.error.message);
    process.exit(1);
  }
  console.log("OK: admin criado via service role.");
  console.log("email:", email);
  console.log("password:", password);
  console.log("user_id:", created.data.user.id);
  process.exit(0);
}

const signup = await client.auth.signUp({
  email,
  password,
  options: { data: { full_name: "Administrador Demo" } },
});

if (signup.error) {
  console.error("Falha no signup público:", signup.error.message);
  console.error("Defina SUPABASE_SERVICE_ROLE_KEY ou confirme o usuário no painel Auth do Supabase.");
  process.exit(1);
}

if (signup.data.session) {
  console.log("OK: admin criado (signup com sessão imediata).");
} else {
  console.log("AVISO: usuário criado/pendente, mas sem sessão (confirmação de e-mail ativa).");
  console.log("No Supabase: Authentication → Users → confirme", email);
  console.log("Ou desative Confirm email em Authentication → Providers → Email.");
}

console.log("email:", email);
console.log("password:", password);
console.log("user_id:", signup.data.user?.id);
