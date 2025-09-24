import { NextRequest, NextResponse } from 'next/server';
import { getAllEnergyData, getMockEnergyData } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    const hasSheetsId = Boolean(process.env.GOOGLE_SHEETS_ID);
    const hasApiKey = Boolean(process.env.GOOGLE_SHEETS_API_KEY);
    const hasServiceAccount = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    );
    const hasCredentials = hasSheetsId && (hasApiKey || hasServiceAccount);

    let data;
    if (hasCredentials) {
      data = await getAllEnergyData();
    } else {
      // Use mock data for development
      data = getMockEnergyData();
    }

    return NextResponse.json({
      success: true,
      data,
      lastUpdated: new Date().toISOString(),
      source: hasCredentials ? 'google-sheets' : 'mock-data'
    });
  } catch (error) {
    console.error('Error fetching energy data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch energy data',
        data: getMockEnergyData(), // Fallback to mock data
        source: 'mock-data-fallback'
      },
      { status: 500 }
    );
  }
}
