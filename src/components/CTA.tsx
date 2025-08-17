type Props = { desire: string; buttonText: string };

export default function CTA({ desire, buttonText }: Props) {
  return (
    <section id="order" className="cta container card">
      <p>{desire}</p>
      <a className="large-cta" href="/store/general_default_hidden/design" aria-label={buttonText}>
        <span>{buttonText}</span>
      </a>
    </section>
  );
}

