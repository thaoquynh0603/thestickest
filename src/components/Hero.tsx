"use client";

import Image from 'next/image';
import CTA from './CTA';
type Props = {
  attention: string | null | undefined;
  ctaText: string | null | undefined;
  buttonText: string | null | undefined;
};

export default function Hero({ attention, ctaText, buttonText }: Props) {
  // Add defensive checks for all props
  const safeAttention = attention || "Want Stunning Custom Stickers—Designed, Printed, and Shipped Directly to You?";
  const safeCtaText = ctaText || "Forget complicated processes and separate platforms. Our all-in-one custom sticker service gives you:";
  const safeButtonText = buttonText || "Create My Stickers";

  return (
    <section className="hero container" aria-labelledby="hero-heading">
      <div className="hero-grid">
        <div>
          <h1 id="hero-heading" className="hero-title">
            {safeAttention}
          </h1>
          <p className="hero-sub">{safeCtaText}</p>
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
            <span className="button-text-responsive">{safeButtonText}</span>
          </a>
          <a href="/store" className="store-link-btn" aria-label="View our store">
            View Our Store
          </a>
        </div>
      </div>
    </section>
  );
}

