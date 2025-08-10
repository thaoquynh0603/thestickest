type Props = { features: string[] };

export default function FeatureCards({ features }: Props) {
  return (
    <section id="features" className="features container">
      <div className="features-grid">
        {features.map((feature, idx) => (
          <article key={idx} className="card feature-card" aria-label={`Feature ${idx + 1}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="pill" aria-hidden>
                {`#${idx + 1}`}
              </span>
              <h3 className="feature-title">{feature.split(':')[0]}</h3>
            </div>
            <p style={{ marginTop: 6 }}>{feature}</p>
            <div style={{ marginTop: 12 }}>
              <img
                src={`https://placehold.co/360x120/efe7fb/111?text=Feature+Visual+${idx + 1}`}
                alt={`Placeholder illustration for feature ${idx + 1}`}
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

