type Props = { desire: string; buttonText: string };

export default function CTA({ desire, buttonText }: Props) {
  return (
    <section id="order" className="cta container card">
      <p>{desire}</p>
      <a className="cta-btn" href="/store">
        {buttonText}
      </a>
    </section>
  );
}

