'use client';

import { useState } from 'react';

export default function TestEmailSystem() {
  const [designCode, setDesignCode] = useState('A0A250B0');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testEmailSystem = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-email-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ designCode }),
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing email system:', error);
      setResult({ error: 'Failed to test email system' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Test Email System</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Design Code:</label>
        <input
          type="text"
          value={designCode}
          onChange={(e) => setDesignCode(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Enter design code"
        />
      </div>
      
      <button
        onClick={testEmailSystem}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Email System'}
      </button>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
          
          {result.error ? (
            <div className="text-red-600">{result.error}</div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Questions with Option Items:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result.questions, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">Application Details:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(result.applicationDetails, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="font-semibold">Mapped Answers (UUID → Human Readable):</h3>
                <div className="bg-gray-100 p-4 rounded">
                  {result.mappedAnswers?.map((item: any, index: number) => (
                    <div key={index} className="mb-2 p-2 bg-white rounded">
                      <strong>{item.question}</strong><br/>
                      <span className="text-gray-600">Raw Answer: {JSON.stringify(item.answer)}</span><br/>
                      <span className="text-green-600">Display Answer: {item.displayAnswer}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
