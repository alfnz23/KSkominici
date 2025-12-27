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

export async function generateReportXLSX(data: ReportData): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Protokol kontroly');

  // Nastavení šířky sloupců
  worksheet.columns = [
    { width: 30 },
    { width: 50 },
  ];

  // Hlavička
  worksheet.mergeCells('A1:B1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'PROTOKOL O KONTROLE SPALINOVÉ CESTY';
  titleCell.font = { size: 16, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE67E22' },
  };
  worksheet.getRow(1).height = 30;

  let row = 3;

  // Sekce: Údaje o zákazníkovi
  worksheet.getCell(`A${row}`).value = 'ÚDAJE O ZÁKAZNÍKOVI';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  worksheet.mergeCells(`A${row}:B${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = 'Jméno a příjmení:';
  worksheet.getCell(`B${row}`).value = data.customerName;
  row++;

  worksheet.getCell(`A${row}`).value = 'Email:';
  worksheet.getCell(`B${row}`).value = data.customerEmail;
  row++;

  if (data.customerPhone) {
    worksheet.getCell(`A${row}`).value = 'Telefon:';
    worksheet.getCell(`B${row}`).value = data.customerPhone;
    row++;
  }

  if (data.permanentAddress) {
    worksheet.getCell(`A${row}`).value = 'Adresa trvalého bydliště:';
    worksheet.getCell(`B${row}`).value = data.permanentAddress;
    row++;
  }

  row++;

  // Sekce: Údaje o kontrole
  worksheet.getCell(`A${row}`).value = 'ÚDAJE O KONTROLE';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  worksheet.mergeCells(`A${row}:B${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = 'Adresa kontrolovaného objektu:';
  worksheet.getCell(`B${row}`).value = data.inspectionAddress;
  row++;

  worksheet.getCell(`A${row}`).value = 'Datum kontroly:';
  worksheet.getCell(`B${row}`).value = new Date(data.inspectionDate).toLocaleDateString('cs-CZ');
  row++;

  if (data.nextInspectionDate) {
    worksheet.getCell(`A${row}`).value = 'Datum příští kontroly:';
    worksheet.getCell(`B${row}`).value = new Date(data.nextInspectionDate).toLocaleDateString('cs-CZ');
    row++;
  }

  worksheet.getCell(`A${row}`).value = 'Kontrolu provedl:';
  worksheet.getCell(`B${row}`).value = data.technicianName;
  row++;

  row++;

  // Sekce: Technické údaje
  worksheet.getCell(`A${row}`).value = 'TECHNICKÉ ÚDAJE';
  worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  worksheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD5D8DC' },
  };
  worksheet.mergeCells(`A${row}:B${row}`);
  row++;

  worksheet.getCell(`A${row}`).value = 'Typ komína:';
  worksheet.getCell(`B${row}`).value = data.chimneyType;
  row++;

  if (data.chimneyHeight) {
    worksheet.getCell(`A${row}`).value = 'Výška komína:';
    worksheet.getCell(`B${row}`).value = `${data.chimneyHeight} m`;
    row++;
  }

  worksheet.getCell(`A${row}`).value = 'Stav:';
  worksheet.getCell(`B${row}`).value = data.condition;
  worksheet.getCell(`B${row}`).font = {
    bold: true,
    color: {
      argb: data.condition === 'Vyhovující' ? 'FF27AE60' : 
            data.condition === 'Nevyhovující' ? 'FFE74C3C' : 'FFF39C12'
    }
  };
  row++;

  row++;

  if (data.defectsFound) {
    worksheet.getCell(`A${row}`).value = 'ZJIŠTĚNÉ ZÁVADY';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    worksheet.mergeCells(`A${row}:B${row}`);
    row++;

    worksheet.getCell(`A${row}`).value = data.defectsFound;
    worksheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
    worksheet.mergeCells(`A${row}:B${row}`);
    worksheet.getRow(row).height = 60;
    row++;
    row++;
  }

  if (data.recommendations) {
    worksheet.getCell(`A${row}`).value = 'DOPORUČENÍ';
    worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    worksheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD5D8DC' },
    };
    worksheet.mergeCells(`A${row}:B${row}`);
    row++;

    worksheet.getCell(`A${row}`).value = data.recommendations;
    worksheet.getCell(`A${row}`).alignment = { wrapText: true, vertical: 'top' };
    worksheet.mergeCells(`A${row}:B${row}`);
    worksheet.getRow(row).height = 60;
    row++;
    row++;
  }

  // Sekce: Spotřebiče
  if (data.appliances && data.appliances.length > 0) {
    const validAppliances = data.appliances.filter(
      (a) => a.type || a.manufacturer
    );

    if (validAppliances.length > 0) {
      worksheet.getCell(`A${row}`).value = 'PŘIPOJENÉ SPOTŘEBIČE';
      worksheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${row}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD5D8DC' },
      };
      worksheet.mergeCells(`A${row}:B${row}`);
      row++;

      validAppliances.forEach((appliance, index) => {
        worksheet.getCell(`A${row}`).value = `${index + 1}. Spotřebič:`;
        worksheet.getCell(`A${row}`).font = { bold: true };
        worksheet.mergeCells(`A${row}:B${row}`);
        row++;

        if (appliance.type) {
          worksheet.getCell(`A${row}`).value = '  Typ:';
          worksheet.getCell(`B${row}`).value = appliance.type;
          row++;
        }

        if (appliance.manufacturer) {
          worksheet.getCell(`A${row}`).value = '  Výrobce:';
          worksheet.getCell(`B${row}`).value = appliance.manufacturer;
          row++;
        }

        if (appliance.power) {
          worksheet.getCell(`A${row}`).value = '  Výkon:';
          worksheet.getCell(`B${row}`).value = appliance.power;
          row++;
        }

        if (appliance.serialNumber) {
          worksheet.getCell(`A${row}`).value = '  Výrobní číslo:';
          worksheet.getCell(`B${row}`).value = appliance.serialNumber;
          row++;
        }

        row++;
      });
    }
  }

  // Patička
  row++;
  worksheet.mergeCells(`A${row}:B${row}`);
  const footerCell = worksheet.getCell(`A${row}`);
  footerCell.value = `Dokument vygenerován: ${new Date().toLocaleDateString('cs-CZ')} ${new Date().toLocaleTimeString('cs-CZ')}`;
  footerCell.font = { size: 9, italic: true };
  footerCell.alignment = { horizontal: 'center' };

  // Formátování všech řádků
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Vrátit buffer
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
