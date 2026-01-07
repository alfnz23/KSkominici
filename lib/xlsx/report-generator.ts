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

  // Nastavení pro tisk: 95% měřítko pro dobrou čitelnost na A4
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: 'portrait',
    fitToPage: false,
    scale: 95, 
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

  // 4 SLOUPCE - Šířky optimalizované pro lepší čitelnost
  worksheet.columns = [
    { width: 25 },  // Sloupec A - Label
    { width: 35 },  // Sloupec B - Hodnota (zvětšeno)
    { width: 15 },  // Sloupec C - Krátký label
    { width: 25 },  // Sloupec D - Hodnota (zvětšeno)
  ];

  let row = 1;

  const borderThin = {
    top: { style: 'thin' as const },
    left: { style: 'thin' as const },
    right: { style: 'thin' as const },
    bottom: { style: 'thin' as const },
  };

  // ═══════════════════════════════════════════════════════
  // HLAVIČKA
  // ═══════════════════════════════════════════════════════
  
  worksheet.mergeCells(`A${row}:D${row}`);
  const headerCell = worksheet.getCell(`A${row}`);
  headerCell.value = 'ZPRÁVA';
  headerCell.font = { size: 16, bold: true, name: 'Arial' };
  headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  headerCell.border = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    right: { style: 'medium' },
  };
  worksheet.getRow(row).height = 22; 
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
  worksheet.getRow(row).height = 18; 
  row++;

  row++; // Prázdný řádek

  // ═══════════════════════════════════════════════════════
  // INFORMACE O FIRMĚ
  // ═══════════════════════════════════════════════════════
  
  worksheet.mergeCells(`A${row}:D${row}`);
  const companyNameCell = worksheet.getCell(`A${row}`);
  companyNameCell.value = 'KS Kominíci.cz';
  companyNameCell.font = { size: 14, bold: true, name: 'Arial' };
  companyNameCell.alignment = { horizontal: 'center' };
  worksheet.getRow(row).height = 18;
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

  // Helper funkce pro výpočet výšky řádku podle délky textu
  const calculateRowHeight = (text: string, charsPerLine: number = 60, minHeight: number = 20): number => {
    const textLength = text?.length || 0;
    const lines = Math.ceil(textLength / charsPerLine);
    return Math.max(minHeight, lines * 18); // 18 = výška jednoho řádku textu (zvýšeno z 15)
  };

  const addFullRow = (label: string, value: string, height: number = 20) => {
    const labelCell = worksheet.getCell(`A${row}`);
    labelCell.value = label;
    labelCell.font = { bold: true, size: 10, name: 'Arial' };
    labelCell.border = borderThin;
    labelCell.alignment = { vertical: 'middle', indent: 1 };

    worksheet.mergeCells(`B${row}:D${row}`);
    const valueCell = worksheet.getCell(`B${row}`);
    valueCell.value = value;
    valueCell.font = { size: 10, name: 'Arial' };
    valueCell.border = borderThin;
    valueCell.alignment = { 
      vertical: 'top',  // Změněno z 'middle' na 'top'
      indent: 1,
      wrapText: true    // ← PŘIDÁNO pro zalomení textu
    };
    
    // Vypočítat výšku podle délky textu
    // Sloučené B:D = přibližně 50-60 znaků na řádek
    const calculatedHeight = calculateRowHeight(value, 50, height);
    
    worksheet.getRow(row).height = calculatedHeight;
    row++;
  };

  const addSplitRow = (label1: string, value1: string, label2: string, value2: string, height: number = 20) => {
    const cellA = worksheet.getCell(`A${row}`);
    cellA.value = label1;
    cellA.font = { bold: true, size: 10, name: 'Arial' };
    cellA.border = borderThin;
    cellA.alignment = { vertical: 'middle', indent: 1 };

    const cellB = worksheet.getCell(`B${row}`);
    cellB.value = value1;
    cellB.font = { size: 10, name: 'Arial' };
    cellB.border = borderThin;
    cellB.alignment = { vertical: 'middle', indent: 1 };

    const cellC = worksheet.getCell(`C${row}`);
    cellC.value = label2;
    cellC.font = { bold: true, size: 10, name: 'Arial' };
    cellC.border = borderThin;
    cellC.alignment = { vertical: 'middle', indent: 1 };

    const cellD = worksheet.getCell(`D${row}`);
    cellD.value = value2;
    cellD.font = { size: 10, name: 'Arial' };
    cellD.border = borderThin;
    cellD.alignment = { vertical: 'middle', indent: 1 };
    
    worksheet.getRow(row).height = height;
    row++;
  };

  addFullRow('Jméno zákazníka:', data.customerName);
  addFullRow('Název firmy / Jméno fyzické osoby:', data.companyOrPersonName);
  addSplitRow('Kontakt zákazníka (email):', data.customerEmail, 'tel:', data.customerPhone || '');
  
  if (data.permanentAddress) {
    addFullRow('Sídlo firmy/Bydliště:', data.permanentAddress);
  }

  addSplitRow('Adresa kontrolovaného objektu:', data.inspectionAddress, 'Podlaží:', validAppliances[0]?.floor || '');
  addFullRow('Datum provedení kontroly:', new Date(data.inspectionDate).toLocaleDateString('cs-CZ'));

  row++; 

  // ═══════════════════════════════════════════════════════
  // SPOTŘEBIČ
  // ═══════════════════════════════════════════════════════

  if (validAppliances.length > 0) {
    worksheet.mergeCells(`A${row}:D${row}`);
    const spotrebicHeader = worksheet.getCell(`A${row}`);
    spotrebicHeader.value = 'SPOTŘEBIČ:';
    spotrebicHeader.font = { bold: true, size: 11, name: 'Arial' };
    spotrebicHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    spotrebicHeader.alignment = { vertical: 'middle', indent: 1 };
    worksheet.getRow(row).height = 20;
    row++;

    const appliance = validAppliances[0];
    addSplitRow('Druh:', appliance.type || '', 'Výkon:', appliance.power || '');
    addSplitRow('Typ:', appliance.manufacturer || '', 'Umístění:', appliance.location || '');
    row++;
  }

  // ═══════════════════════════════════════════════════════
  // SPECIFIKACE SPALINOVÉ CESTY
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const specHeader = worksheet.getCell(`A${row}`);
  specHeader.value = 'SPECIFIKACE SPALINOVÉ CESTY:';
  specHeader.font = { bold: true, size: 11, name: 'Arial' };
  specHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
  specHeader.alignment = { vertical: 'middle', indent: 1 };
  worksheet.getRow(row).height = 20;
  row++;

  // KOMÍN - velký spojený rámeček (obsahuje popis spalinové cesty)
  addFullRow('Komín:', data.chimneyDescription || '');
  
  // KOUŘOVOD - velký spojený rámeček
  if (data.flue) {
    addFullRow('Kouřovod:', data.flue);
  }

  row++;

  // ═══════════════════════════════════════════════════════
  // ZJIŠTĚNÉ NEDOSTATKY
  // ═══════════════════════════════════════════════════════

  const addSectionLabel = (text: string) => {
    worksheet.mergeCells(`A${row}:D${row}`);
    const cell = worksheet.getCell(`A${row}`);
    cell.value = text;
    cell.font = { bold: true, size: 10, name: 'Arial' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };
    cell.alignment = { vertical: 'middle', indent: 1 };
    worksheet.getRow(row).height = 18;
    row++;
  };

  addSectionLabel('ZJIŠTĚNÉ NEDOSTATKY, KTERÉ BYLY ODSTRANĚNY NA MÍSTĚ:');
  worksheet.mergeCells(`A${row}:D${row}`);
  const d1 = worksheet.getCell(`A${row}`);
  const defectsText1 = (data.condition !== 'Vyhovuje' && data.defectsFound) ? data.defectsFound : '';
  d1.value = defectsText1;
  d1.border = borderThin;
  d1.alignment = { wrapText: true, vertical: 'top', indent: 1 };
  worksheet.getRow(row).height = calculateRowHeight(defectsText1, 70, 30); // 70 znaků pro A:D, min 30
  row++;

  addSectionLabel('ZJIŠTĚNÉ NEDOSTATKY, KTERÉ NEBYLY ODSTRANĚNY NA MÍSTĚ:');
  worksheet.mergeCells(`A${row}:D${row}`);
  const d2 = worksheet.getCell(`A${row}`);
  const defectsText2 = (data.condition !== 'Vyhovuje' && data.defectsFound) ? data.defectsFound : '';
  d2.value = defectsText2;
  d2.border = borderThin;
  d2.alignment = { wrapText: true, vertical: 'top', indent: 1 };
  worksheet.getRow(row).height = calculateRowHeight(defectsText2, 70, 30); // 70 znaků pro A:D, min 30
  row++;

  if (data.defectRemovalDate) {
    addSectionLabel('TERMÍN ODSTRANĚNÍ NEDOSTATKŮ:');
    worksheet.mergeCells(`A${row}:D${row}`);
    const d3 = worksheet.getCell(`A${row}`);
    d3.value = new Date(data.defectRemovalDate).toLocaleDateString('cs-CZ');
    d3.border = borderThin;
    d3.alignment = { indent: 1 };
    row++;
  }

  // ═══════════════════════════════════════════════════════
  // KLAUZULE
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:D${row}`);
  const disclaimer = worksheet.getCell(`A${row}`);
  disclaimer.value = 'Kontrola spal. cesty byla provedena výše uvedeného data vizuálně a s maximální možnou pečlivostí, ale bez demontáže stavebních konstrukcí a prvků, které komínové těleso/spalinovou cestu zakrývají. Z tohoto důvodu nejsem schopen a odmítám ručit za škody, provedení, závady, vzdálenosti hořlavých či tavných materiálů a důsledky z toho vyplývající v úsecích komínu/spalinové cesty, které nelze vizuálně zkontrolovat bez nutnosti odkrývání nebo demontáže stavebních konstrukcí, tapet, podlahových krytin, deskových podhledů a příček, obložení, elektroinstalace apod.';
  disclaimer.font = { size: 7.5, name: 'Arial' };
  disclaimer.alignment = { wrapText: true, vertical: 'top' };
  disclaimer.border = borderThin;
  worksheet.getRow(row).height = 55; // Mírně zvýšeno pro jistotu, že se vejde vše
  row++;

  addSectionLabel('ZÁVĚR:');
  worksheet.mergeCells(`A${row}:D${row}`);
  const concValue = worksheet.getCell(`A${row}`);
  const conclusionText = `${data.condition}\nSpalinová cesta vyhovuje bezpečnému provozu${data.recommendations ? '\n' + data.recommendations : ''}`;
  concValue.value = conclusionText;
  concValue.font = { size: 10, name: 'Arial' };
  concValue.alignment = { wrapText: true, vertical: 'top', indent: 1 };
  concValue.border = borderThin;
  worksheet.getRow(row).height = calculateRowHeight(conclusionText, 70, 40); // 70 znaků pro A:D, min 40
  row++;

  row++;

  // ═══════════════════════════════════════════════════════
  // PODPIS
  // ═══════════════════════════════════════════════════════

  worksheet.mergeCells(`A${row}:B${row}`);
  worksheet.getCell(`A${row}`).value = `Kontrolu provedl: ${data.technicianName}`;
  worksheet.getRow(row).height = 18;
  row++;
  
  worksheet.getCell(`A${row}`).value = `Dne: ${new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}`;
  worksheet.mergeCells(`C${row}:D${row}`);
  const loc = worksheet.getCell(`C${row}`);
  loc.value = `V: ${data.technicianAddress?.split(',')[1]?.trim() || ''}`;
  loc.alignment = { horizontal: 'right' };

  worksheet.pageSetup.printArea = `A1:D${row}`;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
