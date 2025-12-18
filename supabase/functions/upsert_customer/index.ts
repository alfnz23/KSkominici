import { handleOptions } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { requireUser, getProfile } from "../_shared/auth.ts";
import { json, badRequest, serverError } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return badRequest("Use POST");
    const sb = supabaseClient(req);
    const user = await requireUser(sb);
    const profile = await getProfile(sb, user.id);

    const body = await req.json();
    const { email, name, phone, address } = body ?? {};
    if (!email) return badRequest("email is required");

    const { data, error } = await sb
      .from("customers")
      .upsert(
        { company_id: profile.company_id, email, name: name ?? null, phone: phone ?? null, address: address ?? null },
        { onConflict: "company_id,email" },
      )
      .select("*")
      .single();

    if (error) return serverError("Upsert failed", error);
    return json({ customer: data });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});