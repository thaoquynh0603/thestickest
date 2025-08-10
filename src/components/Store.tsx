'use client';

import Link from 'next/link';
import { useState } from 'react';

interface StoreCategory {
  id: string;
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

interface StoreData {
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
        {/* Compact Pricing Container */}
        <div className="pricing-container-compact">
          <div className="pricing-header-compact">
            <p className="pricing-subtitle-compact">Transparent. Easy. Worry-free.</p>
          </div>
          
          <div className="pricing-steps-compact">
            <div className="pricing-step-compact" onClick={() => toggleStep(0)}>
              <div className="step-header-compact">
                <h3>Start Your Design for Just $2</h3>
                <span className="expand-icon">{expandedStep === 0 ? '−' : '+'}</span>
              </div>
              <div className={`step-content-compact ${expandedStep === 0 ? '' : 'collapsed'}`}>
                <p>Your sticker design deposit is only $2—and it's fully refundable if you're not completely satisfied!</p>
                <p className="feedback-note-compact">Includes one free feedback session</p>
              </div>
            </div>
            
            <div className="pricing-step-compact" onClick={() => toggleStep(1)}>
              <div className="step-header-compact">
                <h3>Approve and Customize</h3>
                <span className="expand-icon">{expandedStep === 1 ? '−' : '+'}</span>
              </div>
              <div className={`step-content-compact ${expandedStep === 1 ? '' : 'collapsed'}`}>
                <p>After you approve your beautiful design, easily choose your sticker options:</p>
                <div className="options-grid-compact">
                  <div className="option-item-compact">
                    <span className="option-label-compact">Material</span>
                  </div>
                  <div className="option-item-compact">
                    <span className="option-label-compact">Size</span>
                  </div>
                  <div className="option-item-compact">
                    <span className="option-label-compact">Quantity</span>
                  </div>
                </div>
                <p className="price-range-compact">Prices range from just $2 to $7 per sticker.</p>
              </div>
            </div>
            
            <div className="pricing-step-compact" onClick={() => toggleStep(2)}>
              <div className="step-header-compact">
                <h3>Order Exactly What You Need</h3>
                <span className="expand-icon">{expandedStep === 2 ? '−' : '+'}</span>
              </div>
              <div className={`step-content-compact ${expandedStep === 2 ? '' : 'collapsed'}`}>
                <p>No minimum order—order one or one hundred, completely your choice!</p>
                <p className="shipping-info-compact">Free shipping on orders of 50 stickers or more.</p>
              </div>
            </div>
          </div>
        </div>

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
                    href={`/store/${category.id}`} 
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
