"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link className="brand" href="/">
          <Image
            src="/theStickestlogo.png"
            alt="The Stickest logo"
            width={64}
            height={64}
            priority
          />
          The Stickest
        </Link>

        <div className="nav-links" aria-label="Primary">
          <Link href="/about">About</Link>
          <Link href="/store">Store</Link>
          <Link href="/faq">FAQ</Link>
        </div>

        <button
          className="mobile-menu-btn"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(prev => !prev)}
        >
          {open ? (
            <span aria-hidden>✕</span>
          ) : (
            <span aria-hidden>☰</span>
          )}
        </button>

        <Link className="cta-link" href="/store">Create stickers</Link>
      </div>

      <div id="mobile-menu" className={`mobile-menu ${open ? 'open' : ''}`}>
        <div className="container">
          <div className="mobile-menu-links" role="menu">
            <Link role="menuitem" href="/about" onClick={() => setOpen(false)}>About</Link>
            <Link role="menuitem" href="/store" onClick={() => setOpen(false)}>Store</Link>
            <Link role="menuitem" href="/faq" onClick={() => setOpen(false)}>FAQ</Link>
            <Link role="menuitem" className="mobile-cta" href="/store" onClick={() => setOpen(false)}>Create stickers</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

