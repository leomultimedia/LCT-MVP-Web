import React, { useState, useCallback } from 'react';
import io from 'socket.io-client';

interface UploadComponentProps {
  productId: number;
  onComplete: (uploadId: number) => void;
  onCancel: () => void;
}

interface ProgressUpdate {
  task_id: string;
  progress: number;
  status: string;
  error?: boolean;
  dashboard_data?: any;
  report_url?: string;
}

const UploadComponent: React.FC<UploadComponentProps> = ({ productId, onComplete, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [clientInfo, setClientInfo] = useState({
    user_email: '',
    agency_name: 'Lear Cyber Tech',
    client_name: ''
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const selectedFile = files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
      } else {
        alert('Please select a valid file type (Excel, Word, or PDF)');
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (isValidFileType(selectedFile)) {
        setFile(selectedFile);
      } else {
        alert('Please select a valid file type (Excel, Word, or PDF)');
      }
    }
  };

  const isValidFileType = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf'
    ];
    return validTypes.includes(file.type);
  };

  const handleUpload = async () => {
    if (!file || !clientInfo.user_email || !clientInfo.client_name) {
      alert('Please fill in all required fields and select a file');
      return;
    }

    setUploading(true);
    setProgress(0);
    setProgressStatus('Uploading file...');

    // Initialize socket connection for progress updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('product_id', productId.toString());
      formData.append('user_email', clientInfo.user_email);
      formData.append('agency_name', clientInfo.agency_name);
      formData.append('client_name', clientInfo.client_name);

      const response = await fetch('/api/wizard/upload-template', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.task_id) {
        // Listen for progress updates
        socket.on('task_progress', (progressData: ProgressUpdate) => {
          if (progressData.task_id === data.task_id) {
            setProgress(progressData.progress);
            setProgressStatus(progressData.status);
            
            if (progressData.progress === 100 && !progressData.error) {
              setUploading(false);
              socket.disconnect();
              onComplete(data.upload_id);
            } else if (progressData.error) {
              setUploading(false);
              socket.disconnect();
              alert(`Error: ${progressData.status}`);
            }
          }
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      socket.disconnect();
      alert('Upload failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Filled Template</h2>
        <p className="text-gray-600">
          Upload your completed template to generate comprehensive reports and dashboards.
        </p>
      </div>

      {/* Client Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Client Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={clientInfo.user_email}
              onChange={(e) => setClientInfo(prev => ({ ...prev, user_email: e.target.value }))}
              placeholder="your.email@company.com"
              required
              disabled={uploading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client/Company Name *
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={clientInfo.client_name}
              onChange={(e) => setClientInfo(prev => ({ ...prev, client_name: e.target.value }))}
              placeholder="Your Company Name"
              required
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Upload Template</h3>
        
        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your file here, or{' '}
              <label className="text-blue-600 hover:text-blue-500 cursor-pointer">
                browse
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.docx,.doc,.pdf"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Supports Excel (.xlsx, .xls), Word (.docx, .doc), and PDF files
            </p>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!uploading && (
                <button
                  onClick={() => setFile(null)}
                  className="text-red-600 hover:text-red-500"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Progress Display */}
      {uploading && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Processing...</span>
            <span className="text-sm text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-600 mt-2">{progressStatus}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handleUpload}
          disabled={uploading || !file || !clientInfo.user_email || !clientInfo.client_name}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Processing...' : 'Upload & Process'}
        </button>
      </div>
    </div>
  );
};

export default UploadComponent;

