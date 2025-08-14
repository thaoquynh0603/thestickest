import { ProductWithCarousel } from '@/types/database';

interface ImagePreloaderProps {
  product: ProductWithCarousel;
}

export function ImagePreloader({ product }: ImagePreloaderProps) {
  // Get all carousel images for preloading
  const carouselImages = (product.carousel_items || [])
    .filter(item => item?.is_active && item.image_url)
    .map(item => item.image_url) as string[];

  return (
    <>
      {/* Preload critical images */}
      {carouselImages.slice(0, 2).map((imageUrl, index) => (
        <link
          key={index}
          rel="preload"
          as="image"
          href={imageUrl}
          type="image/webp"
        />
      ))}
      
      {/* Prefetch remaining images */}
      {carouselImages.slice(2).map((imageUrl, index) => (
        <link
          key={index + 2}
          rel="prefetch"
          as="image"
          href={imageUrl}
          type="image/webp"
        />
      ))}
    </>
  );
}
