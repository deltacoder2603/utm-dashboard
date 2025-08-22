'use client';

import { useState } from 'react';

export default function TestConnectionPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-connection');
      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      setTestResult({ error: 'Failed to test connection', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Google Sheets Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Google Sheets API Connection</h2>
          <p className="text-gray-600 mb-4">
            This will test your Google Sheets API configuration and show detailed information about any issues.
          </p>
          <button
            onClick={testConnection}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
            
            {testResult.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Connection Successful!</h3>
                <p className="text-green-700">Google Sheets API is working correctly.</p>
                {testResult.config && (
                  <div className="mt-4 p-3 bg-green-100 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Configuration Details:</h4>
                    <pre className="text-sm text-green-700 overflow-x-auto">
                      {JSON.stringify(testResult.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Connection Failed</h3>
                <p className="text-red-700 mb-2">{testResult.error}</p>
                
                {testResult.details && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">Error Details:</h4>
                    <p className="text-red-700 text-sm">{testResult.details}</p>
                  </div>
                )}
                
                {testResult.solution && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-800 mb-2">Solution:</h4>
                    <p className="text-red-700 text-sm">{testResult.solution}</p>
                  </div>
                )}
                
                {testResult.config && (
                  <div className="p-3 bg-red-100 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Current Configuration:</h4>
                    <pre className="text-sm text-red-700 overflow-x-auto">
                      {JSON.stringify(testResult.config, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Next Steps:</h4>
              <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm">
                <li>Check the <code className="bg-gray-200 px-1 rounded">env-template.txt</code> file for required environment variables</li>
                <li>Create a <code className="bg-gray-200 px-1 rounded">.env</code> file with your Google Service Account credentials</li>
                <li>Ensure your Google Sheets are shared with the service account email</li>
                <li>Verify the spreadsheet IDs are correct</li>
                <li>Restart your development server after adding the .env file</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
