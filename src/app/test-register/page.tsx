'use client';

import { useState } from 'react';

export default function TestRegisterPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testRegistration = async () => {
    setLoading(true);
    setResult('');

    try {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        socialMediaLink: 'https://instagram.com/test',
        mobileNumber: '1234567890',
        username: 'testuser_' + Date.now(),
        password: 'password123',
        confirmPassword: 'password123'
      };

      console.log('Testing registration with:', testData);

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      setResult(`
        Status: ${response.status}
        Response: ${JSON.stringify(data, null, 2)}
      `);

      console.log('Test result:', { status: response.status, data });

    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Registration API Test</h1>
        
        <button
          onClick={testRegistration}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Registration API'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-white rounded border">
            <h2 className="font-bold mb-2">Result:</h2>
            <pre className="whitespace-pre-wrap text-sm">{result}</pre>
          </div>
        )}

        <div className="mt-8 p-4 bg-yellow-100 rounded">
          <h2 className="font-bold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click the "Test Registration API" button</li>
            <li>Check the browser console (F12) for detailed logs</li>
            <li>Check the terminal where Next.js is running for server logs</li>
            <li>Compare the results with direct curl testing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
