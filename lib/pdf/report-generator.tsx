import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';

// Registrace Roboto fontů
const regularFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Regular.ttf');
const boldFontPath = path.join(process.cwd(), 'public', 'fonts', 'Roboto-Bold.ttf');

Font.register({
  family: 'Roboto',
  fonts: [
    { src: regularFontPath, fontWeight: 'normal' },
    { src: boldFontPath, fontWeight: 'bold' },
  ],
});

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

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: 'Roboto',
  },
  header: {
    border: '2 solid black',
    padding: 8,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 3,
  },
  companyInfo: {
    marginTop: 10,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  companyDetail: {
    fontSize: 9,
    marginTop: 2,
  },
  table: {
    marginTop: 10,
    marginBottom: 10,
    border: '1 solid black',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid black',
  },
  tableCell: {
    padding: 5,
    borderRight: '1 solid black',
  },
  tableCellLabel: {
    fontWeight: 'bold',
    width: '40%',
  },
  tableCellValue: {
    width: '60%',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    padding: 3,
    backgroundColor: '#f0f0f0',
  },
  section: {
    marginTop: 4,
    marginBottom: 4,
  },
  sectionContent: {
    border: '1 solid black',
    padding: 5,
    minHeight: 30,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signature: {
    fontSize: 9,
  },
});

