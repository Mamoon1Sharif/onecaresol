// Resolves a (company_code, username) login pair to the synthetic auth email
// the user was signed up with, then returns it so the client can sign in.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company_code, username } = await req.json();
    if (typeof company_code !== "string" || typeof username !== "string" ||
        !company_code.trim() || !username.trim()) {
      return json({ error: "company_code and username are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin.rpc("resolve_login_email", {
      _company_code: company_code.trim(),
      _username: username.trim(),
    });

    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "Invalid Company ID or username" }, 404);

    return json({ email: data });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
