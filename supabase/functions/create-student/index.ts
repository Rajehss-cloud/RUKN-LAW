import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function respond(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return respond({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Supabase function environment is incomplete.");
    return respond({ error: "Server configuration is incomplete." }, 500);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization) {
    return respond({ error: "Authentication is required." }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return respond({ error: "Your session is invalid or expired." }, 401);
  }

  const { data: profile, error: profileError } = await userClient
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (profileError) {
    console.error("Could not verify the account role:", profileError.message);
    return respond({ error: "Could not verify account permissions." }, 500);
  }

  let canCreateStudents = profile?.role === "super_admin";
  if (profile?.role === "admin") {
    const { data: permissionRow, error: permissionError } = await userClient
      .from("admin_permissions")
      .select("permissions")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (permissionError) {
      console.error("Could not verify student-management permission:", permissionError.message);
      return respond({ error: "Could not verify account permissions." }, 500);
    }
    canCreateStudents = permissionRow?.permissions?.includes("students") === true;
  }

  if (!canCreateStudents) {
    return respond({ error: "You are not allowed to create student accounts." }, 403);
  }

  let input: {
    fullName?: unknown;
    phone?: unknown;
    email?: unknown;
    password?: unknown;
  };
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Request body must be a JSON object." }, 400);
    }
    input = body as typeof input;
  } catch {
    return respond({ error: "Request body must be valid JSON." }, 400);
  }

  const fullName = typeof input.fullName === "string" ? input.fullName.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (
    !fullName ||
    fullName.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 8 ||
    password.length > 128
  ) {
    return respond({
      error: "Enter a name, valid email address, and password between 8 and 128 characters."
    }, 400);
  }
  if (phone.length > 40) {
    return respond({ error: "Phone number is too long." }, 400);
  }
  if (email === "sherifeltahawy86@gmail.com") {
    return respond({ error: "The primary administrator address cannot be created as a student." }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone }
  });

  if (createError) {
    console.error("Could not create the student account:", createError.message);
    return respond({ error: createError.message }, 400);
  }

  return respond({ id: createdUser.user.id, email: createdUser.user.email }, 201);
});
