'use client';

import React from 'react';
import { FilterState, EnergyData } from '@/types';
import { Building2, Zap, Flame } from 'lucide-react';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  data: EnergyData[];
  availableMeters: string[];
  allMonths: string[];
}

export function FilterPanel({ 
  filters, 
  onFiltersChange, 
  data, 
  availableMeters, 
  allMonths 
}: FilterPanelProps) {
  const schools = Array.from(new Set(data.map(d => d.schoolName))).sort();
  const energyTypes = Array.from(new Set(data.map(d => d.energyType))).sort();
  const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset meter filter when school changes
    if (key === 'school') {
      newFilters.meter = 'All Meters';
    }
    
    onFiltersChange(newFilters);
  };

  const getEnergyIcon = (type: string) => {
    switch (type) {
      case 'Electricity':
        return <Zap className="w-4 h-4" />;
      case 'Gas':
        return <Flame className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-end">
        {/* School Filter */}
        <div className="xl:col-span-1">
          <label htmlFor="school-filter" className="block text-sm font-medium text-gray-700 mb-1">
            School
          </label>
          <select
            id="school-filter"
            value={filters.school}
            onChange={(e) => handleFilterChange('school', e.target.value)}
            className="filter-select w-full"
          >
            <option value="All Schools">All Schools</option>
            {schools.map(school => (
              <option key={school} value={school}>{school}</option>
            ))}
          </select>
        </div>

        {/* Meter Filter */}
        <div className="xl:col-span-1">
          <label htmlFor="meter-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Meter (MPAN)
          </label>
          <select
            id="meter-filter"
            value={filters.meter}
            onChange={(e) => handleFilterChange('meter', e.target.value)}
            className="filter-select w-full"
          >
            <option value="All Meters">All Meters</option>
            {availableMeters.map(meter => (
              <option key={meter} value={meter}>{meter}</option>
            ))}
          </select>
        </div>

        {/* Energy Type Filter */}
        <div className="xl:col-span-1">
          <label htmlFor="energy-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Energy Type
          </label>
          <select
            id="energy-filter"
            value={filters.energyType}
            onChange={(e) => handleFilterChange('energyType', e.target.value)}
            className="filter-select w-full"
          >
            <option value="All Types">All Types</option>
            {energyTypes.map(type => (
              <option key={type} value={type}>
                <span className="flex items-center gap-2">
                  {getEnergyIcon(type)}
                  {type}
                </span>
              </option>
            ))}
          </select>
        </div>

        {/* Compare Month Filter */}
        <div className="xl:col-span-1">
          <label htmlFor="compare-month-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Compare Month
          </label>
          <select
            id="compare-month-filter"
            value={filters.compareMonth}
            onChange={(e) => handleFilterChange('compareMonth', e.target.value)}
            className="filter-select w-full"
          >
            <option value="All">All Months (Use Date Range)</option>
            {allMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="col-span-full sm:col-span-2 lg:col-span-3 xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <div className="flex items-center space-x-2">
            <select
              value={filters.fromMonth}
              onChange={(e) => handleFilterChange('fromMonth', parseInt(e.target.value))}
              className="filter-select flex-1"
              disabled={filters.compareMonth !== 'All'}
            >
              {allMonths.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={filters.fromYear}
              onChange={(e) => handleFilterChange('fromYear', parseInt(e.target.value))}
              className="filter-select flex-1"
              disabled={filters.compareMonth !== 'All'}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-gray-500 text-sm">to</span>
            <select
              value={filters.toMonth}
              onChange={(e) => handleFilterChange('toMonth', parseInt(e.target.value))}
              className="filter-select flex-1"
              disabled={filters.compareMonth !== 'All'}
            >
              {allMonths.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={filters.toYear}
              onChange={(e) => handleFilterChange('toYear', parseInt(e.target.value))}
              className="filter-select flex-1"
              disabled={filters.compareMonth !== 'All'}
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
