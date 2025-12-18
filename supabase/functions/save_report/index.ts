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
    const { job_id, report_id, report_kind, sequence_no, data } = body ?? {};

    if (!job_id) return badRequest("job_id is required");
    if (!report_kind) return badRequest("report_kind is required");
    if (typeof data !== "object" || data === null) return badRequest("data must be an object");

    if (!report_id) {
      const { data: created, error } = await sb
        .from("reports")
        .insert({
          company_id: profile.company_id,
          job_id,
          report_kind,
          sequence_no: sequence_no ?? 1,
          data,
          status: "draft",
          created_by: user.id,
        })
        .select("id, job_id, status")
        .single();
      if (error) return serverError("Insert failed", error);
      return json({ report: created });
    } else {
      const { data: updated, error } = await sb
        .from("reports")
        .update({ data })
        .eq("id", report_id)
        .select("id, job_id, status")
        .single();
      if (error) return serverError("Update failed", error);
      return json({ report: updated });
    }
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});