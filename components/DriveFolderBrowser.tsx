'use client';

import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

interface DriveFolderBrowserProps {
  onFolderSelect: (folderId: string, folderName: string) => void;
  onClose: () => void;
}

export function DriveFolderBrowser({ onFolderSelect, onClose }: DriveFolderBrowserProps) {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const fetchFolders = async (parentId?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/drive-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch folders');
      }

      setFolders(data.folders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load Google Drive folders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders(); // Load root folders
  }, []);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderSelect = (folderId: string, folderName: string) => {
    setSelectedFolder(folderId);
    onFolderSelect(folderId, folderName);
  };

  const renderFolder = (folder: DriveFolder, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder === folder.id;
    const isFolder = folder.mimeType === 'application/vnd.google-apps.folder';

    return (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-100 border border-blue-300' : ''
          }`}
          onClick={() => {
            if (isFolder) {
              toggleFolder(folder.id);
            }
          }}
        >
          {isFolder ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
          
          {isFolder ? (
            <Folder className="w-4 h-4 text-blue-500" />
          ) : (
            <File className="w-4 h-4 text-gray-500" />
          )}
          
          <span className="text-sm">{folder.name}</span>
          
          {isFolder && (
            <button
              className="ml-auto px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={(e) => {
                e.stopPropagation();
                handleFolderSelect(folder.id, folder.name);
              }}
            >
              Select
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Select Google Drive Folder</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose the folder containing your energy invoices
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading folders...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          )}

          {!loading && !error && folders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No folders found. Make sure you have access to Google Drive.
            </div>
          )}

          {!loading && !error && folders.length > 0 && (
            <div className="space-y-1">
              {folders.map((folder) => renderFolder(folder))}
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          {selectedFolder && (
            <button
              onClick={() => onClose()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Use Selected Folder
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
