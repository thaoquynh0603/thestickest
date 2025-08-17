import { notFound } from 'next/navigation';
import CategoryDetail from '@/components/CategoryDetail';
import { ProductWithCarousel } from '@/types/database';
import { getProductBySlug } from '@/lib/supabase';
import { createBuildTimeClient } from '@/lib/supabase/server';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

// Enable caching for better performance
export const revalidate = 3600; // Revalidate every hour

export default async function CategoryPage({ params }: CategoryPageProps) {
  // Fetch product with template and carousel data
  const product = await getProductBySlug(params.category);

  if (!product) {
    notFound();
  }

  // Product is already transformed by getProductBySlug with template data and carousel items
  return <CategoryDetail product={product} />;
}

export async function generateStaticParams() {
  const supabase = createBuildTimeClient();
  
  // Fetch all active products to generate static params
  const { data: products, error } = await supabase
    .from('products')
    .select('slug')
    .eq('is_active', true)
    .neq('slug', 'general_default_hidden');
  
  if (error || !products) {
    return [];
  }
  
  return products.map((product: { slug: string }) => ({
    category: product.slug,
  }));
}
