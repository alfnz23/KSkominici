import ExcelJS from 'exceljs';

interface ReportData {
  customerName: string;
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
  chimneyHeight?: string;
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

  worksheet.columns = [
    { width: 30 },
    { width: 50 },
  ];

  let row = 1;

  // Hlavička
  worksheet.mergeCells(`A${row}:B${row}`);
  const headerCell = worksheet.getCell(`A${row}`);
  headerCell.value = 'ZPRÁVA';
  headerCell.font = { size: 14, bold: true };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'thin' },
  };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  const subtitleCell = worksheet.getCell(`A${row}`);
  subtitleCell.value = 'o provedení kontroly a čištění spalinové cesty';
  subtitleCell.font = { size: 11 };
  subtitleCell.alignment = { horizontal: 'center' };
  subtitleCell.border = {
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' },
  };
  row++;
  row++; // Prázdný řádek

  // Informace o firmě
  worksheet.getCell(`A${row}`).value = 'KS Kominíci.cz';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 11 };
  row++;

  worksheet.getCell(`A${row}`).value = data.technicianName;
  row++;

  if (data.technicianAddress) {
    worksheet.getCell(`A${row}`).value = data.technicianAddress;
    row++;
  }

  if (data.technicianIco) {
    worksheet.getCell(`A${row}`).value = `IČO odborně způsobilé osoby: ${data.technicianIco}`;
    row++;
  }

  row++; // Prázdný řádek

  // Údaje o zákazníkovi - tabulka
  const addTableRow = (label: string, value: string, hasBottomBorder = true) => {
    const labelCell = worksheet.getCell(`A${row}`);
    labelCell.value = label;
    labelCell.font = { bold: true };
    labelCell.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
      top: row === 9 ? { style: 'thin' } : undefined,
      bottom: hasBottomBorder ? { style: 'thin' } : undefined,
    };

    const valueCell = worksheet.getCell(`B${row}`);
    valueCell.value = value;
    valueCell.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
      top: row === 9 ? { style: 'thin' } : undefined,
      bottom: hasBottomBorder ? { style: 'thin' } : undefined,
    };
    row++;
  };

  addTableRow('Jméno zákazníka:', data.customerName);
  addTableRow(
    'Kontakt zákazníka (email):',
    `${data.customerEmail} | tel: ${data.customerPhone || ''}`
  );

  if (data.permanentAddress) {
    addTableRow('Sídlo firmy/Bydliště:', data.permanentAddress);
  }

  const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);
  addTableRow(
    'Adresa kontrolovaného objektu:',
    `${data.inspectionAddress} | Podlaží: ${validAppliances[0]?.floor || ''}`
  );
  addTableRow(
    'Datum provedení kontroly:',
    new Date(data.inspectionDate).toLocaleDateString('cs-CZ'),
    false
  );

  row++; // Prázdný řádek

  // SPOTŘEBIČ
  if (validAppliances.length > 0) {
    worksheet.getCell(`A${row}`).value = 'SPOTŘEBIČ:';
    worksheet.getCell(`A${row}`).font = { bold: true };
    worksheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    row++;

    const appliance = validAppliances[0];
    addTableRow('Druh:', appliance.type || '');
    addTableRow('Typ:', appliance.manufacturer || '');
    addTableRow('Výkon:', appliance.power || '');
    addTableRow('Umístění:', appliance.location || '', false);

    row++;
  }

  // SPECIFICKÉ SPALINOVÉ CESTY
  worksheet.getCell(`A${row}`).value = 'SPECIFICKÉ SPALINOVÉ CESTY:';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  row++;

  let chimneyDesc = data.chimneyType;
  if (data.chimneyDescription) {
    chimneyDesc += '\n' + data.chimneyDescription;
  }
  addTableRow('Komín:', chimneyDesc);

  if (data.flue) {
    let flueDesc = data.flueType || '';
    if (data.flue) {
      flueDesc += (flueDesc ? '\n' : '') + data.flue;
    }
    addTableRow('Kouřovod:', flueDesc, false);
  }

  row++;

  // Zjištěné nedostatky odstraněné
  worksheet.mergeCells(`A${row}:B${row}`);
  const defectsRemovedLabel = worksheet.getCell(`A${row}`);
  defectsRemovedLabel.value = 'ZJIŠTĚNÉ NEDOSTATKY, KTERÉ BYLY ODSTRANĚNY NA MÍSTĚ:';
  defectsRemovedLabel.font = { bold: true };
  defectsRemovedLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  const defectsRemovedValue = worksheet.getCell(`A${row}`);
  defectsRemovedValue.value =
    data.condition !== 'Vyhovující' && data.defectsFound ? data.defectsFound : '';
  defectsRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 30;
  row++;
  row++;

  // Zjištěné nedostatky neodstraněné
  worksheet.mergeCells(`A${row}:B${row}`);
  const defectsNotRemovedLabel = worksheet.getCell(`A${row}`);
  defectsNotRemovedLabel.value = 'ZJIŠTĚNÉ NEDOSTATKY, KTERÉ NEBYLY ODSTRANĚNY NA MÍSTĚ:';
  defectsNotRemovedLabel.font = { bold: true };
  defectsNotRemovedLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  const defectsNotRemovedValue = worksheet.getCell(`A${row}`);
  defectsNotRemovedValue.value =
    data.condition !== 'Vyhovující' && data.defectsFound ? data.defectsFound : '';
  defectsNotRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 30;
  row++;
  row++;

  // Termín odstranění
  if (data.defectRemovalDate) {
    worksheet.mergeCells(`A${row}:B${row}`);
    const removalDateLabel = worksheet.getCell(`A${row}`);
    removalDateLabel.value = 'TERMÍN ODSTRANĚNÍ NEDOSTATKŮ:';
    removalDateLabel.font = { bold: true };
    removalDateLabel.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    row++;

    worksheet.mergeCells(`A${row}:B${row}`);
    const removalDateValue = worksheet.getCell(`A${row}`);
    removalDateValue.value = new Date(data.defectRemovalDate).toLocaleDateString('cs-CZ');
    removalDateValue.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    row++;
    row++;
  }

  // Poznámka - pokud vyhovující
  if (data.condition === 'Vyhovující') {
    worksheet.mergeCells(`A${row}:B${row}`);
    const noteLabel = worksheet.getCell(`A${row}`);
    noteLabel.value = 'POZNÁMKA:';
    noteLabel.font = { bold: true };
    noteLabel.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    row++;

    worksheet.mergeCells(`A${row}:B${row}`);
    const noteValue = worksheet.getCell(`A${row}`);
    noteValue.value = `Spalinová cesta je čistá a vyhovuje bezpečnému provozu\n${data.recommendations || ''}`;
    noteValue.alignment = { wrapText: true };
    noteValue.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    worksheet.getRow(row).height = 30;
    row++;
    row++;
  }

  // Podpis
  row++;
  worksheet.getCell(`A${row}`).value = `Kontrolu provedl: ${data.technicianName}`;
  row++;
  worksheet.getCell(`A${row}`).value = `Dne: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`;
  worksheet.getCell(`B${row}`).value = `V: ${data.technicianAddress?.split(',')[1] || ''}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
