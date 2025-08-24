import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { Product, ProductWithCarousel } from '@/types/database';
import { ProcessSection } from './ProcessSection';
import ProductCarousel from './ProductCarousel';
import { EnhancedImagePreloader } from './EnhancedImagePreloader';
import { CarouselDataProcessor } from './CarouselDataProcessor';
import { ThemeProcessor } from './ThemeProcessor';

// Font loaders must be called in module scope
const playfair = Playfair_Display({ subsets: ['latin'] });

interface CategoryDetailProps {
  product: ProductWithCarousel;
}

export default function CategoryDetail({ product }: CategoryDetailProps) {
  const isWedding = product.slug === 'wedding';
  const themeClassName = isWedding ? `wedding-theme ${playfair.className}` : '';

  return (
    <>
      {/* Server-side optimizations */}
      <EnhancedImagePreloader product={product} />
      <CarouselDataProcessor product={product} />
      <ThemeProcessor product={product} />
      
      <div className={`category-detail-visual ${themeClassName}`}>
        {/* Breadcrumb */}
        <nav className="breadcrumb-visual">
          <div className="container">
            <Link href="/store" className="breadcrumb-link">Store</Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{product.title}</span>
          </div>
        </nav>

        {/* Product Carousel Section - Client Component */}
        <ProductCarousel 
          carouselItems={product.carousel_items?.filter((item): item is NonNullable<typeof item> => 
            item !== null && item.image_url !== null && item.message_h1 !== null
          ) || []} 
          productTitle={product.title || ''} 
          productSlug={product.slug || ''} 
        />

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Create Your {product.title}?</h2>
              <p className="cta-description">
                Start your custom design today and bring your vision to life
              </p>
              <Link href={`/store/${product.slug}/design`} className="cta-button-primary">
                Start Design Now
              </Link>
            </div>
          </div>
        </section>

        {/* Design Process Section */}
        <ProcessSection product={product} />
      </div>
    </>
  );
}
