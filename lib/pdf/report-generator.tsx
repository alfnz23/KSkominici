import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';

// Registrace Roboto fontů s plnou UTF-8 podporou
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: '/fonts/Roboto-Regular.ttf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/Roboto-Bold.ttf',
      fontWeight: 'bold',
    },
  ],
});

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

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Roboto',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  row: {
    marginBottom: 4,
  },
  label: {
    fontWeight: 'bold',
  },
  text: {
    lineHeight: 1.5,
  },
  appliance: {
    marginLeft: 10,
    marginTop: 5,
  },
  applianceTitle: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

const ReportDocument: React.FC<{ data: ReportData }> = ({ data }) => {
  const validAppliances = data.appliances.filter(a => a.type || a.manufacturer);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Hlavička */}
        <Text style={styles.title}>PROTOKOL O KONTROLE</Text>
        <Text style={styles.subtitle}>SPALINOVÉ CESTY</Text>

        {/* Údaje o zákazníkovi */}
        <Text style={styles.sectionTitle}>ÚDAJE O ZÁKAZNÍKOVI</Text>
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Jméno a příjmení: </Text>
            {data.customerName}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Email: </Text>
            {data.customerEmail}
          </Text>
        </View>
        {data.customerPhone && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Telefon: </Text>
              {data.customerPhone}
            </Text>
          </View>
        )}
        {data.permanentAddress && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Adresa trvalého bydliště: </Text>
              {data.permanentAddress}
            </Text>
          </View>
        )}

        {/* Údaje o kontrole */}
        <Text style={styles.sectionTitle}>ÚDAJE O KONTROLE</Text>
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Adresa kontrolovaného objektu: </Text>
            {data.inspectionAddress}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Datum kontroly: </Text>
            {new Date(data.inspectionDate).toLocaleDateString('cs-CZ')}
          </Text>
        </View>
        {data.nextInspectionDate && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Datum příští kontroly: </Text>
              {new Date(data.nextInspectionDate).toLocaleDateString('cs-CZ')}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Kontrolu provedl: </Text>
            {data.technicianName}
          </Text>
        </View>

        {/* Technické údaje */}
        <Text style={styles.sectionTitle}>TECHNICKÉ ÚDAJE</Text>
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Typ komína: </Text>
            {data.chimneyType}
          </Text>
        </View>
        {data.chimneyHeight && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Výška komína: </Text>
              {data.chimneyHeight} m
            </Text>
          </View>
        )}
        {data.chimneyDescription && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Popis spalinové cesty: </Text>
              {data.chimneyDescription}
            </Text>
          </View>
        )}
        {data.flue && (
          <View style={styles.row}>
            <Text style={styles.text}>
              <Text style={styles.label}>Kouřovod: </Text>
              {data.flue}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.text}>
            <Text style={styles.label}>Stav: </Text>
            {data.condition}
          </Text>
        </View>

        {/* Zjištěné závady */}
        {data.defectsFound && (
          <>
            <Text style={styles.sectionTitle}>ZJIŠTĚNÉ ZÁVADY</Text>
            <View style={styles.row}>
              <Text style={styles.text}>{data.defectsFound}</Text>
            </View>
          </>
        )}

        {/* Doporučení */}
        {data.recommendations && (
          <>
            <Text style={styles.sectionTitle}>DOPORUČENÍ</Text>
            <View style={styles.row}>
              <Text style={styles.text}>{data.recommendations}</Text>
            </View>
          </>
        )}

        {/* Spotřebiče */}
        {validAppliances.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>PŘIPOJENÉ SPOTŘEBIČE</Text>
            {validAppliances.map((appliance, index) => (
              <View key={index} style={styles.appliance}>
                <Text style={styles.applianceTitle}>
                  {index + 1}. Spotřebič:
                </Text>
                {appliance.type && (
                  <Text style={styles.text}>  Typ: {appliance.type}</Text>
                )}
                {appliance.manufacturer && (
                  <Text style={styles.text}>  Výrobce: {appliance.manufacturer}</Text>
                )}
                {appliance.power && (
                  <Text style={styles.text}>  Výkon: {appliance.power}</Text>
                )}
                {appliance.serialNumber && (
                  <Text style={styles.text}>  Výrobní číslo: {appliance.serialNumber}</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Patička */}
        <Text style={styles.footer}>
          Dokument vygenerován: {new Date().toLocaleDateString('cs-CZ')} {new Date().toLocaleTimeString('cs-CZ')}
        </Text>
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
