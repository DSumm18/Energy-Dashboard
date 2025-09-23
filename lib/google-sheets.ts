import { google } from 'googleapis';
import { EnergyData, MeterInfo } from '@/types';

const sheets = google.sheets({ version: 'v4' });

export async function getMeterData(): Promise<MeterInfo[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth: process.env.GOOGLE_SHEETS_API_KEY,
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Meters!A:E', // Adjust range based on your sheet structure
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    // Skip header row
    return rows.slice(1).map((row) => ({
      schoolName: row[0] || '',
      address: row[1] || '',
      mpan: row[2] || '',
      energyType: (row[3] || 'Electricity') as 'Electricity' | 'Gas',
      meterNumber: row[4] || '',
    }));
  } catch (error) {
    console.error('Error fetching meter data:', error);
    return [];
  }
}

export async function getEnergyData(mpan: string): Promise<EnergyData[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      auth: process.env.GOOGLE_SHEETS_API_KEY,
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: `${mpan}!A:F`, // Adjust range based on your sheet structure
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return [];

    // Skip header row and process data
    return rows.slice(1).map((row) => ({
      schoolName: row[0] || '',
      meterNumber: mpan,
      energyType: (row[1] || 'Electricity') as 'Electricity' | 'Gas',
      year: parseInt(row[2]) || new Date().getFullYear(),
      month: row[3] || '',
      totalKwh: parseFloat(row[4]) || 0,
    }));
  } catch (error) {
    console.error(`Error fetching energy data for ${mpan}:`, error);
    return [];
  }
}

export async function getAllEnergyData(): Promise<EnergyData[]> {
  try {
    const meters = await getMeterData();
    const allData: EnergyData[] = [];

    for (const meter of meters) {
      if (meter.mpan) {
        const meterData = await getEnergyData(meter.mpan);
        allData.push(...meterData);
      }
    }

    return allData;
  } catch (error) {
    console.error('Error fetching all energy data:', error);
    return [];
  }
}

// For development/testing - returns mock data
export function getMockEnergyData(): EnergyData[] {
  return [
    // Hollingwood Primary School
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2025, month: "September", totalKwh: 11329.9 },
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2025, month: "October", totalKwh: 14318.5 },
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2025, month: "November", totalKwh: 17288.4 },
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2025, month: "December", totalKwh: 15332.9 },
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2026, month: "January", totalKwh: 18804.2 },
    { schoolName: "Hollingwood Primary School", meterNumber: "2378152210187", energyType: "Electricity", year: 2026, month: "February", totalKwh: 19806.7 },

    // Laycock Primary School
    { schoolName: "Laycock Primary School", meterNumber: "2353299524521", energyType: "Electricity", year: 2025, month: "September", totalKwh: 9800 },
    { schoolName: "Laycock Primary School", meterNumber: "2353299524521", energyType: "Electricity", year: 2025, month: "October", totalKwh: 11200 },
    { schoolName: "Laycock Primary School", meterNumber: "2353299524521", energyType: "Electricity", year: 2025, month: "November", totalKwh: 10500 },

    // Crossley Hall Primary School
    { schoolName: "Crossley Hall Primary School", meterNumber: "2314700704221", energyType: "Electricity", year: 2024, month: "September", totalKwh: 5957 },
    { schoolName: "Crossley Hall Primary School", meterNumber: "2314700704221", energyType: "Electricity", year: 2024, month: "October", totalKwh: 8160 },
    { schoolName: "Crossley Hall Primary School", meterNumber: "2314700704221", energyType: "Electricity", year: 2024, month: "November", totalKwh: 5987.3 },
    { schoolName: "Crossley Hall Primary School", meterNumber: "2314700704221", energyType: "Electricity", year: 2024, month: "December", totalKwh: 7769.7 },

    // Clayton Village Primary
    { schoolName: "Clayton Village Primary", meterNumber: "2315811875711", energyType: "Electricity", year: 2025, month: "October", totalKwh: 7500 },
    { schoolName: "Clayton Village Primary", meterNumber: "2315811875711", energyType: "Electricity", year: 2025, month: "November", totalKwh: 8200 },
    
    // Farnham Primary School
    { schoolName: "Farnham Primary School", meterNumber: "2315511999614", energyType: "Electricity", year: 2025, month: "October", totalKwh: 12000 },
    { schoolName: "Farnham Primary School", meterNumber: "2315511999614", energyType: "Electricity", year: 2025, month: "November", totalKwh: 13500 },

    // Lidget Green Primary School
    { schoolName: "Lidget Green Primary School", meterNumber: "0239951231318", energyType: "Electricity", year: 2025, month: "September", totalKwh: 15000 },
    { schoolName: "Lidget Green Primary School", meterNumber: "0239951231318", energyType: "Electricity", year: 2025, month: "October", totalKwh: 16500 },
    { schoolName: "Lidget Green Primary School", meterNumber: "0623830623108", energyType: "Electricity", year: 2025, month: "September", totalKwh: 4500 },
    { schoolName: "Lidget Green Primary School", meterNumber: "0623830623108", energyType: "Electricity", year: 2025, month: "October", totalKwh: 5000 },

    // Grove House Primary School
    { schoolName: "Grove House Primary School", meterNumber: "0028024408", energyType: "Gas", year: 2025, month: "October", totalKwh: 18200 },
    { schoolName: "Grove House Primary School", meterNumber: "0028024408", energyType: "Gas", year: 2025, month: "November", totalKwh: 22500 },
    { schoolName: "Grove House Primary School", meterNumber: "0015562208", energyType: "Electricity", year: 2025, month: "October", totalKwh: 8800 },
    { schoolName: "Grove House Primary School", meterNumber: "0015562208", energyType: "Electricity", year: 2025, month: "November", totalKwh: 9200 },
    
    // Grange Road First & Middle School
    { schoolName: "Grange Road First & Middle School", meterNumber: "0152639598", energyType: "Gas", year: 2025, month: "October", totalKwh: 21000 },
    { schoolName: "Grange Road First & Middle School", meterNumber: "0152639598", energyType: "Gas", year: 2025, month: "November", totalKwh: 25000 },
    { schoolName: "Grange Road First & Middle School", meterNumber: "0638202202", energyType: "Electricity", year: 2025, month: "October", totalKwh: 11500 },
    { schoolName: "Grange Road First & Middle School", meterNumber: "0638202202", energyType: "Electricity", year: 2025, month: "November", totalKwh: 12500 },

    // Fairweather Green First & Middle
    { schoolName: "Fairweather Green First & Middle", meterNumber: "04705039836", energyType: "Gas", year: 2025, month: "October", totalKwh: 19000 },
    { schoolName: "Fairweather Green First & Middle", meterNumber: "04705039836", energyType: "Gas", year: 2025, month: "November", totalKwh: 23000 },
  ];
}
