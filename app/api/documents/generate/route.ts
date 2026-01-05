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

    // ============================================
    // SMAZAT STARÉ DOCUMENTS (pokud existují)
    // ============================================
    console.log('🗑️ Mažu staré documents pro report:', report_id);
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('report_id', report_id);
    
    if (deleteError) {
      console.warn('⚠️ Chyba při mazání starých documents:', deleteError);
    } else {
      console.log('✅ Staré documents smazány');
    }

    // ============================================
    // VYTVOŘ UNIKÁTNÍ NÁZEV SOUBORU
    // ============================================
    const customerName = reportData.customerName || 'Zakaznik';
    const unitNumber = reportData.unitNumber || '';
    const inspectionDate = reportData.inspectionDate || new Date().toISOString().split('T')[0];
    
    // Vyčistit jméno (odstranit diakritiku a speciální znaky)
    const cleanName = customerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // odstranit diakritiku
      .replace(/[^a-zA-Z0-9]/g, '_')   // speciální znaky na _
      .replace(/_+/g, '_')              // vícenásobné _ na jedno
      .substring(0, 30);                // max 30 znaků

    // Vyčistit číslo jednotky
    const cleanUnit = unitNumber
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 10);

    // Pokud je unitNumber → přidat do názvu (pro pasporty)
    const baseFilename = cleanUnit 
      ? `Zprava_${cleanName}_${cleanUnit}_${inspectionDate}`
      : `Zprava_${cleanName}_${inspectionDate}`;
    // ============================================

    // Vygenerovat PDF
    const pdfBuffer = await generateReportPDF(reportData);
    const pdfFilename = `${baseFilename}.pdf`;
    const pdfPath = `${profile.company_id}/${job_id}/${pdfFilename}`;

    const { error: pdfUploadError } = await supabase.storage
      .from('documents')
      .upload(pdfPath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Přepsat pokud existuje
      });

    if (pdfUploadError) {
      console.error('PDF upload error:', pdfUploadError);
      return NextResponse.json({ error: 'Failed to upload PDF', details: pdfUploadError }, { status: 500 });
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
    const xlsxFilename = `${baseFilename}.xlsx`;
    const xlsxPath = `${profile.company_id}/${job_id}/${xlsxFilename}`;

    const { error: xlsxUploadError } = await supabase.storage
      .from('documents')
      .upload(xlsxPath, xlsxBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true, // Přepsat pokud existuje
      });

    if (xlsxUploadError) {
      console.error('XLSX upload error:', xlsxUploadError);
      return NextResponse.json({ error: 'Failed to upload XLSX', details: xlsxUploadError }, { status: 500 });
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
