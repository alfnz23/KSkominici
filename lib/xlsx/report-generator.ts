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

  // Nastavení pro tisk na A4 - SCALE 93% aby se to vešlo na 1 stránku!
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: false,
    scale: 93, // ZMENŠENO z 100% aby se to vešlo!
    margins: {
      left: 0.7,
      right: 0.7,
      top: 0.75,
      bottom: 0.75,
      header: 0.3,
      footer: 0.3,
    },
    showGridLines: false,
  };

  // 4 SLOUPCE - optimální šířky
  worksheet.columns = [
    { width: 28 },  // Sloupec A - široký pro dlouhé labely
    { width: 28 },  // Sloupec B
    { width: 15 },  // Sloupec C
    { width: 18 },  // Sloupec D
  ];

  // Výchozí výška řádků - KOMPAKTNÍ
  worksheet.properties.defaultRowHeight = 15;

  let row = 1;

  // ═══════════════════════════════════════════════════════
  // HLAVIČKA
  // ═══════════════════════════════════════════════════════
  
  worksheet.mergeCells(`A${row}:D${row}`);
  const headerCell = worksheet.getCell(`A${row}`);
  headerCell.value = 'ZPRÁVA';
  headerCell.font = { size: 15, bold: true, name: 'Arial' };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 18; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const subtitleCell = worksheet.getCell(`A${row}`);
  subtitleCell.value = 'o provedení kontroly a čištění spalinové cesty';
  subtitleCell.font = { size: 11, name: 'Arial' };
  subtitleCell.alignment = { horizontal: 'center' };
  subtitleCell.border = {
    left: { style: 'medium' },
    right: { style: 'medium' },
    bottom: { style: 'medium' },
  };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  // ═══════════════════════════════════════════════════════
  // INFORMACE O FIRMĚ
  // ═══════════════════════════════════════════════════════
  
  row++; // Prázdný řádek

  worksheet.mergeCells(`A${row}:D${row}`);
  const companyNameCell = worksheet.getCell(`A${row}`);
  companyNameCell.value = 'KS Kominíci.cz';
  companyNameCell.font = { size: 14, bold: true, name: 'Arial' };
  companyNameCell.alignment = { horizontal: 'center' };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const techNameCell = worksheet.getCell(`A${row}`);
  techNameCell.value = data.technicianName;
  techNameCell.font = { size: 10, name: 'Arial' };
  techNameCell.alignment = { horizontal: 'center' };
  row++;

  if (data.technicianAddress) {
    worksheet.mergeCells(`A${row}:D${row}`);
    const techAddressCell = worksheet.getCell(`A${row}`);
    techAddressCell.value = data.technicianAddress;
    techAddressCell.font = { size: 10, name: 'Arial' };
    techAddressCell.alignment = { horizontal: 'center' };
    row++;
  }

  if (data.technicianIco) {
    worksheet.mergeCells(`A${row}:D${row}`);
    const techIcoCell = worksheet.getCell(`A${row}`);
    techIcoCell.value = `IČO odborně způsobilé osoby: ${data.technicianIco}`;
    techIcoCell.font = { size: 10, name: 'Arial' };
    techIcoCell.alignment = { horizontal: 'center' };
    row++;
  }

  row++; // Prázdný řádek

  // ═══════════════════════════════════════════════════════
  // TABULKA ZÁKAZNÍK
  // ═══════════════════════════════════════════════════════

  const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);

  // Helper funkce - KOMPAKTNÍ VÝŠKY
  const addFullRow = (label: string, value: string, height: number = 15) => {
    worksheet.mergeCells(`A${row}:A${row}`);
    const labelCell = worksheet.getCell(`A${row}`);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 10, name: 'Arial' };
    labelCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    labelCell.alignment = { vertical: 'middle', wrapText: false };

    worksheet.mergeCells(`B${row}:D${row}`);
    const valueCell = worksheet.getCell(`B${row}`);
    valueCell.value = value;
    valueCell.font = { size: 10, name: 'Arial' };
    valueCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    valueCell.alignment = { vertical: 'middle' };
    worksheet.getRow(row).height = height;
    row++;
  };

  const addSplitRow = (label1: string, value1: string, label2: string, value2: string, height: number = 15) => {
    const cellA = worksheet.getCell(`A${row}`);
    cellA.value = label1;
    cellA.font = { bold: true, size: 10, name: 'Arial' };
    cellA.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    cellA.alignment = { vertical: 'middle', wrapText: false };

    const cellB = worksheet.getCell(`B${row}`);
    cellB.value = value1;
    cellB.font = { size: 10, name: 'Arial' };
    cellB.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    cellB.alignment = { vertical: 'middle' };

    const cellC = worksheet.getCell(`C${row}`);
    cellC.value = label2;
    cellC.font = { bold: true, size: 10, name: 'Arial' };
    cellC.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    cellC.alignment = { vertical: 'middle', wrapText: false };

    const cellD = worksheet.getCell(`D${row}`);
    cellD.value = value2;
    cellD.font = { size: 10, name: 'Arial' };
    cellD.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    cellD.alignment = { vertical: 'middle' };
    worksheet.getRow(row).height = height;
    row++;
  };

  addFullRow('Jméno zákazníka:', data.customerName, 17);
  addFullRow('Název firmy / Jméno fyzické osoby:', data.companyOrPersonName, 17);
  addSplitRow('Kontakt zákazníka (email):', data.customerEmail, 'tel:', data.customerPhone || '', 17);
  
  if (data.permanentAddress) {
    addFullRow('Sídlo firmy/Bydliště:', data.permanentAddress, 17);
  }

  addSplitRow('Adresa kontrolovaného objektu:', data.inspectionAddress, 'Podlaží:', validAppliances[0]?.floor || '', 17);
  addFullRow('Datum provedení kontroly:', new Date(data.inspectionDate).toLocaleDateString('cs-CZ'), 17);

  row++; // Prázdný řádek

  // ═══════════════════════════════════════════════════════
  // SPOTŘEBIČ
  // ═══════════════════════════════════════════════════════

  if (validAppliances.length > 0) {
    worksheet.mergeCells(`A${row}:D${row}`);
    const spotrebicHeader = worksheet.getCell(`A${row}`);
    spotrebicHeader.value = 'SPOTŘEBIČ:';
    spotrebicHeader.font = { bold: true, size: 11, name: 'Arial' };
    spotrebicHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    spotrebicHeader.alignment = { vertical: 'middle' };
    worksheet.getRow(row).height = 16; // Kompaktní
    row++;

    const appliance = validAppliances[0];
    
    addSplitRow('Druh:', appliance.type || '', 'Výkon:', appliance.power || '', 17);
    addSplitRow('Typ:', appliance.manufacturer || '', 'Umístění:', appliance.location || '', 17);

    row++; // Prázdný řádek
  }

  // ═══════════════════════════════════════════════════════
  // SPECIFIKACE SPALINOVÉ CESTY
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const specHeader = worksheet.getCell(`A${row}`);
  specHeader.value = 'SPECIFIKACE SPALINOVÉ CESTY:';
  specHeader.font = { bold: true, size: 11, name: 'Arial' };
  specHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  specHeader.alignment = { vertical: 'middle' };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  addFullRow('Komín:', data.chimneyType, 17);
  
  if (data.chimneyDescription) {
    addFullRow('Popis:', data.chimneyDescription, 17);
  }

  if (data.flue) {
    addFullRow('Kouřovod:', data.flueType || '', 17);
    if (data.flue) {
      addFullRow('Popis:', data.flue, 17);
    }
  }

  row++; // Prázdný řádek

  // ═══════════════════════════════════════════════════════
  // ZJIŠTĚNÉ NEDOSTATKY
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const defectsRemovedLabel = worksheet.getCell(`A${row}`);
  defectsRemovedLabel.value = 'ZJIŠTĚNÉ NEDOSTATKY, KTERÉ BYLY ODSTRANĚNY NA MÍSTĚ:';
  defectsRemovedLabel.font = { bold: true, size: 11, name: 'Arial' };
  defectsRemovedLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  defectsRemovedLabel.alignment = { vertical: 'middle' };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const defectsRemovedValue = worksheet.getCell(`A${row}`);
  defectsRemovedValue.value =
    data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : '';
  defectsRemovedValue.font = { size: 10, name: 'Arial' };
  defectsRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  defectsRemovedValue.alignment = { vertical: 'top', wrapText: true };
  worksheet.getRow(row).height = 15; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const defectsNotRemovedLabel = worksheet.getCell(`A${row}`);
  defectsNotRemovedLabel.value = 'ZJIŠTĚNÉ NEDOSTATKY, KTERÉ NEBYLY ODSTRANĚNY NA MÍSTĚ:';
  defectsNotRemovedLabel.font = { bold: true, size: 11, name: 'Arial' };
  defectsNotRemovedLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  defectsNotRemovedLabel.alignment = { vertical: 'middle' };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const defectsNotRemovedValue = worksheet.getCell(`A${row}`);
  defectsNotRemovedValue.value =
    data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : '';
  defectsNotRemovedValue.font = { size: 10, name: 'Arial' };
  defectsNotRemovedValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  defectsNotRemovedValue.alignment = { vertical: 'top', wrapText: true };
  worksheet.getRow(row).height = 15; // Kompaktní
  row++;

  // Termín odstranění
  if (data.defectRemovalDate) {
    worksheet.mergeCells(`A${row}:D${row}`);
    const removalDateLabel = worksheet.getCell(`A${row}`);
    removalDateLabel.value = 'TERMÍN ODSTRANĚNÍ NEDOSTATKŮ:';
    removalDateLabel.font = { bold: true, size: 11, name: 'Arial' };
    removalDateLabel.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    removalDateLabel.alignment = { vertical: 'middle' };
    worksheet.getRow(row).height = 16;
    row++;

    worksheet.mergeCells(`A${row}:D${row}`);
    const removalDateValue = worksheet.getCell(`A${row}`);
    removalDateValue.value = new Date(data.defectRemovalDate).toLocaleDateString('cs-CZ');
    removalDateValue.font = { size: 10, name: 'Arial' };
    removalDateValue.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
      bottom: { style: 'thin' },
    };
    removalDateValue.alignment = { vertical: 'middle' };
    worksheet.getRow(row).height = 15;
    row++;
  }

  // ═══════════════════════════════════════════════════════
  // KLAUZULE
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const disclaimerCell = worksheet.getCell(`A${row}`);
  disclaimerCell.value = 'Kontrola spal. cesty byla provedena výše uvedeného data vizuálně a s maximální možnou pečlivostí, ale bez demontáže stavebních konstrukcí a prvků, které komínové těleso/spalinovou cestu zakrývají. Z tohoto důvodu nejsem schopen a odmítám ručit za škody, provedení, závady, vzdálenosti hořlavých či tavných materiálů a důsledky z toho vyplývající v úsecích komínu/spalinové cesty, které nelze vizuálně zkontrolovat bez nutnosti odkrývání nebo demontáže stavebních konstrukcí, tapet, podlahových krytin, deskových podhledů a příček, obložení, elektroinstalace apod.';
  disclaimerCell.font = { size: 8, name: 'Arial' };
  disclaimerCell.alignment = { wrapText: true, vertical: 'top' };
  disclaimerCell.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 44; // KOMPAKTNÍ (bylo 50)
  row++;

  // ═══════════════════════════════════════════════════════
  // ZÁVĚR
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const conclusionLabel = worksheet.getCell(`A${row}`);
  conclusionLabel.value = 'ZÁVĚR:';
  conclusionLabel.font = { bold: true, size: 11, name: 'Arial' };
  conclusionLabel.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  conclusionLabel.alignment = { vertical: 'middle' };
  worksheet.getRow(row).height = 16; // Kompaktní
  row++;

  worksheet.mergeCells(`A${row}:D${row}`);
  const conclusionValue = worksheet.getCell(`A${row}`);
  conclusionValue.value = `${data.condition}\nSpalinová cesta vyhovuje bezpečnému provozu${data.recommendations ? '\n' + data.recommendations : ''}`;
  conclusionValue.font = { size: 10, name: 'Arial' };
  conclusionValue.alignment = { wrapText: true, vertical: 'top' };
  conclusionValue.border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 20; // KOMPAKTNÍ (bylo 24)
  row++;

  row++; // Prázdný řádek

  // ═══════════════════════════════════════════════════════
  // PODPIS
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:B${row}`);
  const signCell = worksheet.getCell(`A${row}`);
  signCell.value = `Kontrolu provedl: ${data.technicianName}`;
  signCell.font = { size: 10, name: 'Arial' };
  worksheet.getRow(row).height = 17; // Kompaktní
  row++;
  
  const dateCell = worksheet.getCell(`A${row}`);
  dateCell.value = `Dne: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`;
  dateCell.font = { size: 10, name: 'Arial' };
  
  worksheet.mergeCells(`C${row}:D${row}`);
  const locationCell = worksheet.getCell(`C${row}`);
  locationCell.value = `V: ${data.technicianAddress?.split(',')[1]?.trim() || ''}`;
  locationCell.font = { size: 10, name: 'Arial' };
  locationCell.alignment = { horizontal: 'right' };
  worksheet.getRow(row).height = 17; // Kompaktní

  // Nastavení print area
  worksheet.pageSetup.printArea = `A1:D${row}`;
  worksheet.pageSetup.horizontalCentered = true;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
