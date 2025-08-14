interface Feature {
  icon: string;
  image_url: string;
  title: string;
  description: string;
}

type Props = { features: Feature[] };

export default function FeatureCards({ features }: Props) {
  return (
    <section id="features" className="features container">
      <div className="features-grid">
        {features.map((feature, idx) => (
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
                src={feature.image_url}
                alt={`Illustration for ${feature.title}`}
                style={{ maxWidth: '80%', height: 'auto', borderRadius: '8px' }}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

