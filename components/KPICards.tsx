'use client';

import React from 'react';
import { KPIData } from '@/types';
import { Zap, TrendingUp, Activity, PoundSterling } from 'lucide-react';

interface KPICardsProps {
  kpis: KPIData;
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <Zap className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Total Consumption</h3>
        <p className="kpi-value">
          {kpis.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="kpi-unit">kWh across selection</p>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <PoundSterling className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Total Spend</h3>
        <p className="kpi-value">
          {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(kpis.totalCost)}
        </p>
        <p className="kpi-unit">inclusive of credits</p>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Average Monthly</h3>
        <p className="kpi-value">
          {Math.round(kpis.avgMonthlyKwh).toLocaleString()}
        </p>
        <p className="kpi-unit">kWh per month</p>
      </div>

      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <Activity className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Cost Intensity</h3>
        <p className="kpi-value">
          £{kpis.avgCostPerKwh.toFixed(3)}
        </p>
        <p className="kpi-unit">per kWh • {kpis.activeMeters} active meters</p>
      </div>
    </div>
  );
}
