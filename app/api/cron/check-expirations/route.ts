import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Tento endpoint by měl být volán cron jobem (např. denně)
// Můžete použít Vercel Cron nebo jiný scheduler

export async function GET(request: NextRequest) {
  try {
    // Inicializace uvnitř funkce
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Ověření autorizace (můžete použít secret token)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const in14Days = new Date();
    in14Days.setDate(today.getDate() + 14);

    // Najít všechny zákazníky, kterým vyprší kontrola za 14 dní
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_email,
        inspection_address,
        inspection_date,
        company_id,
        reports (
          id,
          data
        )
      `)
      .eq('status', 'sent')
      .order('inspection_date', { ascending: false });

    if (jobsError) {
      console.error('Jobs fetch error:', jobsError);
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    const notificationsSent = [];
    const errors = [];

    for (const job of jobs || []) {
      try {
        const report = job.reports?.[0];
        const reportData = report?.data || {};

        // Vypočítat datum příští kontroly
        const nextInspectionDate = reportData.nextInspectionDate ||
          new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1));

        const daysUntilExpiration = Math.ceil(
          (new Date(nextInspectionDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Odeslat upozornění pokud zbývá přesně 14 dní
        if (daysUntilExpiration === 14) {
          // Zkontrolovat, zda už nebylo upozornění odesláno
          const { data: existingNotification } = await supabase
            .from('email_outbox')
            .select('id')
            .eq('job_id', job.id)
            .eq('subject', `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`)
            .single();

          if (existingNotification) {
            continue; // Už bylo odesláno
          }

          // Odeslat email
          const emailData = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'info@vase-firma.cz',
            to: [job.customer_email],
            subject: `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #FFC107; padding: 20px; border-radius: 5px 5px 0 0;">
                  <h2 style="color: #fff; margin: 0;">⚠️ Upozornění na blížící se kontrolu</h2>
                </div>
                
                <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 5px 5px;">
                  <p>Dobrý den <strong>${reportData.customerName || ''}</strong>,</p>
                  
                  <p>upozorňujeme Vás, že <strong>za 14 dní</strong> Vám vyprší platnost kontroly spalinové cesty.</p>
                  
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <strong>Údaje o kontrole:</strong><br>
                    <strong>Adresa objektu:</strong> ${job.inspection_address}<br>
                    <strong>Poslední kontrola:</strong> ${new Date(job.inspection_date).toLocaleDateString('cs-CZ')}<br>
                    <strong>Platnost vyprší:</strong> ${new Date(nextInspectionDate).toLocaleDateString('cs-CZ')}
                  </div>
                  
                  <p>Doporučujeme Vám objednat si novou kontrolu co nejdříve, aby nedošlo k vypršení platnosti.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="mailto:${process.env.EMAIL_FROM || 'info@vase-firma.cz'}" 
                       style="background-color: #E67E22; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                      Objednat kontrolu
                    </a>
                  </div>
                  
                  <p>V případě dotazů nás neváhejte kontaktovat.</p>
                  
                  <p style="margin-top: 30px;">
                    S pozdravem,<br>
                    <strong>${reportData.technicianName || 'Váš kominický tým'}</strong>
                  </p>
                </div>
                
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <p style="font-size: 12px; color: #666; text-align: center;">
                  Tento email byl vygenerován automaticky systémem upozornění.
                </p>
              </div>
            `,
          });

          // Uložit informaci o odeslaném upozornění
          await supabase.from('email_outbox').insert({
            company_id: job.company_id,
            job_id: job.id,
            to_email: job.customer_email,
            subject: `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`,
            payload: {
              type: 'expiration_reminder',
              days_until_expiration: 14,
              next_inspection_date: nextInspectionDate,
            },
            status: 'sent',
            provider_message_id: emailData.data?.id || null,
            sent_at: new Date().toISOString(),
          });

          notificationsSent.push({
            job_id: job.id,
            customer_email: job.customer_email,
            next_inspection_date: nextInspectionDate,
          });
        }
      } catch (error) {
        console.error(`Error sending notification for job ${job.id}:`, error);
        errors.push({
          job_id: job.id,
          error: String(error),
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        notifications_sent: notificationsSent.length,
        errors: errors.length,
        details: {
          sent: notificationsSent,
          errors,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in expiration check:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
