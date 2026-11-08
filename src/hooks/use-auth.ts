import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { demoUserFromSession, getDemoSession, isDemoAuthed } from "@/lib/mock-auth";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncDemo = () => {
      const session = getDemoSession();
      if (session) {
        setDemo(true);
        setUser(demoUserFromSession(session) as User);
        setLoading(false);
        return true;
      }
      setDemo(false);
      return false;
    };

    if (syncDemo()) {
      // still listen for logout/login
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (isDemoAuthed()) {
        syncDemo();
        return;
      }
      setUser(s?.user ?? null);
      setLoading(false);
    });

    if (!isDemoAuthed()) {
      supabase.auth.getUser().then(({ data }) => {
        if (!isDemoAuthed()) {
          setUser(data.user);
          setLoading(false);
        }
      });
    }

    const onDemo = () => { syncDemo(); if (!isDemoAuthed()) setLoading(false); };
    window.addEventListener("gli-demo-auth", onDemo);
    return () => {
      sub.subscription.unsubscribe();
      window.removeEventListener("gli-demo-auth", onDemo);
    };
  }, []);

  const roleQ = useQuery({
    queryKey: ["my-role", user?.id, demo],
    enabled: !!user,
    queryFn: async () => {
      if (demo || isDemoAuthed()) return "admin";
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      const roles = (data ?? []).map((r) => r.role);
      return roles.includes("admin") ? "admin" : roles.includes("gestor") ? "gestor" : roles[0] ?? "operador";
    },
  });

  const role = (demo ? "admin" : (roleQ.data ?? "operador")) as "admin" | "gestor" | "operador";
  return {
    user,
    loading,
    role,
    isAdmin: role === "admin",
    isManager: role === "admin" || role === "gestor",
    isDemo: demo || isDemoAuthed(),
  };
}
