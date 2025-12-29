import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const passportId = params.id;

    // Načíst job (pasport)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', passportId)
      .eq('type', 'passport')
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Passport not found' }, { status: 404 });
    }

    // Načíst všechny reports (byty) pro tento pasport
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .eq('job_id', passportId)
      .order('created_at', { ascending: true });

    if (reportsError) {
      console.error('Reports error:', reportsError);
      return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }

    // Načíst PDF dokumenty pro pasport
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('job_id', passportId)
      .order('created_at', { ascending: false });

    // Generovat signed URLs pro dokumenty
    let pdfUrl = null;
    let xlsxUrl = null;

    if (documents && documents.length > 0) {
      for (const doc of documents) {
        if (doc.file_path) {
          const { data: signedData } = await supabase
            .storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hodina

          if (signedData?.signedUrl) {
            if (doc.file_path.endsWith('.pdf')) {
              pdfUrl = signedData.signedUrl;
            } else if (doc.file_path.endsWith('.xlsx')) {
              xlsxUrl = signedData.signedUrl;
            }
          }
        }
      }
    }

    // Formátovat data jednotlivých bytů
    const units = (reports || []).map((report) => {
      const reportData = report.data || {};
      return {
        id: report.id,
        unitNumber: reportData.unitNumber || reportData.companyOrPersonName || '',
        customerName: reportData.companyOrPersonName || reportData.customerName || '',
        email: reportData.customerEmail || '',
        phone: reportData.customerPhone || '',
        inspectionDate: reportData.inspectionDate || job.inspection_date,
        condition: reportData.condition || '',
        reportData: reportData, // Celá data pro obnovení
      };
    });

    const passport = {
      id: job.id,
      buildingAddress: job.inspection_address,
      inspectionDate: job.inspection_date,
      status: job.status,
      units,
      pdfUrl,
      xlsxUrl,
    };

    return NextResponse.json({ passport }, { status: 200 });
  } catch (error) {
    console.error('Error fetching passport detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
