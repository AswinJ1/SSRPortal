'use client';

import React, { useState } from 'react';
import { Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// Define available columns for export
const AVAILABLE_COLUMNS = [
  { id: 'teamNumber', label: 'Team Number', category: 'Team Details' },
  { id: 'teamStatus', label: 'Team Status', category: 'Team Details' },
  { id: 'projectTitle', label: 'Project Title', category: 'Team Details' },
  { id: 'projectPillar', label: 'Project Pillar', category: 'Team Details' },
  { id: 'batch', label: 'Batch', category: 'Team Details' },
  { id: 'createdAt', label: 'Created Date', category: 'Team Details' },
  { id: 'updatedAt', label: 'Updated Date', category: 'Team Details' },
  
  { id: 'mentorName', label: 'Mentor Name', category: 'People' },
  { id: 'mentorEmail', label: 'Mentor Email', category: 'People' },
  { id: 'mentorPhone', label: 'Mentor Phone', category: 'People' },
  { id: 'leadName', label: 'Team Lead Name', category: 'People' },
  { id: 'leadEmail', label: 'Team Lead Email', category: 'People' },
  { id: 'leadPhone', label: 'Team Lead Phone', category: 'People' },
  
  { id: 'memberNames', label: 'Team Members (All Names)', category: 'Team Members' },
  { id: 'memberEmails', label: 'Member Emails (All)', category: 'Team Members' },
  { id: 'memberRoles', label: 'Member Roles (All)', category: 'Team Members' },
  { id: 'memberCount', label: 'Total Member Count', category: 'Team Members' },
  
  { id: 'proposalTitle', label: 'Proposal Title', category: 'Proposal Details' },
  { id: 'proposalDescription', label: 'Proposal Description', category: 'Proposal Details' },
  { id: 'proposalContent', label: 'Proposal Content', category: 'Proposal Details' },
  { id: 'proposalState', label: 'Proposal State', category: 'Proposal Details' },
  { id: 'proposalCategory', label: 'Proposal Category', category: 'Proposal Details' },
  { id: 'proposalLocationState', label: 'Proposal State/Location', category: 'Proposal Details' },
  { id: 'proposalDistrict', label: 'Proposal District', category: 'Proposal Details' },
  { id: 'proposalCity', label: 'Proposal City', category: 'Proposal Details' },
  { id: 'proposalPlaceVisited', label: 'Place Visited', category: 'Proposal Details' },
  { id: 'proposalTravelTime', label: 'Travel Time', category: 'Proposal Details' },
  { id: 'proposalExecutionTime', label: 'Execution Time', category: 'Proposal Details' },
  { id: 'proposalCompletionDate', label: 'Completion Date', category: 'Proposal Details' },
  { id: 'proposalGdriveLink', label: 'Google Drive Link', category: 'Proposal Details' },
  { id: 'proposalAttachment', label: 'Proposal Attachment', category: 'Proposal Details' },
  { id: 'proposalRemarks', label: 'Proposal Remarks', category: 'Proposal Details' },
  { id: 'proposalStatus', label: 'Proposal Status', category: 'Proposal Details' },
  { id: 'proposalSubmittedAt', label: 'Proposal Submitted Date', category: 'Proposal Details' },
];

const ExportPage = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(col => col.id) // All selected by default
  );
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Group columns by category
  const columnsByCategory = AVAILABLE_COLUMNS.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = [];
    }
    acc[column.category].push(column);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_COLUMNS>);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map(col => col.id));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleCategoryToggle = (category: string) => {
    const categoryColumns = columnsByCategory[category].map(col => col.id);
    const allSelected = categoryColumns.every(id => selectedColumns.includes(id));
    
    if (allSelected) {
      setSelectedColumns(prev => prev.filter(id => !categoryColumns.includes(id)));
    } else {
      setSelectedColumns(prev => Array.from(new Set([...prev, ...categoryColumns])));
    }
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      setExportStatus('error');
      setErrorMessage('Please select at least one column to export');
      return;
    }

    try {
      setIsExporting(true);
      setExportStatus('idle');
      setErrorMessage('');

      const response = await fetch('/api/admin/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columns: selectedColumns }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : `teams-export-${new Date().toISOString().split('T')[0]}.csv`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus('success');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Export Team Data</h1>
          <p className="mt-2 text-gray-600">
            Select the columns you want to export and download team information in CSV format
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column Selector Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-8">
              <div className="p-4 bg-blue-600 text-white">
                <h2 className="text-lg font-semibold flex items-center justify-between">
                  <span>Select Columns</span>
                  <span className="text-sm font-normal bg-blue-700 px-2 py-1 rounded">
                    {selectedColumns.length}/{AVAILABLE_COLUMNS.length}
                  </span>
                </h2>
              </div>
              
              <div className="p-4 border-b border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto">
                {Object.entries(columnsByCategory).map(([category, columns]) => {
                  const allSelected = columns.every(col => selectedColumns.includes(col.id));
                  const someSelected = columns.some(col => selectedColumns.includes(col.id));

                  return (
                    <div key={category} className="border-b border-gray-200 last:border-b-0">
                      <button
                        onClick={() => handleCategoryToggle(category)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = someSelected && !allSelected;
                            }}
                            onChange={() => handleCategoryToggle(category)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="font-medium text-gray-900">{category}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {columns.filter(col => selectedColumns.includes(col.id)).length}/{columns.length}
                        </span>
                      </button>
                      <div className="px-4 pb-2 space-y-2">
                        {columns.map(column => (
                          <label
                            key={column.id}
                            className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedColumns.includes(column.id)}
                              onChange={() => handleColumnToggle(column.id)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{column.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Main Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Export Info Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <FileText className="h-12 w-12 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      CSV Export
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Customize your export by selecting the columns you need from the sidebar.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Selected Columns: {selectedColumns.length}
                      </p>
                      {selectedColumns.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedColumns.slice(0, 5).map(colId => {
                            const column = AVAILABLE_COLUMNS.find(c => c.id === colId);
                            return (
                              <span
                                key={colId}
                                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {column?.label}
                              </span>
                            );
                          })}
                          {selectedColumns.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              +{selectedColumns.length - 5} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-blue-700">No columns selected</p>
                      )
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {exportStatus === 'success' && (
                <div className="p-4 bg-green-50 border-l-4 border-green-400">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                    <p className="text-sm text-green-700">
                      Export completed successfully! Your file has been downloaded.
                    </p>
                  </div>
                </div>
              )}

              {exportStatus === 'error' && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                    <div>
                      <p className="text-sm text-red-700 font-medium">
                        Export failed
                      </p>
                      {errorMessage && (
                        <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Section */}
              <div className="p-6 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p className="font-medium">Ready to export?</p>
                    <p className="mt-1">
                      {selectedColumns.length > 0 
                        ? `${selectedColumns.length} column${selectedColumns.length > 1 ? 's' : ''} selected`
                        : 'Select columns to export'}
                    </p>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={isExporting || selectedColumns.length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="-ml-1 mr-2 h-5 w-5" />
                        Export CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info Card */}
            {/* <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Important Notes
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Select at least one column to export</li>
                      <li>The export includes all teams visible to administrators</li>
                      <li>File format: CSV (Comma Separated Values)</li>
                      <li>Compatible with Excel, Google Sheets, and other spreadsheet software</li>
                      <li>Filename includes the current date for easy tracking</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Stats Preview */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Export Format</p>
                    <p className="text-2xl font-bold text-gray-900">CSV</p>
                  </div>
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Selected Fields</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedColumns.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Available Fields</p>
                    <p className="text-2xl font-bold text-gray-900">{AVAILABLE_COLUMNS.length}</p>
                  </div>
                  <Download className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
