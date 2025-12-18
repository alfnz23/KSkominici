import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export class PassportService {
  static async sendPassportPackage(jobId, toEmail, ccEmail = null) {
    try {
      const response = await fetch('/api/send_passport_package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId,
          to_email: toEmail,
          cc_email: ccEmail
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send passport package');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending passport package:', error);
      throw error;
    }
  }

  static async getJobPackageStatus(jobId) {
    try {
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;

      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id, report_type, status, pdf_path')
        .eq('job_id', jobId);

      if (reportsError) throw reportsError;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, pdf_path, status')
        .eq('job_id', jobId)
        .single();

      const { data: emailHistory, error: emailError } = await supabase
        .from('email_outbox')
        .select('*')
        .eq('job_id', jobId)
        .order('sent_at', { ascending: false });

      return {
        job,
        reports: reports || [],
        invoice: invoice || null,
        emailHistory: emailHistory || [],
        readyToSend: this.isReadyToSend(reports, invoice)
      };

    } catch (error) {
      console.error('Error getting job package status:', error);
      throw error;
    }
  }

  static isReadyToSend(reports, invoice) {
    const completedReports = reports.filter(r => r.status === 'completed' && r.pdf_path);
    const hasInvoice = invoice && invoice.pdf_path;
    const allowWithoutInvoice = process.env.ALLOW_SEND_WITHOUT_INVOICE === 'true';
    
    return completedReports.length > 0 && (hasInvoice || allowWithoutInvoice);
  }

  static async getPackageFiles(jobId) {
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('reports')
        .select('id, report_type, pdf_path, created_at')
        .eq('job_id', jobId)
        .eq('status', 'completed')
        .not('pdf_path', 'is', null);

      if (reportsError) throw reportsError;

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, pdf_path, created_at')
        .eq('job_id', jobId)
        .not('pdf_path', 'is', null)
        .single();

      const files = [
        ...reports.map(report => ({
          type: 'report',
          id: report.id,
          name: `${report.report_type}_${report.id}.pdf`,
          path: report.pdf_path,
          created_at: report.created_at
        }))
      ];

      if (invoice) {
        files.push({
          type: 'invoice',
          id: invoice.id,
          name: `invoice_${invoice.id}.pdf`,
          path: invoice.pdf_path,
          created_at: invoice.created_at
        });
      }

      return files;

    } catch (error) {
      console.error('Error getting package files:', error);
      throw error;
    }
  }
}