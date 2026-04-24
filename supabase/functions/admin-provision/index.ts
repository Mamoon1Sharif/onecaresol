// Provisions companies and company users.
// Actions:
//   - create_company  (super_admin only): creates company + first admin user
//   - create_user     (super_admin OR same-company admin): adds a user to a company
//
// Uses the caller's JWT to verify their permissions, then a service-role
// client to actually create the auth user and insert the company_users row.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYNTH_EMAIL_DOMAIN = "users.onecaresol.local";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return json({ error: "Not authenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "", {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const callerId = userData.user.id;

    // Check caller permissions
    const { data: roles } = await admin
      .from("user_roles").select("role").eq("user_id", callerId);
    const isSuperAdmin = !!roles?.some((r: any) => r.role === "super_admin");

    const { data: callerCu } = await admin
      .from("company_users").select("company_id, role").eq("user_id", callerId).maybeSingle();
    const isCompanyAdmin = !!callerCu && (callerCu.role === "owner" || callerCu.role === "admin");

    const body = await req.json();
    const action = body.action as string;

    if (action === "create_company") {
      if (!isSuperAdmin) return json({ error: "Super admin only" }, 403);

      const { company_code, company_name, admin_username, admin_password, admin_display_name } = body;
      if (!company_code || !company_name || !admin_username || !admin_password) {
        return json({ error: "Missing required fields" }, 400);
      }

      // Create company
      const { data: company, error: cErr } = await admin
        .from("companies")
        .insert({ company_code, name: company_name })
        .select().single();
      if (cErr) return json({ error: cErr.message }, 400);

      // Create auth user with synthetic email
      const synthEmail = `${slug(company_code)}_${slug(admin_username)}@${SYNTH_EMAIL_DOMAIN}`;
      const { data: created, error: uErr } = await admin.auth.admin.createUser({
        email: synthEmail,
        password: admin_password,
        email_confirm: true,
        user_metadata: { username: admin_username, company_code, display_name: admin_display_name ?? admin_username },
      });
      if (uErr) {
        await admin.from("companies").delete().eq("id", company.id);
        return json({ error: uErr.message }, 400);
      }

      // Link company_users
      const { error: cuErr } = await admin.from("company_users").insert({
        user_id: created.user!.id,
        company_id: company.id,
        username: admin_username,
        display_name: admin_display_name ?? admin_username,
        role: "owner",
      });
      if (cuErr) return json({ error: cuErr.message }, 400);

      return json({ company, user_id: created.user!.id });
    }

    if (action === "create_user") {
      const { company_id, username, password, display_name, role } = body;
      if (!company_id || !username || !password) {
        return json({ error: "Missing required fields" }, 400);
      }

      const targetCompanyId = company_id;
      if (!isSuperAdmin) {
        if (!isCompanyAdmin || callerCu!.company_id !== targetCompanyId) {
          return json({ error: "Forbidden" }, 403);
        }
      }

      const { data: comp } = await admin.from("companies").select("company_code").eq("id", targetCompanyId).single();
      if (!comp) return json({ error: "Company not found" }, 404);

      const synthEmail = `${slug(comp.company_code)}_${slug(username)}@${SYNTH_EMAIL_DOMAIN}`;
      const { data: created, error: uErr } = await admin.auth.admin.createUser({
        email: synthEmail,
        password,
        email_confirm: true,
        user_metadata: { username, company_code: comp.company_code, display_name: display_name ?? username },
      });
      if (uErr) return json({ error: uErr.message }, 400);

      const { error: cuErr } = await admin.from("company_users").insert({
        user_id: created.user!.id,
        company_id: targetCompanyId,
        username,
        display_name: display_name ?? username,
        role: role ?? "member",
      });
      if (cuErr) return json({ error: cuErr.message }, 400);

      return json({ user_id: created.user!.id });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
