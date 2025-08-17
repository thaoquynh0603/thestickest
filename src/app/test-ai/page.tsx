"use client";
import React, { useState } from 'react';
import AIInspiration from '../../components/design-application/AIInspiration';

export default function TestAIPage() {
  const [generatedText, setGeneratedText] = useState<string>('');

  const handleInspirationGenerated = (text: string) => {
    setGeneratedText(text);
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">AI Inspiration Feature Test</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Sample Question</h2>
        <p className="text-gray-600 mb-4">
          <strong>Question:</strong> What do you want to design?
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer:
          </label>
          <textarea
            value={generatedText}
            onChange={(e) => setGeneratedText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="Enter your design idea or click 'Get AI Inspiration!' below..."
          />
        </div>

        <div className="mt-6">
          <AIInspiration
            questionId="test-question-id"
            requestId="test-request-id"
            onInspirationGenerated={handleInspirationGenerated}
          />
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">How It Works</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>The AI Inspiration button appears for questions with <code>is_ai_generated = true</code></li>
          <li>Clicking the button triggers the Gemini API with contextual prompts</li>
          <li>The AI generates creative design suggestions based on product context</li>
          <li>Generated text auto-fills the textarea with highlighted placeholders</li>
          <li>All AI requests are logged in the <code>gemini_runs</code> table</li>
        </ol>
      </div>

      <div className="bg-green-50 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3 text-green-800">Current Status</h3>
        <ul className="space-y-2 text-green-700">
          <li>✅ AI Inspiration component created and styled</li>
          <li>✅ QuestionRenderer integration implemented</li>
          <li>✅ API endpoint for AI inspiration created</li>
          <li>✅ Database table for logging AI runs created</li>
          <li>✅ Types updated with AI-related fields</li>
          <li>✅ Multiple AI-enabled questions already exist in database</li>
        </ul>
      </div>

      <div className="bg-yellow-50 rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-3 text-yellow-800">Next Steps</h3>
        <ul className="space-y-2 text-yellow-700">
          <li>🔑 Add your GEMINI_API_KEY to .env.local</li>
          <li>🔑 Add your SUPABASE_SERVICE_ROLE_KEY to .env.local</li>
          <li>🧪 Test the feature with a real design request</li>
          <li>📊 Monitor AI usage in the gemini_runs table</li>
        </ul>
      </div>
    </div>
  );
}
