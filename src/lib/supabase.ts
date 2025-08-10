import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function getProductBySlug(slug: string) {
  // Fetch product with template and carousel items
  const { data: product, error: productError } = await supabase
    .from('products')
    .select(`
      *,
      templates (
        id,
        name,
        font_family,
        palette
      ),
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
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (productError) {
    console.error('Error fetching product:', productError);
    return null;
  }

  if (!product) return null;

  // Transform the data to match the expected Product interface
  const transformedProduct = {
    ...product,
    template_name: product.templates?.name || '',
    font_family: product.templates?.font_family || '',
    palette: product.templates?.palette || {
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
      .filter((item: any) => item.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
  };

  return transformedProduct;
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data || [];
}

// Transform Supabase product data to match the expected store format
export function transformProductsToStoreData(products: any[]) {
  return {
    title: "Custom Stickers",
    subtitle: "High-quality, personalized stickers for every occasion",
    categories: products.map(product => ({
      id: product.slug,
      title: product.title,
      description: product.description || product.subtitle,
      image: product.product_image_url,
      features: product.features || [],
      use_cases: product.use_cases || [],
      materials: product.materials || [],
      sizes: product.sizes || [],
      starting_price: `$${product.starting_price}`,
      min_quantity: product.min_quantity || 1,
      design_time: product.design_time || "1-2 business days",
      examples: product.examples || []
    })),
    features: {
      design: "Custom designs tailored to your needs",
      revisions: "Free revisions until you're satisfied",
      quality: "Premium materials and printing",
      shipping: "Fast shipping worldwide",
      support: "24/7 customer support"
    }
  };
}
