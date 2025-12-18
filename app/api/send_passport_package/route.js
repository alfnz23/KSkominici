import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request) {
  try {
    const { job_id, to_email, cc_email } = await request.json();

    if (!job_id || !to_email) {
      return NextResponse.json(
        { error: 'job_id and to_email are required' },
        { status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Collect all report PDFs for the job
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', job_id)
      .eq('status', 'completed');

    if (reportsError) {
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      );
    }

    // Check for invoice existence
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('job_id', job_id)
      .single();

    // Allow sending without invoice if explicitly configured
    const allowWithoutInvoice = process.env.ALLOW_SEND_WITHOUT_INVOICE === 'true';
    
    if (!invoice && !allowWithoutInvoice) {
      return NextResponse.json(
        { error: 'Invoice required but not found' },
        { status: 400 }
      );
    }

    // Setup email transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Prepare email attachments
    const attachments = [];
    
    // Add report PDFs
    for (const report of reports) {
      if (report.pdf_path) {
        try {
          const pdfPath = path.join(process.cwd(), 'public', report.pdf_path);
          if (fs.existsSync(pdfPath)) {
            attachments.push({
              filename: `${report.report_type}_${report.id}.pdf`,
              path: pdfPath,
            });
          }
        } catch (error) {
          console.error(`Failed to attach report ${report.id}:`, error);
        }
      }
    }

    // Add invoice PDF if exists
    if (invoice && invoice.pdf_path) {
      try {
        const invoicePath = path.join(process.cwd(), 'public', invoice.pdf_path);
        if (fs.existsSync(invoicePath)) {
          attachments.push({
            filename: `invoice_${invoice.id}.pdf`,
            path: invoicePath,
          });
        }
      } catch (error) {
        console.error(`Failed to attach invoice ${invoice.id}:`, error);
      }
    }

    // Prepare email content
    const emailSubject = `Passport Package - Job #${job_id}`;
    const emailText = `
Dear Client,

Please find attached your complete passport package for Job #${job_id}.

Package includes:
${reports.map(r => `- ${r.report_type} Report`).join('\n')}
${invoice ? '- Invoice' : ''}

Best regards,
KS Kominici Team
    `.trim();

    const emailHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6;">
  <h2>Passport Package - Job #${job_id}</h2>
  
  <p>Dear Client,</p>
  
  <p>Please find attached your complete passport package for Job #${job_id}.</p>
  
  <h3>Package includes:</h3>
  <ul>
    ${reports.map(r => `<li>${r.report_type} Report</li>`).join('')}
    ${invoice ? '<li>Invoice</li>' : ''}
  </ul>
  
  <p>Best regards,<br>
  KS Kominici Team</p>
</div>
    `;

    // Send email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: to_email,
      cc: cc_email || undefined,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      attachments: attachments,
    };

    const emailResult = await transporter.sendMail(mailOptions);

    // Log to email_outbox
    const { error: outboxError } = await supabase
      .from('email_outbox')
      .insert({
        job_id: job_id,
        to_email: to_email,
        cc_email: cc_email || null,
        subject: emailSubject,
        body: emailText,
        attachments_count: attachments.length,
        sent_at: new Date().toISOString(),
        email_provider_id: emailResult.messageId,
        status: 'sent'
      });

    if (outboxError) {
      console.error('Failed to log email to outbox:', outboxError);
    }

    // Update job status to sent/archived
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'sent',
        completed_at: new Date().toISOString()
      })
      .eq('id', job_id);

    if (updateError) {
      console.error('Failed to update job status:', updateError);
      return NextResponse.json(
        { error: 'Email sent but failed to update job status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Passport package sent successfully',
      email_id: emailResult.messageId,
      attachments_sent: attachments.length,
      reports_included: reports.length,
      invoice_included: !!invoice
    });

  } catch (error) {
    console.error('Error sending passport package:', error);
    return NextResponse.json(
      { error: 'Failed to send passport package' },
      { status: 500 }
    );
  }
}