const ReportDocument: React.FC<{ data: ReportData }> = ({ data }) => {
  const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hlavička */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>ZPRÁVA</Text>
          <Text style={styles.headerSubtitle}>
            o provedení kontroly a čištění spalinové cesty
          </Text>
        </View>

        {/* Informace o firmě */}
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>KS Kominíci.cz</Text>
          <Text style={styles.companyDetail}>{data.technicianName}</Text>
          {data.technicianAddress && (
            <Text style={styles.companyDetail}>{data.technicianAddress}</Text>
          )}
          {data.technicianIco && (
            <Text style={styles.companyDetail}>IČO odborně způsobilé osoby: {data.technicianIco}</Text>
          )}
        </View>

        {/* Údaje o zákazníkovi - tabulka */}
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellLabel]}>
              <Text>Jméno zákazníka:</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellValue, { borderRight: 0 }]}>
              <Text>{data.customerName}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellLabel]}>
              <Text>Název firmy / Jméno fyzické osoby:</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellValue, { borderRight: 0 }]}>
              <Text>{data.companyOrPersonName}</Text>
            </View>
          </View>

          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellLabel]}>
              <Text>Kontakt zákazníka (email):</Text>
            </View>
            <View style={[styles.tableCell, { width: '30%' }]}>
              <Text>{data.customerEmail}</Text>
            </View>
            <View style={[styles.tableCell, { width: '10%', fontWeight: 'bold' }]}>
              <Text>tel:</Text>
            </View>
            <View style={[styles.tableCell, { width: '20%', borderRight: 0 }]}>
              <Text>{data.customerPhone}</Text>
            </View>
          </View>

          {data.permanentAddress && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.tableCellLabel]}>
                <Text>Sídlo firmy/Bydliště:</Text>
              </View>
              <View style={[styles.tableCell, styles.tableCellValue, { borderRight: 0 }]}>
                <Text>{data.permanentAddress}</Text>
              </View>
            </View>
          )}

          <View style={styles.tableRow}>
            <View style={[styles.tableCell, styles.tableCellLabel]}>
              <Text>Adresa kontrolovaného objektu:</Text>
            </View>
            <View style={[styles.tableCell, { width: '40%' }]}>
              <Text>{data.inspectionAddress}</Text>
            </View>
            <View style={[styles.tableCell, { width: '10%', fontWeight: 'bold' }]}>
              <Text>Podlaží:</Text>
            </View>
            <View style={[styles.tableCell, { width: '10%', borderRight: 0 }]}>
              <Text>{validAppliances[0]?.floor || ''}</Text>
            </View>
          </View>

          <View style={[styles.tableRow, { borderBottom: 0 }]}>
            <View style={[styles.tableCell, styles.tableCellLabel]}>
              <Text>Datum provedení kontroly:</Text>
            </View>
            <View style={[styles.tableCell, styles.tableCellValue, { borderRight: 0 }]}>
              <Text>{new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}</Text>
            </View>
          </View>
        </View>

        {/* Spotřebič */}
        {validAppliances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SPOTŘEBIČ:</Text>
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>
                  <Text>Druh:</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%' }]}>
                  <Text>{validAppliances[0]?.type || ''}</Text>
                </View>
                <View style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>
                  <Text>Výkon:</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%', borderRight: 0 }]}>
                  <Text>{validAppliances[0]?.power || ''}</Text>
                </View>
              </View>
              <View style={[styles.tableRow, { borderBottom: 0 }]}>
                <View style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>
                  <Text>Typ:</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%' }]}>
                  <Text>{validAppliances[0]?.manufacturer || ''}</Text>
                </View>
                <View style={[styles.tableCell, { width: '15%', fontWeight: 'bold' }]}>
                  <Text>Umístění:</Text>
                </View>
                <View style={[styles.tableCell, { width: '35%', borderRight: 0 }]}>
                  <Text>{validAppliances[0]?.location || ''}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Specifické spalinové cesty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SPECIFICKÉ SPALINOVÉ CESTY:</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, { borderBottom: data.flue ? '1 solid black' : 0 }]}>
              <View style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>
                <Text>Komín:</Text>
              </View>
              <View style={[styles.tableCell, { width: '80%', borderRight: 0 }]}>
                <Text>{data.chimneyType}</Text>
                {data.chimneyDescription && <Text>{data.chimneyDescription}</Text>}
              </View>
            </View>
            
            {data.flue && (
              <View style={[styles.tableRow, { borderBottom: 0 }]}>
                <View style={[styles.tableCell, { width: '20%', fontWeight: 'bold' }]}>
                  <Text>Kouřovod:</Text>
                </View>
                <View style={[styles.tableCell, { width: '80%', borderRight: 0 }]}>
                  <Text>{data.flueType || ''}</Text>
                  <Text>{data.flue}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Zjištěné nedostatky odstraněné */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ZJIŠTĚNÉ NEDOSTATKY, KTERÉ BYLY ODSTRANĚNY NA MÍSTĚ:
          </Text>
          <View style={styles.sectionContent}>
            <Text>{data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : ''}</Text>
          </View>
        </View>

        {/* Zjištěné nedostatky neodstraněné */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ZJIŠTĚNÉ NEDOSTATKY, KTERÉ NEBYLY ODSTRANĚNY NA MÍSTĚ:
          </Text>
          <View style={styles.sectionContent}>
            <Text>{data.condition !== 'Vyhovuje' && data.defectsFound ? data.defectsFound : ''}</Text>
          </View>
        </View>

        {/* Termín odstranění */}
        {data.defectRemovalDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TERMÍN ODSTRANĚNÍ NEDOSTATKŮ:</Text>
            <View style={styles.sectionContent}>
              <Text>{new Date(data.defectRemovalDate).toLocaleDateString('cs-CZ')}</Text>
            </View>
          </View>
        )}

        {/* Závěr */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ZÁVĚR:</Text>
          <View style={styles.sectionContent}>
            <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>{data.condition}</Text>
            <Text>Spalinová cesta vyhovuje bezpečnému provozu</Text>
            {data.recommendations && <Text>{data.recommendations}</Text>}
          </View>
        </View>

        {/* Podpis */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.signature}>Kontrolu provedl: {data.technicianName}</Text>
            <Text style={styles.signature}>
              Dne: {new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}
            </Text>
          </View>
          <View>
            <Text style={styles.signature}>V: {data.technicianAddress?.split(',')[1] || ''}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  try {
    const pdfBuffer = await renderToBuffer(<ReportDocument data={data} />);
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
}
