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
      .select('company_id')
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

    // Načtení zprávy
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .eq('job_id', job_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generování PDF
    const pdfBuffer = await generateReportPDF(report.data);
    const pdfFilename = `zprava-${report_id}-${Date.now()}.pdf`;
    const pdfPath = `${profile.company_id}/${job_id}/${pdfFilename}`;

    const { error: pdfUploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Uložení PDF do databáze
    const { data: pdfDoc, error: pdfDocError } = await supabase
      .from('documents')
      .insert({
        company_id: profile.company_id,
        job_id,
        report_id,
        type: 'pdf',
        storage_path: pdfPath,
        filename: pdfFilename,
        mime_type: 'application/pdf',
      })
      .select()
      .single();

    if (pdfDocError) {
      console.error('PDF doc insert error:', pdfDocError);
    }

    // Generování XLSX
    const xlsxBuffer = await generateReportXLSX(report.data);
    const xlsxFilename = `zprava-${report_id}-${Date.now()}.xlsx`;
    const xlsxPath = `${profile.company_id}/${job_id}/${xlsxFilename}`;

    const { error: xlsxUploadError } = await supabase.storage
      .from('documents')
      .upload(xlsxPath, xlsxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      });

    if (xlsxUploadError) {
      console.error('XLSX upload error:', xlsxUploadError);
    }

    // Uložení XLSX do databáze
    const { data: xlsxDoc, error: xlsxDocError } = await supabase
      .from('documents')
      .insert({
        company_id: profile.company_id,
        job_id,
        report_id,
        type: 'xlsx',
        storage_path: xlsxPath,
        filename: xlsxFilename,
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      .select()
      .single();

    if (xlsxDocError) {
      console.error('XLSX doc insert error:', xlsxDocError);
    }

    // Aktualizace statusu zprávy
    await supabase
      .from('reports')
      .update({ status: 'generated' })
      .eq('id', report_id);

    return NextResponse.json(
      {
        success: true,
        documents: {
          pdf: pdfDoc,
          xlsx: xlsxDoc,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating documents:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
