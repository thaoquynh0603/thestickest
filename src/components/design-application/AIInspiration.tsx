"use client";
import React, { useState } from 'react';


interface AIInspirationProps {
  questionId: string;
  requestId?: string;
  onInspirationGenerated: (text: string) => void;
  isGenerating?: boolean;
  isInline?: boolean;
}

export default function AIInspiration({ 
  questionId, 
  requestId, 
  onInspirationGenerated, 
  isGenerating = false,
  isInline = false
}: AIInspirationProps) {
  console.log('🔍 AIInspiration component rendered with:', {
    questionId,
    requestId,
    isGenerating
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleGetInspiration = async () => {
    console.log('🔍 handleGetInspiration called with:', {
      questionId,
      requestId
    });
    
    if (!requestId) {
      console.log('❌ No requestId provided');
      setError('Request ID is required to generate inspiration');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const requestBody = {
        questionId,
        requestId,
      };
      
      console.log('🔍 Making API call to /api/ai-inspiration with:', requestBody);
      
      const response = await fetch('/api/ai-inspiration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('🔍 API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ API error response:', errorText);
        throw new Error(`Failed to generate inspiration: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 API response data:', data);
      
      if (data.success) {
        // Auto-fill the textarea with the generated text
        onInspirationGenerated(data.response.text);
      } else {
        setError(data.error || 'Failed to generate inspiration');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating inspiration');
    } finally {
      setIsLoading(false);
    }
  };



  if (isInline) {
    return (
      <div className="ai-inspiration-inline">
        <button
          type="button"
          onClick={handleGetInspiration}
          disabled={isLoading || isGenerating}
          className="ai-inspiration-btn-inline"
          title="Get AI Inspiration"
        >
          {isLoading ? (
            <span className="loading-spinner-inline"></span>
          ) : (
            <span className="ai-icon-inline">✨</span>
          )}
        </button>
        
        {error && (
          <div className="ai-error-inline">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ai-inspiration-container">
      <button
        type="button"
        onClick={handleGetInspiration}
        disabled={isLoading || isGenerating}
        className="ai-inspiration-btn"
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            Generating...
          </>
        ) : (
          <>
            <span className="ai-icon">✨</span>
            Get AI Inspiration!
          </>
        )}
      </button>

      {error && (
        <div className="ai-error">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}




    </div>
  );
}
