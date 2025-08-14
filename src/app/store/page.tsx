import Store, { type StoreData } from '@/components/Store';
import { createClient } from '@/lib/supabase/server';

export default async function StorePage() {
  const supabase = createClient();
  
  // Fetch all active products
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error || !products) {
    console.error('Error fetching products:', error);
    return <Store data={{ 
      title: "Custom Sticker Store", 
      subtitle: "Find the perfect stickers for every occasion", 
      categories: [],
      features: {
        design: "Professional design included",
        revisions: "Unlimited revisions",
        quality: "Premium materials",
        shipping: "Fast worldwide shipping",
        support: "24/7 customer support"
      }
    }} />;
  }

  // Transform the data to match the expected store format
  const storeData: StoreData = {
    title: "Custom Sticker Store",
    subtitle: "Find the perfect stickers for every occasion",
    categories: products.map(product => ({
      id: product.id || '',
      title: product.title || 'Untitled Product',
      description: product.description || 'No description available',
      image: product.product_image_url || '/placeholder-image.jpg',
      features: Array.isArray(product.features) ? product.features : [],
      use_cases: Array.isArray(product.use_cases) ? product.use_cases : [],
      materials: Array.isArray(product.materials) ? product.materials : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      starting_price: `$${product.starting_price || '0.00'}`,
      min_quantity: product.min_quantity || 1,
      design_time: product.design_time || "1-2 business days",
      examples: Array.isArray(product.examples) ? product.examples : []
    })),
    features: {
      design: "Professional design included",
      revisions: "Unlimited revisions",
      quality: "Premium materials",
      shipping: "Fast worldwide shipping",
      support: "24/7 customer support"
    }
  };
  
  return <Store data={storeData} />;
}
