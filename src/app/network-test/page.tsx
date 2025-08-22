'use client';

import { useState } from 'react';

export default function NetworkTestPage() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const testEndpoints = [
    { name: 'Google APIs (Basic)', url: 'https://googleapis.com' },
    { name: 'Google OAuth2', url: 'https://oauth2.googleapis.com' },
    { name: 'Google Sheets API', url: 'https://sheets.googleapis.com' },
    { name: 'Google Drive API', url: 'https://www.googleapis.com' }
  ];

  const runNetworkTest = async () => {
    setLoading(true);
    const results: any = {};

    for (const endpoint of testEndpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(endpoint.url, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        results[endpoint.name] = {
          status: 'SUCCESS',
          statusCode: response.status,
          responseTime: `${responseTime}ms`,
          details: 'Endpoint is reachable'
        };
      } catch (error) {
        results[endpoint.name] = {
          status: 'FAILED',
          error: error instanceof Error ? error.message : String(error),
          details: 'Endpoint is not reachable'
        };
      }
    }

    // Test DNS resolution
    try {
      const dnsTest = await fetch('/api/test-connection');
      const dnsData = await dnsTest.json();
      results['DNS Resolution'] = {
        status: dnsData.success ? 'SUCCESS' : 'FAILED',
        details: dnsData.message || 'DNS test completed',
        error: dnsData.error || null
      };
    } catch (error) {
      results['DNS Resolution'] = {
        status: 'FAILED',
        error: error instanceof Error ? error.message : String(error),
        details: 'DNS test failed'
      };
    }

    setTestResults(results);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Network Connectivity Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Google API Endpoints</h2>
          <p className="text-gray-600 mb-4">
            This will test connectivity to various Google API endpoints to identify where the connection is failing.
          </p>
          <button
            onClick={runNetworkTest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? 'Testing...' : 'Run Network Test'}
          </button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Results</h2>
            
            <div className="space-y-4">
              {Object.entries(testResults).map(([name, result]: [string, any]) => (
                <div key={name} className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                  
                  {result.status === 'SUCCESS' ? (
                    <div className="text-sm">
                      <p><strong>Status Code:</strong> {result.statusCode}</p>
                      <p><strong>Response Time:</strong> {result.responseTime}</p>
                      <p><strong>Details:</strong> {result.details}</p>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p><strong>Error:</strong> {result.error}</p>
                      <p><strong>Details:</strong> {result.details}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Troubleshooting Steps:</h4>
              <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
                <li><strong>If all endpoints fail:</strong> Check your internet connection and try disabling VPN if you're using one</li>
                <li><strong>If only OAuth2 fails:</strong> This suggests DNS resolution issues - try using a different DNS server (8.8.8.8 or 1.1.1.1)</li>
                <li><strong>If some endpoints work:</strong> There may be specific firewall rules blocking certain Google services</li>
                <li><strong>Network restrictions:</strong> Some corporate networks block Google APIs - contact your network administrator</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Quick Fixes to Try:</h4>
              <ul className="list-disc list-inside text-yellow-700 space-y-1 text-sm">
                <li>Try using a mobile hotspot or different network</li>
                <li>Change your DNS server to Google (8.8.8.8) or Cloudflare (1.1.1.1)</li>
                <li>Disable any VPN or proxy services</li>
                <li>Check if your firewall is blocking outbound HTTPS connections</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
