'use client';

import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { EnergyData } from '@/types';

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
  const monthlyTrendData = React.useMemo(() => {
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

  const schoolComparisonData = React.useMemo(() => {
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

  const chartOptions = {
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
            return `${context.dataset.label}: ${context.parsed.y?.toLocaleString()} kWh`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return value.toLocaleString() + ' kWh';
          }
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    indexAxis: 'y' as const,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Trend Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Consumption Trend</h3>
        <div className="h-80">
          <Line data={monthlyTrendData} options={chartOptions} />
        </div>
      </div>

      {/* School Comparison Chart */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumption by School</h3>
        <div className="h-80">
          <Bar data={schoolComparisonData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
