import Image from 'next/image';
type Item = { label: string; detail: string };

type Props = {
  title: string;
  description: string;
  items: Item[];
  closing: string;
};

export default function WorryFree({ title, description, items, closing }: Props) {
  const iconFor = (label: string) => {
    const lower = (label || '').toLowerCase();
    if (lower.includes('secure') || lower.includes('payment')) return '🔒';
    if (lower.includes('quality') || lower.includes('trust')) return '🛡️';
    if (lower.includes('support')) return '💬';
    if (lower.includes('turnaround') || lower.includes('shipping')) return '🚚';
    if (lower.includes('approval')) return '✅';
    if (lower.includes('risk')) return '✨';
    return '⭐';
  };

  return (
    <section id="worry-free" className="container" aria-labelledby="worry-free-heading" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div className="card worry-free-container" style={{ padding: 48, position: 'relative', overflow: 'hidden', maxWidth: '1200px', width: '100%' }}>
        <div className="worry-bg-pattern" aria-hidden></div>
        <h2 id="worry-free-heading" style={{ marginTop: 0, marginBottom: 16, fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--muted-ink)', fontWeight: 600, fontSize: '18px', lineHeight: '1.6' }}>{description}</p>

        <div className="worry-grid" style={{ marginTop: 32 }}>
          {items.map((item) => (
            <article key={item.label} className="card worry-card" aria-label={item.label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="worry-icon" aria-hidden style={{ fontSize: '40px' }}>
                  {iconFor(item.label)}
                </div>
                <h3 style={{ margin: 0, fontWeight: 900, fontSize: '20px' }}>{item.label}</h3>
              </div>
              <p style={{ marginTop: 16, fontSize: '16px', lineHeight: '1.5' }}>{item.detail}</p>
            </article>
          ))}
        </div>

        <p style={{ marginTop: 40, fontWeight: 700, textAlign: 'center', fontSize: '20px' }}>{closing}</p>
      </div>
    </section>
  );
}


