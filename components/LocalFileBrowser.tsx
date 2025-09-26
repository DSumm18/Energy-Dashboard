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
      setMessage(`Successfully processed ${result.processedCount} files. ${result.recordsInserted} records added to your dashboard.`);
      
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
            Select PDF or image files from your local Google Drive folder
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Select Invoice Files
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose PDF or image files from your Google Drive folder
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
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Selected Files ({selectedFiles.length})
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
