import Image from 'next/image';

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
          <a className="hero-button" href="/store">
            {buttonText}
          </a>
        </div>
      </div>
    </section>
  );
}

