import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();
    let y = height - 50;

    // Hlavička
    page.drawText('PROTOKOL O KONTROLE', {
      x: 50,
      y,
      size: 20,
      font: fontBold,
    });
    y -= 25;
    
    page.drawText('SPALINOVÉ CESTY', {
      x: 50,
      y,
      size: 16,
      font: fontBold,
    });
    y -= 40;

    // Údaje o zákazníkovi
    page.drawText('ÚDAJE O ZÁKAZNÍKOVI', {
      x: 50,
      y,
      size: 14,
      font: fontBold,
    });
    y -= 20;

    page.drawText(`Jméno a příjmení: ${data.customerName}`, { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(`Email: ${data.customerEmail}`, { x: 50, y, size: 10, font });
    y -= 15;
    
    if (data.customerPhone) {
      page.drawText(`Telefon: ${data.customerPhone}`, { x: 50, y, size: 10, font });
      y -= 15;
    }
    
    if (data.permanentAddress) {
      page.drawText(`Adresa trvalého bydliště: ${data.permanentAddress}`, { x: 50, y, size: 10, font });
      y -= 15;
    }
    y -= 10;

    // Údaje o kontrole
    page.drawText('ÚDAJE O KONTROLE', {
      x: 50,
      y,
      size: 14,
      font: fontBold,
    });
    y -= 20;

    page.drawText(`Adresa kontrolovaného objektu: ${data.inspectionAddress}`, { x: 50, y, size: 10, font });
    y -= 15;
    page.drawText(`Datum kontroly: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`, { x: 50, y, size: 10, font });
    y -= 15;
    
    if (data.nextInspectionDate) {
      page.drawText(`Datum příští kontroly: ${new Date(data.nextInspectionDate).toLocaleDateString('cs-CZ')}`, { x: 50, y, size: 10, font });
      y -= 15;
    }
    
    page.drawText(`Kontrolu provedl: ${data.technicianName}`, { x: 50, y, size: 10, font });
    y -= 25;

    // Technické údaje
    page.drawText('TECHNICKÉ ÚDAJE', {
      x: 50,
      y,
      size: 14,
      font: fontBold,
    });
    y -= 20;

    page.drawText(`Typ komína: ${data.chimneyType}`, { x: 50, y, size: 10, font });
    y -= 15;
    
    if (data.chimneyHeight) {
      page.drawText(`Výška komína: ${data.chimneyHeight} m`, { x: 50, y, size: 10, font });
      y -= 15;
    }
    
    if (data.chimneyDescription) {
      const desc = wrapText(data.chimneyDescription, 90);
      page.drawText(`Popis spalinové cesty:`, { x: 50, y, size: 10, font });
      y -= 15;
      desc.forEach(line => {
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 15;
      });
    }
    
    if (data.flue) {
      const flueLines = wrapText(data.flue, 90);
      page.drawText(`Kouřovod:`, { x: 50, y, size: 10, font });
      y -= 15;
      flueLines.forEach(line => {
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 15;
      });
    }
    
    page.drawText(`Stav: ${data.condition}`, { x: 50, y, size: 10, font });
    y -= 25;

    if (data.defectsFound && y > 100) {
      page.drawText('ZJIŠTĚNÉ ZÁVADY', {
        x: 50,
        y,
        size: 14,
        font: fontBold,
      });
      y -= 20;
      
      const defectLines = wrapText(data.defectsFound, 90);
      defectLines.forEach(line => {
        if (y < 50) return;
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 15;
      });
      y -= 10;
    }

    if (data.recommendations && y > 100) {
      page.drawText('DOPORUČENÍ', {
        x: 50,
        y,
        size: 14,
        font: fontBold,
      });
      y -= 20;
      
      const recLines = wrapText(data.recommendations, 90);
      recLines.forEach(line => {
        if (y < 50) return;
        page.drawText(line, { x: 50, y, size: 10, font });
        y -= 15;
      });
      y -= 10;
    }

    // Spotřebiče
    if (data.appliances && data.appliances.length > 0 && y > 100) {
      const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);
      
      if (validAppliances.length > 0) {
        page.drawText('PŘIPOJENÉ SPOTŘEBIČE', {
          x: 50,
          y,
          size: 14,
          font: fontBold,
        });
        y -= 20;

        validAppliances.forEach((appliance, index) => {
          if (y < 50) return;
          page.drawText(`${index + 1}. Spotřebič:`, { x: 50, y, size: 11, font: fontBold });
          y -= 15;
          
          if (appliance.type && y > 50) {
            page.drawText(`  Typ: ${appliance.type}`, { x: 50, y, size: 10, font });
            y -= 15;
          }
          if (appliance.manufacturer && y > 50) {
            page.drawText(`  Výrobce: ${appliance.manufacturer}`, { x: 50, y, size: 10, font });
            y -= 15;
          }
          if (appliance.power && y > 50) {
            page.drawText(`  Výkon: ${appliance.power}`, { x: 50, y, size: 10, font });
            y -= 15;
          }
          if (appliance.serialNumber && y > 50) {
            page.drawText(`  Výrobní číslo: ${appliance.serialNumber}`, { x: 50, y, size: 10, font });
            y -= 15;
          }
          y -= 10;
        });
      }
    }

    // Patička
    page.drawText(
      `Dokument vygenerován: ${new Date().toLocaleDateString('cs-CZ')} ${new Date().toLocaleTimeString('cs-CZ')}`,
      { x: width / 2 - 100, y: 30, size: 8, font }
    );

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
}
