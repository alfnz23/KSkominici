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
        type,
        customer_id,
        inspection_address,
        inspection_date,
        company_id,
        customers!inner (
          email,
          name
        ),
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

    // Rozdělit joby podle typu
    const inspectionJobs = (jobs || []).filter((j: any) => j.type === 'inspection');
    const passportJobs = (jobs || []).filter((j: any) => j.type === 'passport');

    // 1. Zpracovat INSPECTION jobs (single reports) - normálně
    for (const job of inspectionJobs) {
      try {
        const report = job.reports?.[0];
        const reportData = report?.data || {};
        const customerEmail = job.customers?.email || reportData.customerEmail;

        const nextInspectionDate = reportData.nextInspectionDate ||
          new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1));

        const daysUntilExpiration = Math.ceil(
          (new Date(nextInspectionDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilExpiration === 14) {
          const { data: existingNotification } = await supabase
            .from('email_outbox')
            .select('id')
            .eq('job_id', job.id)
            .eq('subject', `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`)
            .single();

          if (existingNotification) continue;

          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'info@vase-firma.cz',
            to: [customerEmail],
            subject: `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #FFC107; padding: 20px; border-radius: 5px 5px 0 0;">
                  <h2 style="color: #fff; margin: 0;">⚠️ Upozornění na blížící se kontrolu</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0;">
                  <p>Dobrý den <strong>${reportData.customerName || ''}</strong>,</p>
                  <p>upozorňujeme Vás, že <strong>za 14 dní</strong> Vám vyprší platnost kontroly spalinové cesty.</p>
                  <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>Adresa:</strong> ${job.inspection_address}<br>
                    <strong>Poslední kontrola:</strong> ${new Date(job.inspection_date).toLocaleDateString('cs-CZ')}<br>
                    <strong>Platnost vyprší:</strong> ${new Date(nextInspectionDate).toLocaleDateString('cs-CZ')}
                  </div>
                  <p>S pozdravem,<br><strong>${reportData.technicianName || ''}</strong></p>
                </div>
              </div>
            `,
          });

          await supabase.from('email_outbox').insert({
            company_id: job.company_id,
            job_id: job.id,
            to_email: customerEmail,
            subject: `Upozornění: Blíží se termín kontroly - ${job.inspection_address}`,
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          notificationsSent.push({ job_id: job.id, customer_email: customerEmail });
        }
      } catch (error) {
        console.error(`Error for job ${job.id}:`, error);
        errors.push({ job_id: job.id, error: String(error) });
      }
    }

    // 2. Zpracovat PASSPORT jobs - seskupit podle zákazníka
    const passportsByCustomer = passportJobs.reduce((acc: any, job: any) => {
      const customerId = job.customer_id;
      if (!acc[customerId]) {
        acc[customerId] = {
          customer: job.customers,
          passports: []
        };
      }
      acc[customerId].passports.push(job);
      return acc;
    }, {});

    // Pro každého zákazníka: zkontrolovat VŠECHNY jeho pasporty a poslat 1 email
    for (const [customerId, data] of Object.entries(passportsByCustomer) as any) {
      try {
        const { customer, passports } = data;
        const expiringPassports = [];

        // Zkontrolovat každý pasport
        for (const job of passports) {
          const reports = job.reports || [];
          const expiringUnits = [];

          // Zkontrolovat každou jednotku v pasportu
          for (const report of reports) {
            const reportData = report.data || {};
            const nextInspectionDate = reportData.nextInspectionDate ||
              new Date(new Date(job.inspection_date).setFullYear(new Date(job.inspection_date).getFullYear() + 1));

            const daysUntilExpiration = Math.ceil(
              (new Date(nextInspectionDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiration === 14) {
              expiringUnits.push({
                unitNumber: reportData.unitNumber || '?',
                address: reportData.inspectionAddress || job.inspection_address,
                nextDate: nextInspectionDate
              });
            }
          }

          if (expiringUnits.length > 0) {
            expiringPassports.push({
              job_id: job.id,
              building: job.inspection_address,
              units: expiringUnits
            });
          }
        }

        // Pokud nějaké pasporty/jednotky vyprší → poslat 1 email
        if (expiringPassports.length > 0) {
          // Zkontrolovat jestli už email nebyl poslán
          const { data: existingNotification } = await supabase
            .from('email_outbox')
            .select('id')
            .eq('to_email', customer.email)
            .eq('subject', `Upozornění: Vyprší platnost pasportů`)
            .gte('sent_at', new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString()) // posledních 24h
            .single();

          if (existingNotification) continue;

          // Sestavit HTML se seznamem budov a jednotek
          const buildingsHtml = expiringPassports.map(p => `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
              <strong>${p.building}</strong><br>
              <span style="color: #666;">Jednotky: ${p.units.map((u: any) => u.unitNumber).join(', ')}</span><br>
              <span style="color: #666;">Vyprší: ${new Date(p.units[0].nextDate).toLocaleDateString('cs-CZ')}</span>
            </div>
          `).join('');

          await resend.emails.send({
            from: process.env.EMAIL_FROM || 'info@vase-firma.cz',
            to: [customer.email],
            subject: `Upozornění: Vyprší platnost pasportů`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #FFC107; padding: 20px; border-radius: 5px 5px 0 0;">
                  <h2 style="color: #fff; margin: 0;">⚠️ Upozornění - vyprší platnost pasportů</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #e0e0e0;">
                  <p>Dobrý den <strong>${customer.name}</strong>,</p>
                  <p>upozorňujeme Vás, že <strong>za 14 dní</strong> vyprší platnost kontrol v následujících budovách:</p>
                  ${buildingsHtml}
                  <p>Doporučujeme objednat si novou kontrolu co nejdříve.</p>
                  <p>S pozdravem</p>
                </div>
              </div>
            `,
          });

          // Uložit notifikaci
          await supabase.from('email_outbox').insert({
            company_id: expiringPassports[0].job_id.company_id,
            job_id: null, // null protože email je za více jobů
            to_email: customer.email,
            subject: `Upozornění: Vyprší platnost pasportů`,
            payload: { type: 'passport_expiration', passports: expiringPassports },
            status: 'sent',
            sent_at: new Date().toISOString(),
          });

          notificationsSent.push({
            customer_id: customerId,
            customer_email: customer.email,
            passports_count: expiringPassports.length
          });
        }
      } catch (error) {
        console.error(`Error for customer ${customerId}:`, error);
        errors.push({ customer_id: customerId, error: String(error) });
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
