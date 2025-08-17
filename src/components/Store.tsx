'use client';

import Link from 'next/link';
import { useState } from 'react';

interface StoreCategory {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  features: string[];
  use_cases: string[];
  materials: string[];
  sizes: string[];
  starting_price: string;
  min_quantity: number;
  design_time: string;
  examples: string[];
}

export interface StoreData {
  title: string;
  subtitle: string;
  categories: StoreCategory[];
  features: {
    design: string;
    revisions: string;
    quality: string;
    shipping: string;
    support: string;
  };
}

interface StoreProps {
  data: StoreData;
}

export default function Store({ data }: StoreProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (stepIndex: number) => {
    setExpandedStep(expandedStep === stepIndex ? null : stepIndex);
  };

  return (
    <section id="store" className="store">
      <div className="container">
        <div className="store-categories">
          <div className="store-categories-grid">
            {data.categories.map((category) => (
              <div key={category.id} className="store-category-card">
                <div className="store-category-image">
                  <img src={category.image} alt={category.title} />
                </div>
                
                <div className="store-category-content">
                  <h3 className="store-category-title">{category.title}</h3>
                  <p className="store-category-description">{category.description}</p>
                  
                  <Link 
                    href={`/store/${category.slug}`} 
                    className="store-category-cta"
                  >
                    View {category.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}
