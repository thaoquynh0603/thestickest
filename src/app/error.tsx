'use client';

export default function Error({ error }: { error: Error & { digest?: string } }) {
  return (
    <div className="container">
      <div className="card" style={{ padding: 24 }}>
        <h2>Something went wrong</h2>
        <p style={{ color: '#8b86a4' }}>{error.message}</p>
      </div>
    </div>
  );
}

