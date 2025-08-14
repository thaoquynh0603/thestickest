import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { ProductWithCarousel } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Define the template type
type Template = {
  id: string;
  name: string;
  font_family: string | null;
  palette: {
    overlayBg?: string;
    overlayInk?: string;
    overlayMuted?: string;
    accent?: string;
    pageBg?: string;
    breadcrumbBg?: string;
    ctaSectionBg?: string;
    processBg?: string;
  };
};

// Define the carousel item type
type CarouselItem = {
  id: string;
  image_url: string;
  message_h1: string;
  message_text: string | null;
  position: string | null;
  sort_order: number | null;
  is_active: boolean | null;
  product_id: string | null;
};

// Define the product type with relations
type ProductWithRelations = {
  id: string;
  created_at: string | null;
  updated_at: string | null;
  title: string;
  description: string | null;
  slug: string;
  is_active: boolean;
  product_image_url: string | null;
  template_id: string | null;
  templates?: Template | null;
  carousel_items?: CarouselItem[] | null;
};

export async function getProductBySlug(slug: string): Promise<ProductWithCarousel | null> {
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
        is_active,
        product_id
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

  // Type assertion for the product with relations
  const productWithRelations = product as unknown as ProductWithRelations;
  
  // Get the default palette
  const defaultPalette = {
    overlayBg: 'rgba(0, 0, 0, 0.7)',
    overlayInk: '#ffffff',
    overlayMuted: '#cccccc',
    accent: '#ff6b6b',
    pageBg: '#ffffff',
    breadcrumbBg: '#f8f9fa',
    ctaSectionBg: '#f8f9fa',
    processBg: '#ffffff'
  };

  // Get the template palette or use default
  const templatePalette = productWithRelations.templates?.palette || {};
  const mergedPalette = { ...defaultPalette, ...templatePalette };

  // Filter and sort carousel items
  const carouselItems = (productWithRelations.carousel_items || [])
    .filter((item): item is CarouselItem => 
      item.is_active === true && !!item.id
    )
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Transform the data to match the expected ProductWithCarousel interface
  const transformedProduct: ProductWithCarousel = {
    ...productWithRelations,
    template_name: productWithRelations.templates?.name || '',
    font_family: productWithRelations.templates?.font_family || '',
    palette: mergedPalette,
    carousel_items: carouselItems
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
