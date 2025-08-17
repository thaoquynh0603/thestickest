"use client";

import Image from 'next/image';
import CTA from './CTA';
type Props = {
  attention: string;
  ctaText: string;
  buttonText: string;
};

export default function Hero({ attention, ctaText, buttonText }: Props) {
  return (
    <section className="hero container" aria-labelledby="hero-heading">
      <div className="hero-grid">
        <div>
          <h1 id="hero-heading" className="hero-title">
            {attention}
          </h1>
          <p className="hero-sub">{ctaText}</p>
        </div>

        <div className="card hero-visual" role="img" aria-label="Sticker mockup placeholder">
          <Image
            src="/hero-img.png"
            alt="Placeholder showing where your sticker artwork will appear"
            width={420}
            height={320}
            priority
          />
          <a href="/store/general_default_hidden/design" className='large-cta hero-cta' style={{ background: 'var(--color-primary)' }}>
            {buttonText}
          </a>
          <a href="/store" className="store-link-btn" aria-label="View our store">
            View Our Store
          </a>
        </div>
      </div>
    </section>
  );
}

