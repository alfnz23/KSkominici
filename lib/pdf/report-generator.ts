import jsPDF from 'jspdf';

interface ReportData {
  customerName: string;
  customerEmail: string;
  permanentAddress: string;
  inspectionAddress: string;
  customerPhone?: string;
  inspectionDate: string;
  nextInspectionDate?: string;
  technicianName: string;
  chimneyType: string;
  chimneyHeight?: string;
  chimneyDescription?: string;
  flue?: string;
  condition: string;
  defectsFound?: string;
  recommendations?: string;
  appliances: Array<{
    type: string;
    manufacturer: string;
    power: string;
    serialNumber: string;
  }>;
}

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  try {
    const doc = new jsPDF();
    let y = 20;

    // Hlavička
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PROTOKOL O KONTROLE', 105, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(16);
    doc.text('SPALINOVÉ CESTY', 105, y, { align: 'center' });
    y += 15;

    // Údaje o zákazníkovi
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ÚDAJE O ZÁKAZNÍKOVI', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Jméno a příjmení: ${data.customerName}`, 20, y);
    y += 6;
    doc.text(`Email: ${data.customerEmail}`, 20, y);
    y += 6;
    
    if (data.customerPhone) {
      doc.text(`Telefon: ${data.customerPhone}`, 20, y);
      y += 6;
    }
    
    if (data.permanentAddress) {
      doc.text(`Adresa trvalého bydliště: ${data.permanentAddress}`, 20, y);
      y += 6;
    }
    y += 5;

    // Údaje o kontrole
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ÚDAJE O KONTROLE', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Adresa kontrolovaného objektu: ${data.inspectionAddress}`, 20, y);
    y += 6;
    doc.text(`Datum kontroly: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`, 20, y);
    y += 6;
    
    if (data.nextInspectionDate) {
      doc.text(`Datum příští kontroly: ${new Date(data.nextInspectionDate).toLocaleDateString('cs-CZ')}`, 20, y);
      y += 6;
    }
    
    doc.text(`Kontrolu provedl: ${data.technicianName}`, 20, y);
    y += 10;

    // Technické údaje
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICKÉ ÚDAJE', 20, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Typ komína: ${data.chimneyType}`, 20, y);
    y += 6;
    
    if (data.chimneyHeight) {
      doc.text(`Výška komína: ${data.chimneyHeight} m`, 20, y);
      y += 6;
    }
    
    if (data.chimneyDescription) {
      const descLines = doc.splitTextToSize(`Popis spalinové cesty: ${data.chimneyDescription}`, 170);
      doc.text(descLines, 20, y);
      y += descLines.length * 6;
    }
    
    if (data.flue) {
      const flueLines = doc.splitTextToSize(`Kouřovod: ${data.flue}`, 170);
      doc.text(flueLines, 20, y);
      y += flueLines.length * 6;
    }
    
    doc.text(`Stav: ${data.condition}`, 20, y);
    y += 10;

    // Zjištěné závady
    if (data.defectsFound) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ZJIŠTĚNÉ ZÁVADY', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const defectLines = doc.splitTextToSize(data.defectsFound, 170);
      doc.text(defectLines, 20, y);
      y += defectLines.length * 6 + 5;
    }

    // Doporučení
    if (data.recommendations) {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DOPORUČENÍ', 20, y);
      y += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const recLines = doc.splitTextToSize(data.recommendations, 170);
      doc.text(recLines, 20, y);
      y += recLines.length * 6 + 5;
    }

    // Spotřebiče
    if (data.appliances && data.appliances.length > 0) {
      const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);
      
      if (validAppliances.length > 0) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PŘIPOJENÉ SPOTŘEBIČE', 20, y);
        y += 8;

        validAppliances.forEach((appliance, index) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`${index + 1}. Spotřebič:`, 20, y);
          y += 6;
          
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          if (appliance.type) {
            doc.text(`  Typ: ${appliance.type}`, 20, y);
            y += 6;
          }
          if (appliance.manufacturer) {
            doc.text(`  Výrobce: ${appliance.manufacturer}`, 20, y);
            y += 6;
          }
          if (appliance.power) {
            doc.text(`  Výkon: ${appliance.power}`, 20, y);
            y += 6;
          }
          if (appliance.serialNumber) {
            doc.text(`  Výrobní číslo: ${appliance.serialNumber}`, 20, y);
            y += 6;
          }
          y += 3;
        });
      }
    }

    // Patička
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Dokument vygenerován: ${new Date().toLocaleDateString('cs-CZ')} ${new Date().toLocaleTimeString('cs-CZ')}`,
      105,
      285,
      { align: 'center' }
    );

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}
