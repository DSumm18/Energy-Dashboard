'use client';

import React from 'react';
import { EnergyData, UsageAnomaly } from '@/types';
import { AlertTriangle, TrendingDown, TrendingUp, PiggyBank } from 'lucide-react';

interface InsightsPanelProps {
  data: EnergyData[];
  anomalies: UsageAnomaly[];
}

function formatCurrency(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
}

export function InsightsPanel({ data, anomalies }: InsightsPanelProps) {
  const totalCost = data.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);
  const costBySchool = data.reduce<Record<string, number>>((acc, item) => {
    if (typeof item.totalCost !== 'number') return acc;
    acc[item.schoolName] = (acc[item.schoolName] || 0) + item.totalCost;
    return acc;
  }, {});

  const highestSpendSchool = Object.entries(costBySchool).sort((a, b) => b[1] - a[1])[0];
  const hasCostData = data.some((item) => typeof item.totalCost === 'number');
  const topAnomalies = anomalies.slice(0, 4);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Operational Insights</h3>
        <AlertTriangle className="w-5 h-5 text-amber-500" />
      </div>

      <div className="space-y-4 text-sm text-gray-600">
        {topAnomalies.length > 0 ? (
          <div>
            <p className="font-medium text-gray-800 mb-2">Usage anomalies detected</p>
            <ul className="space-y-2">
              {topAnomalies.map((anomaly) => (
                <li key={anomaly.id} className="flex items-start gap-2">
                  {anomaly.direction === 'increase' ? (
                    <TrendingUp className="w-4 h-4 text-rose-500 mt-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-sky-500 mt-1" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {anomaly.schoolName} • {anomaly.month} {anomaly.year}
                    </p>
                    <p>
                      {anomaly.direction === 'increase' ? 'Usage spiked' : 'Usage dropped'} by
                      {' '}
                      <span className="font-semibold">
                        {Math.abs(anomaly.deviation)}σ
                      </span>
                      {anomaly.totalCost !== undefined && (
                        <>
                          {' '}({formatCurrency(anomaly.totalCost)} billed)
                        </>
                      )}
                      . Baseline: {anomaly.baseline.toLocaleString()} kWh.
                    </p>
                    {typeof anomaly.costDeviation === 'number' && (
                      <p className="text-xs text-amber-600">
                        Spend deviated by {Math.abs(anomaly.costDeviation)}σ from normal levels.
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-500">No unusual usage patterns detected for the current filters.</p>
        )}

        {hasCostData ? (
          <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
            <PiggyBank className="w-5 h-5 text-emerald-600 mt-1" />
            <div>
              <p className="font-medium text-gray-800">Financial summary</p>
              <p>Total spend: <span className="font-semibold">{formatCurrency(totalCost)}</span></p>
              {highestSpendSchool && (
                <p>
                  Largest outlay: <span className="font-semibold">{highestSpendSchool[0]}</span>
                  {' '}({formatCurrency(highestSpendSchool[1])})
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Add cost data to unlock financial insights.</p>
        )}
      </div>
    </div>
  );
}
