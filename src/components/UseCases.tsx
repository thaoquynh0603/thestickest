type Props = { useCases: string[]; additionalBenefits: string[] };

export default function UseCases({ useCases, additionalBenefits }: Props) {
  return (
    <section id="use-cases" className="usecases container">
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontWeight: 900 }}>Perfect for any moment</h3>
        <div className="chips" aria-label="Popular use cases">
          {useCases.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
        <ul style={{ marginTop: 18 }}>
          {additionalBenefits.map((b) => (
            <li key={b} style={{ fontWeight: 700 }}>
              {b}
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 5, textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
          <img
            src="/customer_love.png"
            alt="Placeholder for rating/social proof"
            style={{ height: '100%', width: 'auto' }}
          />
        </div>
      </div>
    </section>
  );
}

