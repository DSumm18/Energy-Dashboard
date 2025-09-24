'use client';

import React from 'react';
import { EnergyData } from '@/types';
import { Zap, Flame } from 'lucide-react';

interface DataTableProps {
  data: EnergyData[];
  allMonths: string[];
}

export function DataTable({ data, allMonths }: DataTableProps) {
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => {
      if (a.schoolName !== b.schoolName) return a.schoolName.localeCompare(b.schoolName);
      if (a.year !== b.year) return a.year - b.year;
      return allMonths.indexOf(a.month) - allMonths.indexOf(b.month);
    });
  }, [data, allMonths]);

  const hasCost = React.useMemo(() => data.some(item => typeof item.totalCost === 'number'), [data]);

  const getEnergyIcon = (type: string) => {
    switch (type) {
      case 'Electricity':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'Gas':
        return <Flame className="w-4 h-4 text-orange-500" />;
      default:
        return <Zap className="w-4 h-4 text-gray-500" />;
    }
  };

  if (data.length === 0) {
    return (
      <div className="card overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800">Detailed Data</h3>
        </div>
        <div className="px-6 pb-6">
          <div className="text-center py-8 text-gray-500">
            No data available for the selected filters.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800">Detailed Data</h3>
        <p className="text-sm text-gray-500 mt-1">
          Showing {data.length} record{data.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                School
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Meter (MPAN)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Month
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total kWh
              </th>
              {hasCost && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Cost
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr key={`${item.schoolName}-${item.meterNumber}-${item.year}-${item.month}`}
                  className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {item.schoolName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                  {item.meterNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  <div className="flex items-center justify-center">
                    {getEnergyIcon(item.energyType)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                  {item.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </td>
                {hasCost && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                    {typeof item.totalCost === 'number'
                      ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(item.totalCost)
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
