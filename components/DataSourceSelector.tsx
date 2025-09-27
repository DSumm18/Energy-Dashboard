'use client';

import React, { useState, useEffect } from 'react';
import { Database, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ExtractionRun {
  id: string;
  name: string;
  timestamp: string;
  recordCount: number;
  processedCount: number;
  skippedCount: number;
  errors: { file: string; message: string }[];
}

interface DatabaseStats {
  totalRuns: number;
  totalRecords: number;
  currentRunId: string | null;
  currentRunName: string | null;
  currentRecordCount: number;
}

interface DataSourceSelectorProps {
  onDataSourceChange?: (runId: string | null) => void;
}

export default function DataSourceSelector({ onDataSourceChange }: DataSourceSelectorProps) {
  const [runs, setRuns] = useState<ExtractionRun[]>([]);
  const [currentRun, setCurrentRun] = useState<ExtractionRun | null>(null);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRuns = async () => {
    try {
      const response = await fetch('/api/extraction-runs');
      const result = await response.json();
      
      if (result.success) {
        setRuns(result.runs);
        setCurrentRun(result.currentRun);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Error fetching extraction runs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleRunSelect = async (runId: string) => {
    try {
      const response = await fetch('/api/extraction-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId })
      });
      
      const result = await response.json();
      if (result.success) {
        setCurrentRun(runs.find(r => r.id === runId) || null);
        onDataSourceChange?.(runId);
        // Refresh the page to load new data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error setting current run:', error);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!confirm('Are you sure you want to delete this extraction run? This action cannot be undone.')) {
      return;
    }

    setDeleting(runId);
    try {
      const response = await fetch(`/api/extraction-runs?runId=${runId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        await fetchRuns(); // Refresh the list
        onDataSourceChange?.(null);
      }
    } catch (error) {
      console.error('Error deleting run:', error);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Database className="w-5 h-5" />
          <span className="font-medium">No Extraction Data</span>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          Upload and process some invoice PDFs to see your extracted data here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Data Sources</h3>
        </div>
        {stats && (
          <div className="text-sm text-gray-500">
            {stats.totalRuns} runs, {stats.totalRecords} total records
          </div>
        )}
      </div>

      {/* Current Run Indicator */}
      {currentRun && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium text-sm">Currently Viewing:</span>
          </div>
          <div className="text-green-700 text-sm mt-1">
            {currentRun.name} ({currentRun.recordCount} records)
          </div>
          <div className="text-green-600 text-xs mt-1">
            {formatDate(currentRun.timestamp)}
          </div>
        </div>
      )}

      {/* Runs List */}
      <div className="space-y-2">
        {runs.map((run) => (
          <div
            key={run.id}
            className={`border rounded-lg p-3 transition-colors ${
              currentRun?.id === run.id
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">
                    {run.name}
                  </span>
                  {currentRun?.id === run.id && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(run.timestamp)}
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                  <span>{run.recordCount} records</span>
                  <span>{run.processedCount} processed</span>
                  {run.skippedCount > 0 && (
                    <span className="text-orange-600">{run.skippedCount} skipped</span>
                  )}
                  {run.errors.length > 0 && (
                    <span className="text-red-600">{run.errors.length} errors</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {currentRun?.id !== run.id && (
                  <button
                    onClick={() => handleRunSelect(run.id)}
                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Select
                  </button>
                )}
                <button
                  onClick={() => handleDeleteRun(run.id)}
                  disabled={deleting === run.id}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  title="Delete this extraction run"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-gray-500 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium">Data Source Priority:</p>
            <p>1. Local Database (extracted invoices) → 2. Google Sheets → 3. Demo Data</p>
          </div>
        </div>
      </div>
    </div>
  );
}
