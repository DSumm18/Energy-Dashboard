'use client';

import React, { useState } from 'react';
import { DownloadCloud, Loader2, CheckCircle2, AlertTriangle, FolderOpen, Upload } from 'lucide-react';
import { DriveFolderBrowser } from './DriveFolderBrowser';
import { LocalFileBrowser } from './LocalFileBrowser';

interface DriveSyncButtonProps {
  onCompleted?: () => void;
}

export function DriveSyncButton({ onCompleted }: DriveSyncButtonProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showLocalBrowser, setShowLocalBrowser] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<{id: string, name: string} | null>(null);

  const handleSync = async (folderId?: string) => {
    setLoading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const response = await fetch('/api/drive-sync', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId || selectedFolder?.id }),
      });
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

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolder({ id: folderId, name: folderName });
    setShowFolderBrowser(false);
    // Automatically start sync after folder selection
    handleSync(folderId);
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => setShowLocalBrowser(true)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-lg'
            }
          `}
        >
          <Upload className="w-4 h-4" />
          Upload Local Files
        </button>
        
        <button
          onClick={() => setShowFolderBrowser(true)}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
            ${loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
            }
          `}
        >
          <FolderOpen className="w-4 h-4" />
          {selectedFolder ? `Change Folder` : 'Select Folder'}
        </button>
        
        {selectedFolder && (
          <button
            onClick={() => handleSync()}
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
        )}
      </div>
      
      {selectedFolder && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedFolder.name}</span>
        </div>
      )}
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
      
      {showFolderBrowser && (
        <DriveFolderBrowser
          onFolderSelect={handleFolderSelect}
          onClose={() => setShowFolderBrowser(false)}
        />
      )}
      
      {showLocalBrowser && (
        <LocalFileBrowser
          onFilesSelected={() => {}} // Not used in this implementation
          onClose={() => setShowLocalBrowser(false)}
        />
      )}
    </div>
  );
}
