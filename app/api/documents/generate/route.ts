import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReportPDF } from '@/lib/pdf/report-generator';
import { generateReportXLSX } from '@/lib/xlsx/report-generator';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, full_name, technician_ico, technician_address')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { job_id, report_id } = body;

    if (!job_id || !report_id) {
      return NextResponse.json(
        { error: 'job_id and report_id are required' },
        { status: 400 }
      );
    }

    // Načíst report data
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('data')
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Přidat IČO a adresu technika do reportData
    const reportData = {
      ...report.data,
      technicianIco: profile.technician_ico,
      technicianAddress: profile.technician_address,
    };

    // Vygenerovat PDF
    const pdfBuffer = await generateReportPDF(reportData);
    const pdfFilename = `zprava-${crypto.randomUUID()}-${Date.now()}.pdf`;
    const pdfPath = `${profile.company_id}/${job_id}/${pdfFilename}`;

    const { error: pdfUploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError);
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 });
    }

    // Uložit PDF metadata
    const { error: pdfDocError } = await supabase.from('documents').insert({
      company_id: profile.company_id,
      job_id,
      report_id,
      filename: pdfFilename,
      mime_type: 'application/pdf',
      storage_path: pdfPath,
      type: 'pdf',
    });

    if (pdfDocError) {
      console.error('PDF metadata error:', pdfDocError);
    }

    // Vygenerovat XLSX
    const xlsxBuffer = await generateReportXLSX(reportData);
    const xlsxFilename = `zprava-${crypto.randomUUID()}-${Date.now()}.xlsx`;
    const xlsxPath = `${profile.company_id}/${job_id}/${xlsxFilename}`;

    const { error: xlsxUploadError } = await supabase.storage
      .from('documents')
      .upload(xlsxPath, xlsxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: false,
      });

    if (xlsxUploadError) {
      console.error('XLSX upload error:', xlsxUploadError);
      return NextResponse.json({ error: 'Failed to upload XLSX' }, { status: 500 });
    }

    // Uložit XLSX metadata
    const { error: xlsxDocError } = await supabase.from('documents').insert({
      company_id: profile.company_id,
      job_id,
      report_id,
      filename: xlsxFilename,
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      storage_path: xlsxPath,
      type: 'xlsx',
    });

    if (xlsxDocError) {
      console.error('XLSX metadata error:', xlsxDocError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Documents generated successfully',
        pdf_path: pdfPath,
        xlsx_path: xlsxPath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating documents:', error);
    return NextResponse.json(
      { error: 'Failed to generate documents', details: String(error) },
      { status: 500 }
    );
  }
}
