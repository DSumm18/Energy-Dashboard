'use client';

import React, { useState } from 'react';
import { DownloadCloud, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DriveSyncButtonProps {
  onCompleted?: () => void;
}

export function DriveSyncButton({ onCompleted }: DriveSyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const response = await fetch('/api/drive-sync', { method: 'POST' });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Drive sync failed');
      }

      const summary = payload.summary;
      const processed = summary?.processed ?? 0;
      const inserted = summary?.recordsInserted ?? 0;
      const updated = summary?.recordsUpdated ?? 0;
      const errors = summary?.errors ?? [];

      setStatus(errors.length > 0 ? 'error' : 'success');
      setMessage(
        `Processed ${processed} new records (${inserted} added, ${updated} updated).` +
        (errors.length > 0 ? ` ${errors.length} file(s) could not be processed.` : '')
      );
      onCompleted?.();
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Unable to sync Google Drive invoices.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${loading
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg'
          }
        `}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <DownloadCloud className="w-4 h-4" />
        )}
        {loading ? 'Syncing Drive…' : 'Sync invoices from Drive'}
      </button>
      {message && (
        <div className={`flex items-center text-sm ${status === 'success' ? 'text-emerald-600' : 'text-amber-600'}`}>
          {status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mr-2" />
          ) : (
            <AlertTriangle className="w-4 h-4 mr-2" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
