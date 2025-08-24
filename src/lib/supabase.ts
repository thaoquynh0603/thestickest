import { createClient } from '@supabase/supabase-js';
import type { Database, ProductWithCarousel } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  // Minimize websocket warnings by configuring realtime
  realtime: {
    params: {
      eventsPerSecond: 1, // Limit realtime events to reduce websocket overhead
    },
  },
  // Only enable auth features that are actually needed
  auth: {
    autoRefreshToken: true, // Keep this for user authentication
    persistSession: true,   // Keep this for user sessions
  },
  // Disable global features that might import problematic modules
  global: {
    headers: {},
  },
});

export async function getProductBySlug(slug: string): Promise<ProductWithCarousel | null> {
  // Use database function that returns denormalized product data with template info
  const { data: products, error: productError } = await supabase
    .rpc('get_product_by_slug', { product_slug: slug });

  if (productError) {
    console.error('Error fetching product:', productError);
    return null;
  }

  if (!products || products.length === 0) return null;

  const product = products[0];

  // Parse carousel items and palette JSON
  let parsedCarouselItems = [];
  let parsedPalette;

  try {
    if (Array.isArray(product.carousel_items)) {
      parsedCarouselItems = product.carousel_items;
    } else if (typeof product.carousel_items === 'string') {
      parsedCarouselItems = JSON.parse(product.carousel_items || '[]');
    } else {
      parsedCarouselItems = [];
    }
  } catch (error) {
    console.warn('Failed to parse carousel_items JSON:', error);
    parsedCarouselItems = [];
  }

  try {
    parsedPalette = typeof product.palette === 'string' 
      ? JSON.parse(product.palette) 
      : product.palette || {};
  } catch (error) {
    console.warn('Failed to parse palette JSON:', error);
    parsedPalette = {};
  }

  // Transform the data to match the expected ProductWithCarousel interface
  const transformedProduct: ProductWithCarousel = {
    // Product fields
    id: product.id,
    slug: product.slug,
    title: product.title,
    subtitle: product.subtitle,
    product_image_url: product.product_image_url,
    description: product.description,
    is_active: product.is_active,
    created_at: product.created_at,
    updated_at: product.updated_at,
    price: (product as any).price || 2, // Use any to handle the dynamic return type
    template_id: null, // Not returned by the function, but required by Product type
  // Fields required by Product type but not always returned by the RPC
  display_order: (product as any).display_order ?? null,
  name: (product as any).name ?? product.title ?? null,
    
    // ProductWithCarousel additional fields
    template_name: product.template_name || '',
    font_family: product.font_family || '',
    palette: {
      overlayBg: 'rgba(0, 0, 0, 0.7)',
      overlayInk: '#ffffff',
      overlayMuted: '#cccccc',
      accent: '#ff6b6b',
      pageBg: '#ffffff',
      breadcrumbBg: '#f8f9fa',
      ctaSectionBg: '#f8f9fa',
      processBg: '#ffffff',
      ...parsedPalette // Override defaults with actual data
    },
    carousel_items: parsedCarouselItems
      .filter((item: any) => item.is_active)
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
  };

  return transformedProduct;
}

export async function getAllProducts() {
  // Use database function that returns denormalized product data
  const { data: products, error } = await supabase
    .rpc('get_product_details');

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products || [];
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
      features: ["Custom designs", "High quality materials", "Fast turnaround"],
      use_cases: ["Personal use", "Business branding", "Events and promotions"],
      materials: ["Premium vinyl", "UV resistant ink"],
      sizes: ["2\" x 2\"", "3\" x 3\"", "4\" x 4\"", "Custom sizes"],
      starting_price: `$${product.price || 2}`,
      min_quantity: 1,
      design_time: "1-2 business days",
      examples: ["Sample designs available"]
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
