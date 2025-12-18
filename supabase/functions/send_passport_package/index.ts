import { handleOptions } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { requireUser } from "../_shared/auth.ts";
import { json, badRequest, serverError } from "../_shared/http.ts";

async function sendEmailPlaceholder(_: { to: string; cc?: string; subject: string; text: string }) {
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
    const { job_id, to_email, cc_email } = body ?? {};
    if (!job_id || !to_email) return badRequest("job_id, to_email required");

    const { data: job, error: jobErr } = await sb.from("jobs").select("id, company_id").eq("id", job_id).single();
    if (jobErr) return serverError("Job load failed", jobErr);

    const { data: pdfs, error: pdfErr } = await sb
      .from("documents")
      .select("id, storage_path, filename")
      .eq("job_id", job_id)
      .eq("type", "pdf");
    if (pdfErr) return serverError("Load PDFs failed", pdfErr);

    const { data: invoices, error: invErr } = await sb
      .from("documents")
      .select("id, storage_path, filename")
      .eq("job_id", job_id)
      .eq("type", "invoice");
    if (invErr) return serverError("Load invoices failed", invErr);

    // Volitelně: vyžadovat fakturu
    // if (!invoices?.length) return badRequest("Invoice required before sending passport package");

    const subject = "Pasport komínu – dokumentace";
    const text = "Dokumenty jsou připravené (zatím placeholder odeslání).";

    const sendRes = await sendEmailPlaceholder({ to: to_email, cc: cc_email, subject, text });

    const { error: outErr } = await sb.from("email_outbox").insert({
      company_id: job.company_id,
      job_id,
      to_email,
      cc_email: cc_email ?? null,
      subject,
      payload: { pdfs, invoices },
      status: "sent",
      provider_message_id: sendRes.provider_message_id,
      sent_at: new Date().toISOString(),
    });
    if (outErr) return serverError("Outbox insert failed", outErr);

    await sb.from("jobs").update({ status: "sent" }).eq("id", job_id);

    return json({ ok: true, provider_message_id: sendRes.provider_message_id, counts: { pdfs: pdfs?.length ?? 0, invoices: invoices?.length ?? 0 } });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});