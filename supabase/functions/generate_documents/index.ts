import { handleOptions } from "../_shared/cors.ts";
import { supabaseClient } from "../_shared/supabase.ts";
import { requireUser } from "../_shared/auth.ts";
import { json, badRequest, serverError } from "../_shared/http.ts";

function fakePdfBytes(payload: unknown): Uint8Array {
  // Placeholder: reálné PDF sem doplníš později (např. HTML->PDF).
  const text = `PDF PLACEHOLDER\n\n${JSON.stringify(payload, null, 2)}`;
  return new TextEncoder().encode(text);
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  try {
    if (req.method !== "POST") return badRequest("Use POST");
    const sb = supabaseClient(req);
    await requireUser(sb);

    const body = await req.json();
    const { report_id, formats } = body ?? {};
    if (!report_id) return badRequest("report_id is required");

    const wanted: string[] = Array.isArray(formats) && formats.length ? formats : ["pdf"];

    const { data: report, error: repErr } = await sb
      .from("reports")
      .select("id, company_id, job_id, report_kind, sequence_no, data, status")
      .eq("id", report_id)
      .single();
    if (repErr) return serverError("Report load failed", repErr);
    if (report.status !== "finalized") return badRequest("Report must be finalized first");

    const createdDocs: any[] = [];

    if (wanted.includes("pdf")) {
      const bytes = fakePdfBytes(report);
      const filename = `report-${report.id}.pdf`;
      const path = `${report.company_id}/${report.job_id}/${report.id}/${filename}`;

      const { error: upErr } = await sb.storage.from("documents").upload(path, bytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) return serverError("Storage upload failed", upErr);

      const { data: doc, error: docErr } = await sb
        .from("documents")
        .insert({
          company_id: report.company_id,
          job_id: report.job_id,
          report_id: report.id,
          type: "pdf",
          storage_path: path,
          filename,
          mime_type: "application/pdf",
        })
        .select("*")
        .single();
      if (docErr) return serverError("Document insert failed", docErr);

      createdDocs.push(doc);
    }

    // XLSX: zatím placeholder vynechán (přidáš později)
    return json({ documents: createdDocs });
  } catch (e) {
    return serverError("Unhandled error", String(e));
  }
});.xlsx`
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      } else {
        continue
      }

      // Uložíme do Storage
      const storagePath = `reports/${reportData.company_id}/${filename}`
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(storagePath, fileBuffer, {
          contentType: mimeType,
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      // Zapíšeme do documents tabulky
      const { data: document, error: docError } = await supabase
        .from('documents')
        .insert({
          company_id: reportData.company_id,
          job_id: reportData.job_id,
          report_id: reportData.id,
          filename,
          storage_path: storagePath,
          mime_type: mimeType,
          type: 'report'
        })
        .select()
        .single()

      if (docError) {
        console.error('Document insert error:', docError)
        continue
      }

      documentIds.push(document.id)
      
      // Získáme signed URL pro stažení
      const { data: signedUrl } = await supabase.storage
        .from('documents')
        .createSignedUrl(storagePath, 3600) // 1 hodina

      if (signedUrl?.signedUrl) {
        downloadPaths.push(signedUrl.signedUrl)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_ids: documentIds,
        download_paths: downloadPaths,
        generated_formats: formats
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generatePDF(report: ReportWithRelations): jsPDF {
  const doc = new jsPDF()
  
  // Hlavička
  doc.setFontSize(20)
  doc.text('Zpráva o práci', 20, 20)
  
  doc.setFontSize(12)
  doc.text(`Číslo zprávy: ${report.sequence_no}`, 20, 35)
  doc.text(`Datum vytvoření: ${new Date(report.created_at).toLocaleDateString('cs-CZ')}`, 20, 45)
  doc.text(`Status: ${report.status}`, 20, 55)
  
  // Informace o společnosti
  if (report.companies) {
    doc.text('Společnost:', 20, 75)
    doc.text(`${report.companies.name}`, 30, 85)
    if (report.companies.ico) doc.text(`IČO: ${report.companies.ico}`, 30, 95)
    if (report.companies.dic) doc.text(`DIČ: ${report.companies.dic}`, 30, 105)
    if (report.companies.address) doc.text(`Adresa: ${report.companies.address}`, 30, 115)
  }
  
  // Informace o zákazníkovi
  if (report.jobs?.customers) {
    doc.text('Zákazník:', 20, 135)
    doc.text(`${report.jobs.customers.name}`, 30, 145)
    if (report.jobs.customers.email) doc.text(`Email: ${report.jobs.customers.email}`, 30, 155)
    if (report.jobs.customers.phone) doc.text(`Telefon: ${report.jobs.customers.phone}`, 30, 165)
    if (report.jobs.customers.address) doc.text(`Adresa: ${report.jobs.customers.address}`, 30, 175)
  }
  
  // Informace o práci
  if (report.jobs) {
    doc.text('Práce:', 20, 195)
    doc.text(`Typ: ${report.jobs.type}`, 30, 205)
    doc.text(`Status: ${report.jobs.status}`, 30, 215)
    if (report.jobs.scheduled_at) {
      doc.text(`Naplánováno: ${new Date(report.jobs.scheduled_at).toLocaleDateString('cs-CZ')}`, 30, 225)
    }
    if (report.jobs.notes) {
      doc.text('Poznámky:', 30, 235)
      const splitNotes = doc.splitTextToSize(report.jobs.notes, 150)
      doc.text(splitNotes, 30, 245)
    }
  }
  
  // Data ze zprávy
  if (report.data) {
    let yPos = 270
    doc.text('Data zprávy:', 20, yPos)
    yPos += 10
    
    const dataText = JSON.stringify(report.data, null, 2)
    const splitData = doc.splitTextToSize(dataText, 170)
    doc.text(splitData, 20, yPos)
  }
  
  return doc
}

function generateXLSX(report: ReportWithRelations): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()
  
  // Základní informace
  const basicInfo = [
    ['Číslo zprávy', report.sequence_no],
    ['ID zprávy', report.id],
    ['Druh zprávy', report.report_kind],
    ['Status', report.status],
    ['Datum vytvoření', new Date(report.created_at).toLocaleDateString('cs-CZ')],
    [''],
    ['Společnost', ''],
    ['Název', report.companies?.name || ''],
    ['IČO', report.companies?.ico || ''],
    ['DIČ', report.companies?.dic || ''],
    ['Adresa', report.companies?.address || ''],
    ['Telefon', report.companies?.phone || ''],
    ['Email', report.companies?.email || ''],
    [''],
    ['Zákazník', ''],
    ['Název', report.jobs?.customers?.name || ''],
    ['Email', report.jobs?.customers?.email || ''],
    ['Telefon', report.jobs?.customers?.phone || ''],
    ['Adresa', report.jobs?.customers?.address || ''],
    [''],
    ['Práce', ''],
    ['Typ', report.jobs?.type || ''],
    ['Status', report.jobs?.status || ''],
    ['Naplánováno', report.jobs?.scheduled_at ? new Date(report.jobs.scheduled_at).toLocaleDateString('cs-CZ') : ''],
    ['Poznámky', report.jobs?.notes || '']
  ]
  
  const worksheet = XLSX.utils.aoa_to_sheet(basicInfo)
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Základní informace')
  
  // Data ze zprávy
  if (report.data && typeof report.data === 'object') {
    const dataEntries = Object.entries(report.data).map(([key, value]) => [
      key,
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    ])
    
    const dataWorksheet = XLSX.utils.aoa_to_sheet([
      ['Klíč', 'Hodnota'],
      ...dataEntries
    ])
    XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Data zprávy')
  }
  
  return workbook
}