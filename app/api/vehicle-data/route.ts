import { NextResponse } from 'next/server';
import { VehicleData } from '@/types/carbon';

// Mock vehicle data for development - replace with Google Sheets integration
function getMockVehicleData(): VehicleData[] {
  return [
    // Example vehicle data - replace with your actual data
    { schoolName: "Hollingwood Primary School", vehicleType: "Car", fuelType: "Petrol", mileage: 1200, year: 2025, month: "October" },
    { schoolName: "Hollingwood Primary School", vehicleType: "Van", fuelType: "Diesel", mileage: 800, year: 2025, month: "October" },
    { schoolName: "Laycock Primary School", vehicleType: "Car", fuelType: "Petrol", mileage: 950, year: 2025, month: "October" },
    { schoolName: "Crossley Hall Primary School", vehicleType: "Bus", fuelType: "Diesel", mileage: 1500, year: 2025, month: "October" },
    { schoolName: "Grove House Primary School", vehicleType: "Car", fuelType: "Electric", mileage: 600, year: 2025, month: "October" },
  ];
}

export async function GET() {
  try {
    // TODO: Implement Google Sheets integration for vehicle data
    // For now, return mock data
    const data = getMockVehicleData();

    return NextResponse.json({
      success: true,
      data,
      lastUpdated: new Date().toISOString(),
      source: 'mock-data'
    });
  } catch (error) {
    console.error('Error fetching vehicle data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vehicle data',
        data: getMockVehicleData(),
        source: 'mock-data-fallback'
      },
      { status: 500 }
    );
  }
}
