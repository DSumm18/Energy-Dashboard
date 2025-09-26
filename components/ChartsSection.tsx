'use client';

import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { EnergyData } from '@/types';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartsSectionProps {
  data: EnergyData[];
  allMonths: string[];
}

export function ChartsSection({ data, allMonths }: ChartsSectionProps) {
  const monthlyTrendData: ChartData<'line'> = React.useMemo(() => {
    const gasData: { [key: string]: { kwh: number; label: string } } = {};
    const electricityData: { [key: string]: { kwh: number; label: string } } = {};
    const allKeys = new Set<string>();

    data.forEach(d => {
      const key = `${d.year}-${String(allMonths.indexOf(d.month)).padStart(2, '0')}`;
      allKeys.add(key);
      const label = `${d.month.substring(0, 3)} ${String(d.year).slice(-2)}`;

      if (d.energyType === 'Gas') {
        if (!gasData[key]) gasData[key] = { kwh: 0, label: label };
        gasData[key].kwh += d.totalKwh;
      } else if (d.energyType === 'Electricity') {
        if (!electricityData[key]) electricityData[key] = { kwh: 0, label: label };
        electricityData[key].kwh += d.totalKwh;
      }
    });

    const sortedKeys = Array.from(allKeys).sort();
    const labels = sortedKeys.map(key => (gasData[key] || electricityData[key]).label);

    const gasChartData = sortedKeys.map(key => gasData[key] ? gasData[key].kwh : null);
    const electricityChartData = sortedKeys.map(key => electricityData[key] ? electricityData[key].kwh : null);

    return {
      labels,
      datasets: [
        {
          label: 'Electricity',
          data: electricityChartData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Gas',
          data: gasChartData,
          borderColor: 'rgba(245, 158, 11, 1)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [data, allMonths]);

  const schoolComparisonData: ChartData<'bar'> = React.useMemo(() => {
    const schoolData = data.reduce((acc, d) => {
      if (!acc[d.schoolName]) acc[d.schoolName] = 0;
      acc[d.schoolName] += d.totalKwh;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(schoolData).sort();
    const chartData = labels.map(label => schoolData[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Total kWh by School',
          data: chartData,
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)',
            'rgba(245, 158, 11, 0.7)',
            'rgba(139, 92, 246, 0.7)',
            'rgba(236, 72, 153, 0.7)',
            'rgba(14, 165, 233, 0.7)',
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(14, 165, 233, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const hasCostData = React.useMemo(() => data.some(item => typeof item.totalCost === 'number'), [data]);

  const costTrendData = React.useMemo(() => {
    if (!hasCostData) return null;

    const costData: { [key: string]: { cost: number; label: string } } = {};
    const keys = new Set<string>();

    data.forEach(d => {
      if (typeof d.totalCost !== 'number') return;
      const key = `${d.year}-${String(allMonths.indexOf(d.month)).padStart(2, '0')}`;
      keys.add(key);
      const label = `${d.month.substring(0, 3)} ${String(d.year).slice(-2)}`;
      if (!costData[key]) costData[key] = { cost: 0, label };
      costData[key].cost += d.totalCost;
    });

    const sortedKeys = Array.from(keys).sort();
    const labels = sortedKeys.map(key => costData[key].label);
    const costs = sortedKeys.map(key => costData[key].cost);

    return {
      labels,
      datasets: [
        {
          label: 'Total Spend',
          data: costs,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [data, allMonths, hasCostData]);

  const costBySchoolData = React.useMemo(() => {
    if (!hasCostData) return null;
    const schoolData = data.reduce((acc, d) => {
      if (typeof d.totalCost !== 'number') return acc;
      if (!acc[d.schoolName]) acc[d.schoolName] = 0;
      acc[d.schoolName] += d.totalCost;
      return acc;
    }, {} as { [key: string]: number });

    const labels = Object.keys(schoolData).sort();
    const costs = labels.map(label => schoolData[label]);

    return {
      labels,
      datasets: [
        {
          label: 'Total Spend (£)',
          data: costs,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data, hasCostData]);

  const formatTickLabel = (value: string | number) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(numericValue) ? String(value) : numericValue.toLocaleString();
  };

  const formatTooltipLabel = (label: string | undefined, value: number | null | undefined) => {
    const safeLabel = label ?? 'Value';
    const safeValue = typeof value === 'number' ? value.toLocaleString() : '0';
    return `${safeLabel}: ${safeValue} kWh`;
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            formatTooltipLabel(context.dataset.label, context.parsed.y),
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback(value: string | number) {
            return `${formatTickLabel(value)} kWh`;
          },
        }
      }
    }
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            const value = typeof context.parsed.x === 'number' ? context.parsed.x : context.parsed.y;
            return formatTooltipLabel(context.dataset.label, value);
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback(value: string | number) {
            return `${formatTickLabel(value)} kWh`;
          },
        },
      },
      y: {
        ticks: {
          autoSkip: false,
        },
      },
    },
  };

  const costOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: £${context.parsed.y?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '£' + Number(value).toLocaleString();
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="card p-6 xl:col-span-2">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Consumption Trend</h3>
        <div className="h-80">
          <Line data={monthlyTrendData} options={chartOptions} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumption by School</h3>
        <div className="h-80">
          <Bar data={schoolComparisonData} options={barOptions} />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Energy Spend Trend</h3>
        <div className="h-80 flex items-center justify-center">
          {costTrendData ? (
            <Line data={costTrendData} options={costOptions} />
          ) : (
            <p className="text-sm text-gray-500 text-center px-6">
              Add invoice cost data to visualise monthly spend alongside usage.
            </p>
          )}
        </div>
      </div>

      {costBySchoolData && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Spend by School</h3>
          <div className="h-80">
            <Bar data={costBySchoolData} options={{ ...barOptions, plugins: { ...barOptions.plugins } }} />
          </div>
        </div>
      )}
    </div>
  );
}
