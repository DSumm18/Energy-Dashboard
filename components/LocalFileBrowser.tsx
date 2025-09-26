'use client';

import React, { useState } from 'react';
import { Folder, File, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LocalFileBrowserProps {
  onFilesSelected: (files: File[]) => void;
  onClose: () => void;
}

export function LocalFileBrowser({ onFilesSelected, onClose }: LocalFileBrowserProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const supportedFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/')
    );
    
    setSelectedFiles(supportedFiles);
    setStatus('idle');
    setMessage(null);
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const supportedFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type.startsWith('image/')
    );
    
    setSelectedFiles(supportedFiles);
    setStatus('idle');
    setMessage(null);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setStatus('idle');
    setMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/local-extraction', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'File processing failed');
      }

      setStatus('success');
      const messageParts = [
        `Processed ${result.processedCount} new files`,
        result.skippedCount > 0 ? `${result.skippedCount} already processed` : null,
        `${result.recordsInserted} records added`,
        result.foldersScanned > 1 ? `${result.foldersScanned} folders scanned` : null
      ].filter(Boolean);
      
      setMessage(messageParts.join(' • '));
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
        // Trigger a refresh of the dashboard data
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Failed to process files');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Upload Energy Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a folder to automatically scan for all invoice files, or choose individual files
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Folder Selection */}
            <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center bg-green-50">
              <Folder className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Folder
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose a folder to scan all subfolders for invoice files
              </p>
              
              <input
                type="file"
                {...({ webkitdirectory: "" } as any)}
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFolderSelect}
                className="hidden"
                id="folder-input"
              />
              
              <label
                htmlFor="folder-input"
                className="inline-flex items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 cursor-pointer"
              >
                <Folder className="w-4 h-4 mr-2" />
                Choose Folder
              </label>
            </div>

            {/* Individual File Selection */}
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-blue-50">
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select Files
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose individual PDF or image files
              </p>
              
              <input
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.gif,.webp"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              
              <label
                htmlFor="file-input"
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </label>
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Found Files ({selectedFiles.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {file.type === 'application/pdf' ? (
                      <File className="w-5 h-5 text-red-500" />
                    ) : (
                      <File className="w-5 h-5 text-blue-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {file.webkitRelativePath && (
                          <span className="ml-2 text-gray-400">
                            • {file.webkitRelativePath.split('/').slice(0, -1).join('/')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-4 flex items-center gap-2 p-4 rounded-lg ${
              status === 'success' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm ${
                status === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {message}
              </span>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Process Files
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
