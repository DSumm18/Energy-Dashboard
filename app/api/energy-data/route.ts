import { NextResponse } from 'next/server';
import { getAllEnergyData, getMockEnergyData } from '@/lib/google-sheets';
import { getCurrentEnergyData, getDatabaseStats } from '@/lib/local-database';

export async function GET() {
  try {
    // Check for local database first (extracted invoice data)
    const localData = await getCurrentEnergyData();
    const dbStats = await getDatabaseStats();
    
    if (localData.length > 0) {
      return NextResponse.json({
        success: true,
        data: localData,
        lastUpdated: new Date().toISOString(),
        source: 'local-database',
        dataSource: `Local Database (${dbStats.currentRunName})`,
        recordCount: dbStats.currentRecordCount,
        databaseStats: dbStats
      });
    }

    // Fallback to Google Sheets if no local data
    const hasSheetsId = Boolean(process.env.GOOGLE_SHEETS_ID);
    const hasApiKey = Boolean(process.env.GOOGLE_SHEETS_API_KEY);
    const hasServiceAccount = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );
    const hasCredentials = hasSheetsId && (hasApiKey || hasServiceAccount);

    let data;
    if (hasCredentials) {
      data = await getAllEnergyData();
      return NextResponse.json({
        success: true,
        data,
        lastUpdated: new Date().toISOString(),
        source: 'google-sheets',
        dataSource: 'Google Sheets (Live Data)',
        recordCount: data.length
      });
    } else {
      // Use mock data for development
      data = getMockEnergyData();
      return NextResponse.json({
        success: true,
        data,
        lastUpdated: new Date().toISOString(),
        source: 'mock-data',
        dataSource: 'Demo Data (Mock)',
        recordCount: data.length
      });
    }
  } catch (error) {
    console.error('Error fetching energy data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch energy data',
        data: getMockEnergyData(), // Fallback to mock data
        source: 'mock-data-fallback',
        dataSource: 'Demo Data (Fallback)',
        recordCount: getMockEnergyData().length
      },
      { status: 500 }
    );
  }
}
