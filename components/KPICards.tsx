'use client';

import React from 'react';
import { KPIData } from '@/types';
import { Zap, TrendingUp, Activity } from 'lucide-react';

interface KPICardsProps {
  kpis: KPIData;
}

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Consumption */}
      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <Zap className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Total Consumption</h3>
        <p className="kpi-value">
          {kpis.totalKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </p>
        <p className="kpi-unit">kWh</p>
      </div>

      {/* Average Monthly */}
      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <TrendingUp className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Average Monthly</h3>
        <p className="kpi-value">
          {Math.round(kpis.avgMonthlyKwh).toLocaleString()}
        </p>
        <p className="kpi-unit">kWh</p>
      </div>

      {/* Active Meters */}
      <div className="kpi-card">
        <div className="flex items-center justify-center mb-2">
          <Activity className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="kpi-label">Active Meters</h3>
        <p className="kpi-value">{kpis.activeMeters}</p>
        <p className="kpi-unit">meters reporting</p>
      </div>
    </div>
  );
}
