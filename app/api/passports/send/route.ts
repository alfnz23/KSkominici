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
      .select('company_id, email, full_name')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Načíst job (pasport)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('type', 'passport')
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    // Načíst všechny reports (jednotky) pro tento pasport
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (reportsError || !reports || reports.length === 0) {
      return NextResponse.json({ error: 'No units found in passport' }, { status: 404 });
    }

    // Načíst dokumenty pro tento pasport
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', jobId)
      .in('type', ['pdf', 'xlsx'])
      .order('created_at', { ascending: false });

    if (docsError || !documents || documents.length === 0) {
      return NextResponse.json({ 
        error: 'No documents found. Please generate documents first.' 
      }, { status: 404 });
    }

    // Stáhnout soubory ze storage a připravit přílohy
    const attachments = [];
    
    for (const doc of documents) {
      if (!doc.storage_path) continue;

      const { data: fileData, error: downloadError } = await supabase.storage
        .from('documents')
        .download(doc.storage_path);

      if (downloadError || !fileData) {
        console.error('Download error:', downloadError);
        continue;
      }

      const buffer = await fileData.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      attachments.push({
        filename: doc.filename,
        content: base64,
      });
    }

    if (attachments.length === 0) {
      return NextResponse.json({ 
        error: 'Could not download documents' 
      }, { status: 500 });
    }

    // Připravit email
    const buildingAddress = job.inspection_address || 'Neznámá adresa';
    const unitsCount = reports.length;
    const inspectionDate = new Date(job.inspection_date).toLocaleDateString('cs-CZ');

    const emailSubject = `Pasport budovy - ${buildingAddress}`;
    const emailText = `
Dobrý den,

zasíláme Vám pasport budovy:

Adresa: ${buildingAddress}
Počet jednotek: ${unitsCount}
Datum kontroly: ${inspectionDate}

Dokumenty naleznete v příloze.

S pozdravem,
${profile.full_name || 'Technik'}
    `.trim();

    // Odeslat email TECHNIKOVI
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'KSkominici <noreply@kskominici.com>',
      to: profile.email,
      subject: emailSubject,
      text: emailText,
      attachments,
    });

    if (emailError) {
      console.error('Email error:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send email',
        details: emailError 
      }, { status: 500 });
    }

    // Aktualizovat status jobu
    await supabase
      .from('jobs')
      .update({ status: 'sent' })
      .eq('id', jobId);

    return NextResponse.json({ 
      success: true, 
      message: 'Passport sent successfully',
      emailId: emailData?.id 
    });

  } catch (error) {
    console.error('Error in passport send:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
