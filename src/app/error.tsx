'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('Global error boundary caught error:', error);
    
    // Check if this is the specific .includes() error
    if (error.message && error.message.includes("Cannot read properties of null (reading 'includes')")) {
      console.error('Detected .includes() error on null value. This usually indicates a data loading issue.');
      console.error('Error stack:', error.stack);
    }
  }, [error]);

  return (
    <div className="error-container" style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#dc2626' }}>
        Something went wrong!
      </h1>
      
      {error.message && error.message.includes("Cannot read properties of null (reading 'includes')") ? (
        <div style={{ maxWidth: '600px', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#374151' }}>
            We're experiencing a data loading issue. This usually happens when:
          </p>
          <ul style={{ textAlign: 'left', marginBottom: '1rem', color: '#6b7280' }}>
            <li>The page data hasn't loaded completely</li>
            <li>There's a temporary connection issue</li>
            <li>The data format has changed</li>
          </ul>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>
            Please try refreshing the page. If the problem persists, contact support.
          </p>
        </div>
      ) : (
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#374151' }}>
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Try again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Refresh Page
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px' }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}>
            Error Details (Development)
          </summary>
          <pre style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            overflow: 'auto',
            fontSize: '0.8rem',
            color: '#374151'
          }}>
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

