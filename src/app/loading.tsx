export default function Loading() {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        marginBottom: '2rem'
      }}></div>
      
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '1rem',
        color: '#111827',
        fontWeight: '700'
      }}>
        Loading TheStickest...
      </h1>
      
      <p style={{
        fontSize: '1.1rem',
        color: '#6b7280',
        maxWidth: '400px',
        lineHeight: '1.6'
      }}>
        We're preparing your custom sticker experience. This should only take a moment.
      </p>
    </div>
  );
}

