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

  // Nastavení pro tisk na A4 - BEZ fitToPage (způsobuje "zdrclení")
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: false, // VYPNUTO - jinak se to scvrkne
    scale: 100, // 100% scale
    margins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    printTitlesRow: '1:1', // Opakovat hlavičku
    showGridLines: false, // Skrýt mřížku
  };

  // Nastavení pro zobrazení borderů při tisku
  worksheet.properties.defaultRowHeight = 15;

  worksheet.columns = [
    { width: 28 },
    { width: 48 },
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
  worksheet.getCell(`A${row}`).font = { bold: true, size: 13 };
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${row}:B${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = data.technicianName;
  worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
  worksheet.mergeCells(`A${row}:B${row}`);
  row++;

  if (data.technicianAddress) {
    worksheet.getCell(`A${row}`).value = data.technicianAddress;
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${row}:B${row}`);
    row++;
  }

  if (data.technicianIco) {
    worksheet.getCell(`A${row}`).value = `IČO odborně způsobilé osoby: ${data.technicianIco}`;
    worksheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    worksheet.mergeCells(`A${row}:B${row}`);
    row++;
  }

  row++; // Prázdný řádek

  // Údaje o zákazníkovi - tabulka
  const addTableRow = (label: string, value: string, hasBottomBorder = true, hasTopBorder = false) => {
    const labelCell = worksheet.getCell(`A${row}`);
    labelCell.value = label;
    labelCell.font = { bold: true };
    labelCell.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
      top: hasTopBorder ? { style: 'thin' } : undefined,
      bottom: hasBottomBorder ? { style: 'thin' } : undefined,
    };

    const valueCell = worksheet.getCell(`B${row}`);
    valueCell.value = value;
    valueCell.border = {
      left: { style: 'thin' },
      right: { style: 'thin' },
      top: hasTopBorder ? { style: 'thin' } : undefined,
      bottom: hasBottomBorder ? { style: 'thin' } : undefined,
    };
    row++;
  };

  addTableRow('Jméno zákazníka:', data.customerName, true, true);
  addTableRow('Název firmy / Jméno fyzické osoby:', data.companyOrPersonName);
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
    addTableRow('Druh:', appliance.type || '', true, true);
    addTableRow('Typ:', appliance.manufacturer || '');
    addTableRow('Výkon:', appliance.power || '');
    addTableRow('Umístění:', appliance.location || '', false);
  }

  // SPECIFIKACE SPALINOVÉ CESTY
  worksheet.getCell(`A${row}`).value = 'SPECIFIKACE SPALINOVÉ CESTY:';
  worksheet.getCell(`A${row}`).font = { bold: true };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  row++;

  let chimneyDesc = data.chimneyType;
  addTableRow('Komín:', chimneyDesc, true, true);

  if (data.chimneyDescription) {
    addTableRow('Popis:', data.chimneyDescription, !data.flue);
  }

  if (data.flue) {
    addTableRow('Kouřovod:', data.flueType || '', data.flue ? true : false);
    if (data.flue) {
      addTableRow('Popis:', data.flue, false);
    }
  }

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
    data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : '';
  defectsRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 15;
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
    data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : '';
  defectsNotRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 15;
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
  }

  // Klauzule
  worksheet.mergeCells(`A${row}:B${row}`);
  const disclaimerCell = worksheet.getCell(`A${row}`);
  disclaimerCell.value = 'Kontrola spal. cesty byla provedena výše uvedeného data vizuálně a s maximální možnou pečlivostí, ale bez demontáže stavebních konstrukcí a prvků, které komínové těleso/spalinovou cestu zakrývají. Z tohoto důvodu nejsem schopen a odmítám ručit za škody, provedení, závady, vzdálenosti hořlavých či tavných materiálů a důsledky z toho vyplývající v úsecích komínu/spalinové cesty, které nelze vizuálně zkontrolovat bez nutnosti odkrývání nebo demontáže stavebních konstrukcí, tapet, podlahových krytin, deskových podhledů a příček, obložení, elektroinstalace apod.';
  disclaimerCell.font = { size: 8 };
  disclaimerCell.alignment = { wrapText: true, vertical: 'top' };
  disclaimerCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 45;
  row++;

  // Závěr
  worksheet.mergeCells(`A${row}:B${row}`);
  const conclusionLabel = worksheet.getCell(`A${row}`);
  conclusionLabel.value = 'ZÁVĚR:';
  conclusionLabel.font = { bold: true };
  conclusionLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  row++;

  worksheet.mergeCells(`A${row}:B${row}`);
  const conclusionValue = worksheet.getCell(`A${row}`);
  conclusionValue.value = `${data.condition}\nSpalinová cesta vyhovuje bezpečnému provozu${data.recommendations ? '\n' + data.recommendations : ''}`;
  conclusionValue.alignment = { wrapText: true };
  conclusionValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 20;
  row++;

  // Podpis
  row++;
  worksheet.getCell(`A${row}`).value = `Kontrolu provedl: ${data.technicianName}`;
  row++;
  worksheet.getCell(`A${row}`).value = `Dne: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`;
  worksheet.getCell(`B${row}`).value = `V: ${data.technicianAddress?.split(',')[1] || ''}`;

  // Nastavení tisku
  worksheet.pageSetup.printArea = `A1:B${row}`;
  worksheet.pageSetup.horizontalCentered = true;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
