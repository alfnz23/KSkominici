import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, email')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { job_id, report_id, to_email } = body;

    if (!job_id || !report_id || !to_email) {
      return NextResponse.json(
        { error: 'job_id, report_id, and to_email are required' },
        { status: 400 }
      );
    }

    // Načíst dokumenty
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', job_id)
      .eq('report_id', report_id)
      .in('type', ['pdf', 'xlsx']);

    if (docsError || !documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found' },
        { status: 404 }
      );
    }

    // Načíst data zprávy
    const { data: report } = await supabase
      .from('reports')
      .select('data')
      .eq('id', report_id)
      .single();

    const reportData = report?.data || {};

    // Stáhnout soubory ze storage
    const allAttachments = await Promise.all(
      documents.map(async (doc) => {
        const { data: file } = await supabase.storage
          .from('documents')
          .download(doc.storage_path);

        if (!file) return null;

        const buffer = await file.arrayBuffer();
        return {
          filename: doc.filename,
          content: Buffer.from(buffer),
          type: doc.type,
        };
      })
    );

    const validAttachments = allAttachments.filter((a) => a !== null);

    if (validAttachments.length === 0) {
      return NextResponse.json(
        { error: 'Failed to download documents' },
        { status: 500 }
      );
    }

    // Pouze PDF pro zákazníka
    const customerAttachments = validAttachments.filter(a => a.type === 'pdf');

    // PDF + XLSX pro technika
    const technicianAttachments = validAttachments;

    // Zjistit jestli je "Na fakturu" (invoiceOnly)
    const invoiceOnly = reportData.invoiceOnly === true;

    // 1. Email zákazníkovi (jen PDF) - POUZE pokud NENÍ "Na fakturu"
    let customerEmailData = null;
    if (!invoiceOnly) {
      customerEmailData = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@kskominici.com',
      to: [to_email],
      subject: `Protokol o kontrole spalinové cesty - ${reportData.inspectionAddress || ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E67E22;">Protokol o kontrole spalinové cesty</h2>
          
          <p>Dobrý den,</p>
          
          <p>v příloze zasíláme protokol o provedené kontrole spalinové cesty.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Údaje o kontrole:</strong><br>
            <strong>Adresa objektu:</strong> ${reportData.inspectionAddress || 'N/A'}<br>
            <strong>Datum kontroly:</strong> ${reportData.inspectionDate ? new Date(reportData.inspectionDate).toLocaleDateString('cs-CZ') : 'N/A'}<br>
            ${reportData.nextInspectionDate ? `<strong>Příští kontrola:</strong> ${new Date(reportData.nextInspectionDate).toLocaleDateString('cs-CZ')}<br>` : ''}
            <strong>Stav:</strong> <span style="color: ${reportData.condition === 'Vyhovující' ? '#27AE60' : '#E74C3C'};">${reportData.condition || 'N/A'}</span>
          </div>
          
          ${reportData.defectsFound ? `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
              <strong>Zjištěné závady:</strong><br>
              ${reportData.defectsFound}
            </div>
          ` : ''}
          
          ${reportData.recommendations ? `
            <div style="background-color: #d1ecf1; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
              <strong>Doporučení:</strong><br>
              ${reportData.recommendations}
            </div>
          ` : ''}
          
          <p>V případě dotazů nás neváhejte kontaktovat.</p>
          
          <p style="margin-top: 30px;">
            S pozdravem,<br>
            <strong>${reportData.technicianName || 'Váš technik'}</strong>
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
          
          <p style="font-size: 12px; color: #666;">
            Tento email byl vygenerován automaticky systémem evidence kontrol.
          </p>
        </div>
      `,
      attachments: customerAttachments,
    });
    }

    // 2. Email technikovi (PDF + XLSX) - použít přihlášeného uživatele
    // Pokud "Na fakturu" → vždy poslat technikovi
    // Jinak → poslat jen pokud email technika != email zákazníka
    if (profile.email && (invoiceOnly || profile.email !== to_email)) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@kskominici.com',
        to: [profile.email],
        subject: invoiceOnly 
          ? `Protokol - NA FAKTURU - ${reportData.customerName || to_email}`
          : `Protokol odeslán - ${reportData.customerName || to_email}`,
        html: invoiceOnly ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #E67E22;">Protokol - NA FAKTURU</h2>
            <p style="background-color: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <strong>⚠️ Tento protokol je označen jako "NA FAKTURU"</strong><br>
              Zákazník <strong>NEDOSTAL</strong> email s protokolem.<br>
              Po úhradě faktury zašlete dokumenty manuálně.
            </p>
            <p>V příloze naleznete dokumenty (PDF + XLSX).</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Zákazník:</strong> ${reportData.customerName}<br>
              <strong>Email:</strong> ${to_email}<br>
              <strong>Adresa:</strong> ${reportData.inspectionAddress}<br>
              <strong>Datum kontroly:</strong> ${reportData.inspectionDate ? new Date(reportData.inspectionDate).toLocaleDateString('cs-CZ') : 'N/A'}
            </div>
          </div>
        ` : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Protokol byl úspěšně odeslán</h2>
            <p>Protokol byl odeslán zákazníkovi: <strong>${to_email}</strong></p>
            <p>V příloze naleznete kopii dokumentů (PDF + XLSX).</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <strong>Zákazník:</strong> ${reportData.customerName}<br>
              <strong>Adresa:</strong> ${reportData.inspectionAddress}<br>
              <strong>Datum kontroly:</strong> ${reportData.inspectionDate ? new Date(reportData.inspectionDate).toLocaleDateString('cs-CZ') : 'N/A'}
            </div>
          </div>
        `,
        attachments: technicianAttachments,
      });
    }

    // Uložit informaci o odeslaném emailu
    await supabase.from('email_outbox').insert({
      company_id: profile.company_id,
      job_id,
      to_email,
      cc_email: profile.email || null,
      subject: `Protokol o kontrole spalinové cesty - ${reportData.inspectionAddress || ''}`,
      payload: { report_id, documents: documents.map((d) => d.id), invoice_only: invoiceOnly },
      status: 'sent',
      provider_message_id: customerEmailData?.data?.id ?? null,
      sent_at: new Date().toISOString(),
    });

    // Aktualizovat status jobu
    await supabase
      .from('jobs')
      .update({ status: 'sent' })
      .eq('id', job_id);

    return NextResponse.json(
      {
        success: true,
        message: invoiceOnly 
          ? 'Email odeslán pouze technikovi (NA FAKTURU)'
          : 'Email byl úspěšně odeslán',
        email_id: customerEmailData?.data?.id || null,
        invoice_only: invoiceOnly,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: String(error) },
      { status: 500 }
    );
  }
}
