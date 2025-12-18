import { handleOptions } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { requireUser } from "../_shared/auth.ts";
import { json, badRequest, serverError } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return badRequest("Use POST");
    const sb = supabaseClient(req);
    await requireUser(sb);

    const body = await req.json();
    const { report_id } = body ?? {};
    if (!report_id) return badRequest("report_id is required");

    const { data: updated, error } = await sb
      .from("reports")
      .update({ status: "finalized" })
      .eq("id", report_id)
      .select("id, job_id, status")
      .single();

    if (error) return serverError("Finalize failed", error);
    return json({ report: updated });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});