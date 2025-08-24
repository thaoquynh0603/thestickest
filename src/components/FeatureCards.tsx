interface Feature {
  icon: string;
  image_url: string;
  title: string;
  description: string;
}

type Props = { features: Feature[] | null | undefined };

export default function FeatureCards({ features }: Props) {
  // Add defensive check for features
  const safeFeatures = features || [];
  
  // Early return if no features
  if (!safeFeatures.length) {
    return (
      <section id="features" className="features container">
        <div className="features-grid">
          <div className="card feature-card">
            <p>No features available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="features" className="features container">
      <div className="features-grid">
        {safeFeatures.map((feature, idx) => {
          // Add validation for individual feature items
          if (!feature || !feature.title || !feature.description) {
            return null;
          }
          
          return (
            <article key={idx} className="card feature-card" aria-label={feature.title}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="pill" aria-hidden>
                  {`#${idx + 1}`}
                </span>
                <h3 className="feature-title">{feature.title}</h3>
              </div>
              <p style={{ marginTop: 6 }}>{feature.description}</p>
              <div style={{ marginTop: 12 }}>
                <img
                  src={feature.image_url || feature.icon || ''}
                  alt={`Illustration for ${feature.title}`}
                  style={{ maxWidth: '80%', height: 'auto', borderRadius: '8px' }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

