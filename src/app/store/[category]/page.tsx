import { notFound } from 'next/navigation';
import CategoryDetail from '@/components/CategoryDetail';
import { getAllProducts, getProductBySlug } from '@/lib/supabase';

interface CategoryPageProps {
  params: {
    category: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const product = await getProductBySlug(params.category);

  if (!product) {
    notFound();
  }

  return <CategoryDetail product={product} />;
}

export async function generateStaticParams() {
  // Fetch all active products to generate static params
  const products = await getAllProducts();
  
  return products.map((product) => ({
    category: product.slug,
  }));
}
