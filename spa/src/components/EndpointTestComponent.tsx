import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

interface EndpointTestComponentProps {
  productId: number;
  onComplete: (testId: number) => void;
  onCancel: () => void;
}

interface TestResult {
  status: string;
  [key: string]: any;
}

interface ProgressUpdate {
  task_id: string;
  progress: number;
  status: string;
  error?: boolean;
  results?: Record<string, TestResult>;
}

const EndpointTestComponent: React.FC<EndpointTestComponentProps> = ({ 
  productId, 
  onComplete, 
  onCancel 
}) => {
  const [endpointUrl, setEndpointUrl] = useState('');
  const [testType, setTestType] = useState<'security' | 'compliance' | 'performance' | 'availability'>('security');
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [testResults, setTestResults] = useState<Record<string, TestResult> | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testParameters, setTestParameters] = useState({
    timeout: 10,
    retries: 3,
    check_ssl: true,
    check_headers: true,
    check_performance: true
  });

  const handleStartTest = async () => {
    if (!endpointUrl) {
      alert('Please enter an endpoint URL');
      return;
    }

    // Validate URL format
    try {
      new URL(endpointUrl);
    } catch {
      alert('Please enter a valid URL');
      return;
    }

    setTesting(true);
    setProgress(0);
    setProgressStatus('Initializing tests...');
    setTestResults(null);

    // Initialize socket connection for progress updates
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    
    try {
      const response = await fetch('/api/wizard/endpoint-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: productId,
          endpoint_url: endpointUrl,
          test_type: testType,
          test_parameters: testParameters
        }),
      });

      const data = await response.json();
      
      if (data.task_id) {
        // Listen for progress updates
        socket.on('task_progress', (progressData: ProgressUpdate) => {
          if (progressData.task_id === data.task_id) {
            setProgress(progressData.progress);
            setProgressStatus(progressData.status);
            
            if (progressData.progress === 100 && !progressData.error) {
              setTesting(false);
              setTestResults(progressData.results || {});
              socket.disconnect();
              onComplete(data.test_id);
            } else if (progressData.error) {
              setTesting(false);
              socket.disconnect();
              alert(`Error: ${progressData.status}`);
            }
          }
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
      setTesting(false);
      socket.disconnect();
      alert('Test failed. Please try again.');
    }
  };

  const renderTestResult = (testName: string, result: TestResult) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'success': return 'text-green-600';
        case 'warning': return 'text-yellow-600';
        case 'failed': return 'text-red-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'success':
          return (
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          );
        case 'warning':
          return (
            <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          );
        case 'failed':
          return (
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          );
        default:
          return (
            <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
      }
    };

    return (
      <div key={testName} className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-900 capitalize">
            {testName.replace('_', ' ')} Test
          </h4>
          <div className="flex items-center space-x-2">
            {getStatusIcon(result.status)}
            <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
              {result.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 space-y-1">
          {Object.entries(result).map(([key, value]) => {
            if (key === 'status') return null;
            
            return (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key.replace('_', ' ')}:</span>
                <span className="font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Endpoint Testing</h2>
        <p className="text-gray-600">
          Test your endpoint for security, compliance, and performance issues.
        </p>
      </div>

      {/* Test Configuration */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endpoint URL *
          </label>
          <input
            type="url"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://example.com/api/endpoint"
            disabled={testing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Test Type
          </label>
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={testType}
            onChange={(e) => setTestType(e.target.value as any)}
            disabled={testing}
          >
            <option value="security">Security Assessment</option>
            <option value="compliance">Compliance Check</option>
            <option value="performance">Performance Test</option>
            <option value="availability">Availability Test</option>
          </select>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-500"
            disabled={testing}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout (seconds)
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={testParameters.timeout}
                  onChange={(e) => setTestParameters(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                  min="1"
                  max="60"
                  disabled={testing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retries
                </label>
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={testParameters.retries}
                  onChange={(e) => setTestParameters(prev => ({ ...prev, retries: parseInt(e.target.value) }))}
                  min="0"
                  max="10"
                  disabled={testing}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testParameters.check_ssl}
                  onChange={(e) => setTestParameters(prev => ({ ...prev, check_ssl: e.target.checked }))}
                  disabled={testing}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Check SSL/TLS Configuration</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testParameters.check_headers}
                  onChange={(e) => setTestParameters(prev => ({ ...prev, check_headers: e.target.checked }))}
                  disabled={testing}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Check Security Headers</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={testParameters.check_performance}
                  onChange={(e) => setTestParameters(prev => ({ ...prev, check_performance: e.target.checked }))}
                  disabled={testing}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Check Performance Metrics</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Progress Display */}
      {testing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">Testing in progress...</span>
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

      {/* Test Results */}
      {testResults && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Test Results</h3>
          <div className="space-y-4">
            {Object.entries(testResults).map(([testName, result]) => 
              renderTestResult(testName, result)
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          disabled={testing}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
        >
          Cancel
        </button>
        
        <button
          onClick={handleStartTest}
          disabled={testing || !endpointUrl}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Start Test'}
        </button>
      </div>
    </div>
  );
};

export default EndpointTestComponent;

