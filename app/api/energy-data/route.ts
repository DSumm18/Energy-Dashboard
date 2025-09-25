import { NextResponse } from 'next/server';
import { getAllEnergyData, getMockEnergyData } from '@/lib/google-sheets';

export async function GET() {
  try {
    // Check if we have Google Sheets credentials
    const hasCredentials = process.env.GOOGLE_SHEETS_API_KEY && process.env.GOOGLE_SHEETS_ID;
    
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
