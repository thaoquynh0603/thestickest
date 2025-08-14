import { notFound } from 'next/navigation';
import CategoryDetail from '@/components/CategoryDetail';
import { createClient, createBuildTimeClient } from '@/lib/supabase/server';
import { ProductWithCarousel, CarouselItem } from '@/types/database';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// Enable caching for better performance
export const revalidate = 3600; // Revalidate every hour

export default async function CategoryPage({ params }: CategoryPageProps) {
  const supabase = createClient();
  
  // Fetch product with carousel items using server-side client
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      carousel_items (
        id,
        image_url,
        message_h1,
        message_text,
        position,
        sort_order,
        is_active
      )
    `)
    .eq('slug', params.category)
    .eq('is_active', true)
    .single();

  if (productError || !product) {
    notFound();
  }

  const transformedProduct: ProductWithCarousel = {
    ...product,
    template_name: product.template_name || 'Default Template',
    font_family: product.font_family || 'Inter, sans-serif',
    palette: product.palette || {
      overlayBg: 'rgba(0, 0, 0, 0.7)',
      overlayInk: '#ffffff',
      overlayMuted: '#cccccc',
      accent: '#ff6b6b',
      pageBg: '#ffffff',
      breadcrumbBg: '#f8f9fa',
      ctaSectionBg: '#f8f9fa',
      processBg: '#ffffff'
    },
    carousel_items: (product.carousel_items || [])
      .filter((item): item is CarouselItem => 
        Boolean(item && 
          item.id && 
          item.image_url && 
          item.message_h1 !== undefined &&
          item.sort_order !== undefined
        )
      )
      .map(item => ({
        ...item,
        product_id: item.product_id || product.id, // Ensure product_id is set
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  };

  return <CategoryDetail product={transformedProduct} />;
}

export async function generateStaticParams() {
  const supabase = createBuildTimeClient();
  
  // Fetch all active products to generate static params
  const { data: products, error } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true);
  
  if (error || !products) {
    return [];
  }
  
  return products.map((product) => ({
    category: product.slug,
  }));
}
