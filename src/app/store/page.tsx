import Store from '@/components/Store';
import { getAllProducts, transformProductsToStoreData } from '@/lib/supabase';

export default async function StorePage() {
  // Fetch products from Supabase
  const products = await getAllProducts();
  
  // Transform the data to match the expected format
  const storeData = transformProductsToStoreData(products);
  
  return <Store data={storeData} />;
}
