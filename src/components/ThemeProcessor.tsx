import { Product } from '@/types/database';

interface ThemePalette {
  overlayBg: string;
  overlayInk: string;
  overlayMuted: string;
  accent: string;
  pageBg: string;
  breadcrumbBg: string;
  ctaSectionBg: string;
  processBg: string;
}

interface ThemeProcessorProps {
  product: Product & {
    palette?: Partial<ThemePalette>;
  };
}

const defaultTheme: ThemePalette = {
  overlayBg: 'rgba(0, 0, 0, 0.7)',
  overlayInk: '#ffffff',
  overlayMuted: '#cccccc',
  accent: '#ff6b6b',
  pageBg: '#ffffff',
  breadcrumbBg: '#f8f9fa',
  ctaSectionBg: '#f8f9fa',
  processBg: '#ffffff'
};

// Server-side theme processing
export function ThemeProcessor({ product }: ThemeProcessorProps) {
  // Process theme data on the server
  const theme: ThemePalette = {
    ...defaultTheme,
    ...(product.palette || {}) as Partial<ThemePalette>
  };

  // Generate optimized CSS variables
  const cssVariables = {
    '--hero-overlay-bg': theme.overlayBg,
    '--hero-overlay-ink': theme.overlayInk,
    '--hero-overlay-muted': theme.overlayMuted,
    '--hero-accent': theme.accent,
    '--category-page-bg': theme.pageBg,
    '--category-breadcrumb-bg': theme.breadcrumbBg,
    '--category-cta-section-bg': theme.ctaSectionBg,
    '--category-process-bg': theme.processBg,
  };

  // Serialize CSS variables for client-side consumption
  const serializedTheme = JSON.stringify(cssVariables);

  return (
    <script
      type="application/json"
      id="theme-data"
      dangerouslySetInnerHTML={{ __html: serializedTheme }}
    />
  );
}
