'use client';

import React, { useState, useEffect } from 'react';
import { EnergyData } from '@/types';
import { VehicleData } from '@/types/carbon';
import { generateSECRReport, formatCarbonEmissions, getCarbonIntensityLabel, getCarbonIntensityColor } from '@/lib/carbon-calculations';
import { Leaf, Download, Car, Zap, Flame } from 'lucide-react';

export default function CarbonReportingDashboard() {
  const [energyData, setEnergyData] = useState<EnergyData[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pupilCount, setPupilCount] = useState<number>(1000); // Default for demo

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/energy-data');
        const result = await response.json();

        if (result.success) {
          setEnergyData(result.data);
        }

        const vehicleResponse = await fetch('/api/vehicle-data');
        const vehicleResult = await vehicleResponse.json();

        if (vehicleResult.success) {
          setVehicleData(vehicleResult.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const secrReport = generateSECRReport(energyData, vehicleData, selectedYear, pupilCount);
  const availableYears = Array.from(new Set(energyData.map(d => d.year))).sort((a, b) => a - b);

  const exportSECRReport = () => {
    const reportData = {
      ...secrReport,
      generatedAt: new Date().toISOString(),
      emissionFactors: {
        electricity: 0.212,
        gas: 0.202,
        transport: {
          petrol: 0.192,
          diesel: 0.171,
          electric: 0.053,
          hybrid: 0.120,
        }
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SECR-Report-${selectedYear}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading carbon reporting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Leaf className="w-8 h-8 text-green-600" />
              SECR Carbon Reporting
            </h1>
            <p className="text-gray-500 mt-1">
              Streamlined Energy and Carbon Reporting for Academic Trust
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              Pupils & staff:
              <input
                type="number"
                min={1}
                value={pupilCount}
                onChange={(e) => setPupilCount(Number(e.target.value) || 0)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              onClick={exportSECRReport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </header>

        {/* SECR Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Leaf className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">Total Carbon Emissions</h3>
            <p className="text-3xl font-bold text-green-600">
              {formatCarbonEmissions(secrReport.totalCarbonEmissions)}
            </p>
            <p className="text-sm text-gray-500 mt-1">CO2e equivalent</p>
          </div>

          <div className="card p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">Electricity</h3>
            <p className="text-2xl font-bold text-blue-600">
              {secrReport.totalElectricityKwh.toLocaleString()} kWh
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatCarbonEmissions(secrReport.totalElectricityKwh * 0.212)}
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Flame className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">Gas</h3>
            <p className="text-2xl font-bold text-orange-600">
              {secrReport.totalGasKwh.toLocaleString()} kWh
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatCarbonEmissions(secrReport.totalGasKwh * 0.202)}
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="flex items-center justify-center mb-3">
              <Car className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-500 mb-2">Transport</h3>
            <p className="text-2xl font-bold text-purple-600">
              {secrReport.totalTransportMiles.toLocaleString()} miles
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {formatCarbonEmissions(secrReport.totalTransportMiles * 0.171 * 1.60934)}
            </p>
          </div>
        </div>

        {/* Carbon Intensity */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Carbon Intensity</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-800">
                {secrReport.carbonIntensity.toFixed(1)} kg CO2e
              </p>
              <p className="text-gray-500">per pupil/staff member</p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-bold ${getCarbonIntensityColor(secrReport.carbonIntensity)}`}>
                {getCarbonIntensityLabel(secrReport.carbonIntensity)}
              </span>
              <p className="text-gray-500">Intensity Level</p>
            </div>
          </div>
        </div>

        {/* Emission Factors Reference */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">UK Government Emission Factors (2023)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-semibold">Electricity</p>
              <p className="text-sm text-gray-600">0.212 kg CO2e/kWh</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <p className="font-semibold">Gas</p>
              <p className="text-sm text-gray-600">0.202 kg CO2e/kWh</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <Car className="w-6 h-6 text-red-600 mx-auto mb-2" />
              <p className="font-semibold">Petrol</p>
              <p className="text-sm text-gray-600">0.192 kg CO2e/km</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Car className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold">Diesel</p>
              <p className="text-sm text-gray-600">0.171 kg CO2e/km</p>
            </div>
          </div>
        </div>

        {/* Data Preparation Notice */}
        <div className="card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Ready for Additional Data</h3>
          <p className="text-blue-700 mb-4">
            Your dashboard is prepared to accept additional data for comprehensive SECR reporting:
          </p>
          <ul className="list-disc list-inside text-blue-700 space-y-1">
            <li><strong>Vehicle mileage data</strong> - Add a &quot;VehicleData&quot; sheet to your Google Sheet</li>
            <li><strong>Pupil/staff counts</strong> - For accurate carbon intensity calculations</li>
            <li><strong>Previous year data</strong> - For year-on-year comparisons</li>
            <li><strong>Additional energy sources</strong> - Solar, biomass, etc.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
