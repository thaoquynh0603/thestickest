type Props = { desire: string | null | undefined; buttonText: string | null | undefined };

export default function CTA({ desire, buttonText }: Props) {
  // Add defensive checks for all props
  const safeDesire = desire || "Imagine the excitement as your custom stickers arrive—beautifully packaged, perfectly personalized, and ready to delight friends and family. Make every moment unforgettable, effortlessly.";
  const safeButtonText = buttonText || "Create My Stickers";

  return (
    <section id="order" className="cta container card">
      <p>{safeDesire}</p>
      <a className="large-cta" href="/store/general_default_hidden/design" aria-label={safeButtonText}>
        <span className="button-text-responsive">{safeButtonText}</span>
      </a>
    </section>
  );
}

