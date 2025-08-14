import { Product } from '@/types/database';

interface CarouselItem {
  id: string;
  image_url: string;
  is_active: boolean | null;
  message_h1: string;
  message_text: string | null;
  position: string | null;
  product_id: string | null;
  sort_order: number | null;
}

interface CarouselDataProcessorProps {
  product: Product & {
    carousel_items?: CarouselItem[];
  };
}

// Server-side carousel data processing
export function CarouselDataProcessor({ product }: CarouselDataProcessorProps) {
  // Process carousel data on the server
  const processedCarouselData = (product.carousel_items || [])
    .filter((item): item is CarouselItem & { is_active: boolean; sort_order: number } => 
      item.is_active === true && 
      item.sort_order !== null
    )
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(item => {
      const position = item.position || 'center';
      return {
        image: item.image_url,
        title: item.message_h1,
        subtitle: item.message_text,
        position,
        // Pre-calculate common positions for better performance
        positionClass: getPositionClass(position)
      };
    });

  // Serialize data for client-side consumption
  const serializedData = JSON.stringify(processedCarouselData);

  return (
    <script
      type="application/json"
      id="carousel-data"
      dangerouslySetInnerHTML={{ __html: serializedData }}
    />
  );
}

// Helper function to get CSS position classes
function getPositionClass(position: string): string {
  const positionMap: Record<string, string> = {
    'center': 'position-center',
    'top-left': 'position-top-left',
    'top-center': 'position-top-center',
    'top-right': 'position-top-right',
    'center-left': 'position-center-left',
    'center-right': 'position-center-right',
    'bottom-left': 'position-bottom-left',
    'bottom-center': 'position-bottom-center',
    'bottom-right': 'position-bottom-right'
  };
  
  return positionMap[position] || 'position-center';
}
