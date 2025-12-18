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
    const { job_id, filename, base64 } = body ?? {};
    if (!job_id || !filename || !base64) return badRequest("job_id, filename, base64 required");

    const { data: job, error: jobErr } = await sb.from("jobs").select("id, company_id").eq("id", job_id).single();
    if (jobErr) return serverError("Job load failed", jobErr);

    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `${job.company_id}/${job.id}/${crypto.randomUUID()}-${filename}`;

    const { error: upErr } = await sb.storage.from("invoices").upload(path, bytes, {
      contentType: "application/pdf",
      upsert: true,
    });
    if (upErr) return serverError("Invoice upload failed", upErr);

    const { data: doc, error: docErr } = await sb
      .from("documents")
      .insert({
        company_id: job.company_id,
        job_id: job.id,
        report_id: null,
        type: "invoice",
        storage_path: path,
        filename,
        mime_type: "application/pdf",
      })
      .select("*")
      .single();
    if (docErr) return serverError("Document insert failed", docErr);

    return json({ document: doc });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});