import Image from 'next/image';
type Item = { label: string; detail: string };

type Props = {
  title: string | null | undefined;
  description: string | null | undefined;
  items: Item[] | null | undefined;
  closing: string | null | undefined;
};

export default function WorryFree({ title, description, items, closing }: Props) {
  // Add defensive checks for all props
  const safeTitle = title || "Worry-Free Experience";
  const safeDescription = description || "We're committed to making your custom sticker experience completely stress-free, from start to finish:";
  const safeItems = Array.isArray(items) ? items : [];
  const safeClosing = closing || "Enjoy total peace of mind—we've got you covered every step of the way.";

  const iconFor = (label: string) => {
    // Ensure label is a string and not null/undefined
    if (!label || typeof label !== 'string') {
      console.warn('WorryFree: Invalid label received:', label);
      return '⭐';
    }
    
    try {
      const lower = label.toLowerCase();
      // Add additional safety checks before calling .includes()
      if (typeof lower === 'string' && lower.includes('secure') || lower.includes('payment')) return '🔒';
      if (typeof lower === 'string' && lower.includes('quality') || lower.includes('trust')) return '🛡️';
      if (typeof lower === 'string' && lower.includes('support')) return '💬';
      if (typeof lower === 'string' && lower.includes('turnaround') || lower.includes('shipping')) return '🚚';
      if (typeof lower === 'string' && lower.includes('approval')) return '✅';
      if (typeof lower === 'string' && lower.includes('risk')) return '✨';
    } catch (error) {
      console.error('WorryFree: Error in iconFor function:', error);
      return '⭐';
    }
    
    return '⭐';
  };

  // Early return if no items
  if (!safeItems.length) {
    return (
      <section id="worry-free" className="container" aria-labelledby="worry-free-heading" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div className="card worry-free-container" style={{ padding: 48, position: 'relative', overflow: 'hidden', maxWidth: '1200px', width: '100%' }}>
          <div className="worry-bg-pattern" aria-hidden></div>
          <h2 id="worry-free-heading" style={{ marginTop: 0, marginBottom: 16, fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)' }}>
            {safeTitle}
          </h2>
          <p style={{ color: 'var(--muted-ink)', fontWeight: 600, fontSize: '18px', lineHeight: '1.6' }}>{safeDescription}</p>
          <p style={{ marginTop: 40, fontWeight: 700, textAlign: 'center', fontSize: '20px' }}>No items available at the moment.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="worry-free" className="container" aria-labelledby="worry-free-heading" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div className="card worry-free-container" style={{ padding: 48, position: 'relative', overflow: 'hidden', maxWidth: '1200px', width: '100%' }}>
        <div className="worry-bg-pattern" aria-hidden></div>
        <h2 id="worry-free-heading" style={{ marginTop: 0, marginBottom: 16, fontWeight: 900, fontSize: 'clamp(28px, 4vw, 42px)' }}>
          {safeTitle}
        </h2>
        <p style={{ color: 'var(--muted-ink)', fontWeight: 600, fontSize: '18px', lineHeight: '1.6' }}>{safeDescription}</p>

        <div className="worry-grid" style={{ marginTop: 32 }}>
          {safeItems.map((item, index) => {
            // Add validation for individual item
            if (!item || !item.label || !item.detail) {
              console.warn('WorryFree: Invalid item at index', index, ':', item);
              return null;
            }
            
            return (
              <article key={`${item.label}-${index}`} className="card worry-card" aria-label={item.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="worry-icon" aria-hidden style={{ fontSize: '40px' }}>
                    {iconFor(item.label)}
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: '20px' }}>{item.label}</h3>
                </div>
                <p style={{ marginTop: 16, fontSize: '16px', lineHeight: '1.5' }}>{item.detail}</p>
              </article>
            );
          })}
        </div>

        <p style={{ marginTop: 40, fontWeight: 700, textAlign: 'center', fontSize: '20px' }}>{safeClosing}</p>
      </div>
    </section>
  );
}


