"use client";

import Link, { LinkProps } from 'next/link';
import React from 'react';

type Props = LinkProps & {
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
};

export default function Button({ href, className, children, ...props }: Props) {
  return (
    <Link href={href} className={className} {...props}>
      {children}
    </Link>
  );
}
