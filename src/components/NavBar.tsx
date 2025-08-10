import Link from 'next/link';

export default function NavBar() {
  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden />
          The Stickest
        </Link>
        <div className="nav-links" aria-label="Primary">
          <Link href="/about">About</Link>
          <Link href="/store">Store</Link>
          <Link href="/faq">FAQ</Link>
        </div>
        <Link className="cta-link" href="/store">Create stickers</Link>
      </div>
    </nav>
  );
}

