import { handleOptions } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { requireUser } from "../_shared/auth.ts";
import { json, badRequest, serverError } from "../_shared/http.ts";

async function sendEmailPlaceholder(_: { to: string; cc?: string; subject: string; text: string }) {
  // Sem dosadíš Resend/SMTP. Skeleton drží jen kontrakt.
  return { provider_message_id: `stub_${crypto.randomUUID()}` };
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return badRequest("Use POST");
    const sb = supabaseClient(req);
    await requireUser(sb);

    const body = await req.json();
    const { job_id, report_id, to_email, cc_email } = body ?? {};
    if (!job_id || !report_id || !to_email) return badRequest("job_id, report_id, to_email required");

    const { data: docs, error: docsErr } = await sb
      .from("documents")
      .select("id, storage_path, type")
      .eq("job_id", job_id)
      .eq("report_id", report_id)
      .eq("type", "pdf");

    if (docsErr) return serverError("Load documents failed", docsErr);
    if (!docs?.length) return badRequest("No PDF document found for report");

    const subject = "Kominická zpráva / protokol";
    const text = "V příloze / nebo přes odkaz (zatím placeholder).";

    const sendRes = await sendEmailPlaceholder({ to: to_email, cc: cc_email, subject, text });

    const { error: outErr } = await sb.from("email_outbox").insert({
      // company_id doplníme přes job
      company_id: (await sb.from("jobs").select("company_id").eq("id", job_id).single()).data?.company_id,
      job_id,
      to_email,
      cc_email: cc_email ?? null,
      subject,
      payload: { report_id, documents: docs },
      status: "sent",
      provider_message_id: sendRes.provider_message_id,
      sent_at: new Date().toISOString(),
    });
    if (outErr) return serverError("Outbox insert failed", outErr);

    await sb.from("jobs").update({ status: "sent" }).eq("id", job_id);

    return json({ ok: true, provider_message_id: sendRes.provider_message_id });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});