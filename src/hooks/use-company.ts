import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Returns the current user's company + their role inside that company. */
export function useCurrentCompany() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["current_company", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: cu, error } = await supabase
        .from("company_users")
        .select("id, company_id, username, display_name, role, status, companies(id, company_code, name, status)")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return cu;
    },
  });
}

/** Returns whether the current user has a given app_role in user_roles. */
export function useHasAppRole(role: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["has_role", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", role as any);
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });
}
