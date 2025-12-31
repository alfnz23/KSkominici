import ExcelJS from 'exceljs';

interface ReportData {
  customerName: string;
  companyOrPersonName: string;
  customerEmail: string;
  permanentAddress: string;
  inspectionAddress: string;
  customerPhone?: string;
  inspectionDate: string;
  nextInspectionDate?: string;
  technicianName: string;
  technicianIco?: string;
  technicianAddress?: string;
  chimneyType: string;
  chimneyDescription?: string;
  flue?: string;
  flueType?: string;
  condition: string;
  defectsFound?: string;
  defectRemovalDate?: string;
  recommendations?: string;
  appliances: Array<{
    type: string;
    manufacturer: string;
    power: string;
    location: string;
    floor: string;
  }>;
}

export async function generateReportXLSX(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Protokol');

  // Nastavení pro tisk na A4 - optimalizace pro čitelnost
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: false,
    scale: 95, // Mírně zvýšeno pro lepší čitelnost textu
    margins: {
      left: 0.5,
      right: 0.5,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
    showGridLines: false,
    horizontalCentered: true,
  };

  // Definice sloupců (celkem cca 85-90 jednotek pro A4)
  worksheet.columns = [
    { width: 30 },  // Sloupec A - Labely
    { width: 30 },  // Sloupec B - Hodnoty
    { width: 12 },  // Sloupec C - Krátké labely (tel, podlaží)
    { width: 18 },  // Sloupec D - Hodnoty
  ];

  let row = 1;

  // Styly
  const borderMedium = {
    top: { style: 'medium' as const },
    left: { style: 'medium' as const },
    right: { style: 'medium' as const },
    bottom: { style: 'medium' as const },
  };
  const borderThin = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
  };
  const bgGray = {
    type: 'pattern' as const,
    pattern: 'solid' as const,
    fgColor: { argb: 'F2F2F2' },
  };

  // HLAVIČKA
  worksheet.mergeCells(`A${row}:D${row}`);
  const headerCell = worksheet.getCell(`A${row}`);
  headerCell.value = 'ZPRÁVA O KONTROLE A ČIŠTĚNÍ SPALINOVÉ CESTY';
  headerCell.font = { size: 14, bold: true, name: 'Arial' };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = { top: { style: 'medium' }, left: { style: 'medium' }, right: { style: 'medium' } };
  worksheet.getRow(row).height = 25;
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const subtitleCell = worksheet.getCell(`A${row}`);
  subtitleCell.value = `podle vyhlášky č. 34/2016 Sb.`;
  subtitleCell.font = { size: 10, italic: true, name: 'Arial' };
  subtitleCell.alignment = { horizontal: 'center' };
  subtitleCell.border = { left: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } };
  row++;

  row++; // Mezera

  // FIRMA (Zjednodušený blok)
  worksheet.mergeCells(`A${row}:D${row}`);
  const compCell = worksheet.getCell(`A${row}`);
  compCell.value = 'ZHOTOVITEL / TECHNIK';
  compCell.font = { bold: true, size: 10 };
  compCell.fill = bgGray;
  row++;

  const techInfo = [
    `Firma: KS Kominíci.cz`,
    `Technik: ${data.technicianName}`,
    `Adresa: ${data.technicianAddress || ''}`,
    `IČO: ${data.technicianIco || ''}`
  ];

  techInfo.forEach(text => {
    worksheet.mergeCells(`A${row}:D${row}`);
    const c = worksheet.getCell(`A${row}`);
    c.value = text;
    c.font = { size: 10 };
    c.alignment = { indent: 1 };
    row++;
  });

  row++; // Mezera

  // TABULKA ZÁKAZNÍK
  const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);

  const addRow = (label: string, value: string, isSplit: boolean = false, label2: string = '', value2: string = '') => {
    const r = worksheet.getRow(row);
    r.height = 20;

    const c1 = worksheet.getCell(`A${row}`);
    c1.value = label;
    c1.font = { bold: true, size: 9 };
    c1.border = borderThin;
    c1.alignment = { vertical: 'middle', indent: 1 };

    if (!isSplit) {
      worksheet.mergeCells(`B${row}:D${row}`);
      const c2 = worksheet.getCell(`B${row}`);
      c2.value = value;
      c2.font = { size: 10 };
      c2.border = borderThin;
      c2.alignment = { vertical: 'middle', indent: 1 };
    } else {
      const c2 = worksheet.getCell(`B${row}`);
      c2.value = value;
      c2.border = borderThin;
      c2.alignment = { vertical: 'middle', indent: 1 };

      const c3 = worksheet.getCell(`C${row}`);
      c3.value = label2;
      c3.font = { bold: true, size: 9 };
      c3.border = borderThin;
      c3.alignment = { vertical: 'middle', indent: 1 };

      const c4 = worksheet.getCell(`D${row}`);
      c4.value = value2;
      c4.border = borderThin;
      c4.alignment = { vertical: 'middle', indent: 1 };
    }
    row++;
  };

  addRow('Zákazník:', data.customerName);
  addRow('Subjekt:', data.companyOrPersonName);
  addRow('E-mail:', data.customerEmail, true, 'Tel:', data.customerPhone || '');
  addRow('Adresa objektu:', data.inspectionAddress, true, 'Podlaží:', validAppliances[0]?.floor || '');
  addRow('Datum kontroly:', new Date(data.inspectionDate).toLocaleDateString('cs-CZ'));

  row++; // Mezera

  // SPOTŘEBIČ A CESTA
  worksheet.mergeCells(`A${row}:D${row}`);
  const sectionHeader = worksheet.getCell(`A${row}`);
  sectionHeader.value = 'TECHNICKÁ SPECIFIKACE';
  sectionHeader.font = { bold: true };
  sectionHeader.fill = bgGray;
  row++;

  if (validAppliances.length > 0) {
    const app = validAppliances[0];
    addRow('Spotřebič:', app.type, true, 'Výkon:', app.power);
    addRow('Výrobce:', app.manufacturer, true, 'Umístění:', app.location);
  }
  addRow('Typ komínu:', data.chimneyType);
  addRow('Kouřovod:', data.flueType || 'Nezadáno');

  row++; // Mezera

  // NEDOSTATKY
  const addTextSection = (title: string, content: string, minHeight: number = 40) => {
    worksheet.mergeCells(`A${row}:D${row}`);
    const t = worksheet.getCell(`A${row}`);
    t.value = title;
    t.font = { bold: true, size: 10 };
    t.fill = bgGray;
    t.border = borderThin;
    row++;

    worksheet.mergeCells(`A${row}:D${row}`);
    const v = worksheet.getCell(`A${row}`);
    v.value = content || 'Nebyly zjištěny žádné nedostatky.';
    v.font = { size: 10 };
    v.alignment = { wrapText: true, vertical: 'top', indent: 1 };
    v.border = borderThin;
    worksheet.getRow(row).height = minHeight;
    row++;
  };

  addTextSection('ZJIŠTĚNÉ NEDOSTATKY:', data.defectsFound || '');
  
  // ZÁVĚR
  addTextSection('ZÁVĚR / DOPORUČENÍ:', `${data.condition}. ${data.recommendations || ''}`, 50);

  row++; // Mezera

  // PODPISY
  const lastRow = worksheet.getRow(row);
  worksheet.getCell(`A${row}`).value = `Vystavil: ${data.technicianName}`;
  worksheet.getCell(`D${row}`).value = `Podpis: ...........................`;
  worksheet.getCell(`D${row}`).alignment = { horizontal: 'right' };
  row++;
  worksheet.getCell(`A${row}`).value = `Dne: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`;

  // Print area
  worksheet.pageSetup.printArea = `A1:D${row}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
