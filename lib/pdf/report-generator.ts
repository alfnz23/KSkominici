import PDFDocument from 'pdfkit';

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
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Hlavička
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('PROTOKOL O KONTROLE', { align: 'center' });
      
      doc
        .fontSize(16)
        .text('SPALINOVÉ CESTY', { align: 'center' })
        .moveDown();

      // Údaje o zákazníkovi
      doc.fontSize(12).font('Helvetica-Bold').text('ÚDAJE O ZÁKAZNÍKOVI');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Jméno a příjmení: ${data.customerName}`);
      doc.text(`Email: ${data.customerEmail}`);
      if (data.customerPhone) {
        doc.text(`Telefon: ${data.customerPhone}`);
      }
      if (data.permanentAddress) {
        doc.text(`Adresa trvalého bydliště: ${data.permanentAddress}`);
      }
      doc.moveDown();

      // Údaje o kontrole
      doc.fontSize(12).font('Helvetica-Bold').text('ÚDAJE O KONTROLE');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Adresa kontrolovaného objektu: ${data.inspectionAddress}`);
      doc.text(`Datum kontroly: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`);
      if (data.nextInspectionDate) {
        doc.text(`Datum příští kontroly: ${new Date(data.nextInspectionDate).toLocaleDateString('cs-CZ')}`);
      }
      doc.text(`Kontrolu provedl: ${data.technicianName}`);
      doc.moveDown();

      // Technické údaje
      doc.fontSize(12).font('Helvetica-Bold').text('TECHNICKÉ ÚDAJE');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Typ komína: ${data.chimneyType}`);
      if (data.chimneyHeight) {
        doc.text(`Výška komína: ${data.chimneyHeight} m`);
      }
      doc.text(`Stav: ${data.condition}`);
      doc.moveDown();

      if (data.defectsFound) {
        doc.fontSize(12).font('Helvetica-Bold').text('ZJIŠTĚNÉ ZÁVADY');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(data.defectsFound);
        doc.moveDown();
      }

      if (data.recommendations) {
        doc.fontSize(12).font('Helvetica-Bold').text('DOPORUČENÍ');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica').text(data.recommendations);
        doc.moveDown();
      }

      // Spotřebiče
      if (data.appliances && data.appliances.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold').text('PŘIPOJENÉ SPOTŘEBIČE');
        doc.moveDown(0.5);

        data.appliances.forEach((appliance, index) => {
          if (appliance.type || appliance.manufacturer) {
            doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. Spotřebič:`);
            doc.fontSize(10).font('Helvetica');
            if (appliance.type) doc.text(`  Typ: ${appliance.type}`);
            if (appliance.manufacturer) doc.text(`  Výrobce: ${appliance.manufacturer}`);
            if (appliance.power) doc.text(`  Výkon: ${appliance.power}`);
            if (appliance.serialNumber) doc.text(`  Výrobní číslo: ${appliance.serialNumber}`);
            doc.moveDown(0.5);
          }
        });
      }

      // Patička
      doc.moveDown(2);
      doc.fontSize(8).font('Helvetica').text(
        `Dokument vygenerován: ${new Date().toLocaleDateString('cs-CZ')} ${new Date().toLocaleTimeString('cs-CZ')}`,
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
