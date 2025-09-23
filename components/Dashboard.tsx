'use client';

import React, { useState, useEffect } from 'react';
import { EnergyData, FilterState, KPIData } from '@/types';
import { KPICards } from './KPICards';
import { FilterPanel } from './FilterPanel';
import { ChartsSection } from './ChartsSection';
import { DataTable } from './DataTable';
import { RefreshButton } from './RefreshButton';

export default function Dashboard() {
  const [data, setData] = useState<EnergyData[]>([]);
  const [filteredData, setFilteredData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    school: 'All Schools',
    meter: 'All Meters',
    energyType: 'All Types',
    compareMonth: 'All',
    fromMonth: 0,
    fromYear: 2024,
    toMonth: 11,
    toYear: 2026,
  });

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/energy-data');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setLastRefreshed(new Date());
      } else {
        console.error('Failed to fetch data:', result.error);
        setLastRefreshed(new Date());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, filters]);

  const applyFilters = () => {
    let filtered = [...data];

    // School filter
    if (filters.school !== 'All Schools') {
      filtered = filtered.filter(d => d.schoolName === filters.school);
    }

    // Meter filter
    if (filters.meter !== 'All Meters') {
      filtered = filtered.filter(d => d.meterNumber === filters.meter);
    }

    // Energy type filter
    if (filters.energyType !== 'All Types') {
      filtered = filtered.filter(d => d.energyType === filters.energyType);
    }

    // Date range filter
    if (filters.compareMonth !== 'All') {
      filtered = filtered.filter(d => d.month === filters.compareMonth);
    } else {
      filtered = filtered.filter(d => {
        const itemMonthIndex = allMonths.indexOf(d.month);
        const fromMatch = d.year > filters.fromYear || 
          (d.year === filters.fromYear && itemMonthIndex >= filters.fromMonth);
        const toMatch = d.year < filters.toYear || 
          (d.year === filters.toYear && itemMonthIndex <= filters.toMonth);
        return fromMatch && toMatch;
      });
    }

    setFilteredData(filtered);
  };

  const calculateKPIs = (): KPIData => {
    const totalKwh = filteredData.reduce((sum, d) => sum + d.totalKwh, 0);
    
    const monthlyAverages: { [key: string]: number } = {};
    filteredData.forEach(d => {
      const key = `${d.year}-${d.month}`;
      if (!monthlyAverages[key]) monthlyAverages[key] = 0;
      monthlyAverages[key] += d.totalKwh;
    });
    
    const monthlyValues = Object.values(monthlyAverages);
    const avgMonthlyKwh = monthlyValues.length ? 
      monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length : 0;
    
    const activeMeters = new Set(filteredData.map(d => d.meterNumber)).size;

    return {
      totalKwh,
      avgMonthlyKwh,
      activeMeters,
    };
  };

  const getAvailableMeters = () => {
    const schoolData = filters.school === 'All Schools' ? data : data.filter(d => d.schoolName === filters.school);
    return [...new Set(schoolData.map(d => d.meterNumber))].sort();
  };

  const getDateRangeDisplay = () => {
    if (filteredData.length === 0) return 'No data in selected range';
    
    if (filters.compareMonth !== 'All') {
      const years = [...new Set(filteredData.map(d => d.year))].sort();
      return `Comparing ${filters.compareMonth} for years: ${years.join(', ')}`;
    } else {
      const dates = filteredData.map(d => new Date(d.year, allMonths.indexOf(d.month)));
      const minDate = new Date(Math.min.apply(null, dates));
      const maxDate = new Date(Math.max.apply(null, dates));
      return `Displaying data from: ${minDate.toLocaleString('default', { month: 'short' })} ${minDate.getFullYear()} to ${maxDate.toLocaleString('default', { month: 'short' })} ${maxDate.getFullYear()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Energy Consumption Dashboard</h1>
            <p className="text-gray-500 mt-1">
              Last refreshed: {lastRefreshed ? lastRefreshed.toLocaleString() : 'Loading...'}
            </p>
          </div>
          <RefreshButton onRefresh={fetchData} loading={loading} />
        </header>

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          data={data}
          availableMeters={getAvailableMeters()}
          allMonths={allMonths}
        />

        {/* Date Range Display */}
        <div className="text-center">
          <p className="text-sm text-primary-600 font-semibold">
            {getDateRangeDisplay()}
          </p>
        </div>

        {/* KPIs */}
        <KPICards kpis={calculateKPIs()} />

        {/* Charts */}
        <ChartsSection data={filteredData} allMonths={allMonths} />

        {/* Data Table */}
        <DataTable data={filteredData} allMonths={allMonths} />
      </div>
    </div>
  );
}
