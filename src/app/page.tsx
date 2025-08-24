'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import FeatureCards from '@/components/FeatureCards';
import UseCases from '@/components/UseCases';
import CTA from '@/components/CTA';
import WorryFree from '@/components/WorryFree';
import StickerShowcase from '@/components/StickerShowcase';

import landing from '../../landing-page.json';

type Landing = typeof import('../../landing-page.json');

export default function Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [safeData, setSafeData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Add more robust data validation
      if (!landing || !landing.landing_page) {
        console.error('Landing page data is missing or malformed:', landing);
        throw new Error('Landing page data is missing or malformed');
      }

      const data = landing.landing_page;

      // Add logging to debug data issues
      console.log('Landing page data:', data);
      console.log('Data type check:', {
        landing: typeof landing,
        landing_page: typeof data,
        interest: typeof data?.interest,
        features: typeof data?.interest?.features,
        isFeaturesArray: Array.isArray(data?.interest?.features),
        worryItems: typeof data?.worry_free_experience?.items,
        isWorryItemsArray: Array.isArray(data?.worry_free_experience?.items),
        carousels: typeof data?.showcase?.carousels,
        isCarouselsArray: Array.isArray(data?.showcase?.carousels)
      });

      // Add defensive checks to ensure data is valid and arrays are properly initialized
      const processedData = {
        attention: data?.attention || "Want Stunning Custom Stickers—Designed, Printed, and Shipped Directly to You?",
        interest: {
          headline: data?.interest?.headline || "Forget complicated processes and separate platforms. Our all-in-one custom sticker service gives you:",
          features: Array.isArray(data?.interest?.features) ? data.interest.features : [],
          use_cases: Array.isArray(data?.interest?.use_cases) ? data.interest.use_cases : [],
          additional_benefits: Array.isArray(data?.interest?.additional_benefits) ? data.interest.additional_benefits : []
        },
        desire: data?.desire || "Imagine the excitement as your custom stickers arrive—beautifully packaged, perfectly personalized, and ready to delight friends and family. Make every moment unforgettable, effortlessly.",
        action: {
          cta_text: data?.action?.cta_text || "Your perfect stickers await—order today!",
          button_text: data?.action?.button_text || "Create My Stickers"
        },
        worry_free_experience: {
          title: data?.worry_free_experience?.title || "Worry-Free Experience",
          description: data?.worry_free_experience?.description || "We're committed to making your custom sticker experience completely stress-free, from start to finish:",
          items: Array.isArray(data?.worry_free_experience?.items) ? data.worry_free_experience.items : [],
          closing: data?.worry_free_experience?.closing || "Enjoy total peace of mind—we've got you covered every step of the way."
        },
        showcase: {
          title: data?.showcase?.title || "Sticker Showcase",
          subtitle: data?.showcase?.subtitle || "See our amazing stickers in action.",
          carousels: Array.isArray(data?.showcase?.carousels) ? data.showcase.carousels : [],
          feature_labels: data?.showcase?.feature_labels || {},
          overlay: data?.showcase?.overlay || { title: "", bullets: [] }
        }
      };

      // Log the safe data to ensure it's properly structured
      console.log('Safe data being passed to components:', processedData);

      // Additional validation to ensure all arrays are properly initialized
      if (!Array.isArray(processedData.interest.features)) {
        console.warn('Features array is not properly initialized, defaulting to empty array');
        processedData.interest.features = [];
      }
      if (!Array.isArray(processedData.interest.use_cases)) {
        console.warn('Use cases array is not properly initialized, defaulting to empty array');
        processedData.interest.use_cases = [];
      }
      if (!Array.isArray(processedData.interest.additional_benefits)) {
        console.warn('Additional benefits array is not properly initialized, defaulting to empty array');
        processedData.interest.additional_benefits = [];
      }
      if (!Array.isArray(processedData.worry_free_experience.items)) {
        console.warn('Worry free items array is not properly initialized, defaulting to empty array');
        processedData.worry_free_experience.items = [];
      }
      if (!Array.isArray(processedData.showcase.carousels)) {
        console.warn('Carousels array is not properly initialized, defaulting to empty array');
        processedData.showcase.carousels = [];
      }

      // Final validation before setting state
      console.log('Final processed data validation:', {
        features: Array.isArray(processedData.interest.features),
        useCases: Array.isArray(processedData.interest.use_cases),
        additionalBenefits: Array.isArray(processedData.interest.additional_benefits),
        worryItems: Array.isArray(processedData.worry_free_experience.items),
        carousels: Array.isArray(processedData.showcase.carousels)
      });

      setSafeData(processedData);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing landing page data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsLoading(false);
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className="landing-page-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Loading...</h1>
          <p>Please wait while we prepare your experience.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="landing-page-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Welcome to TheStickest</h1>
          <p>We're experiencing some technical difficulties. Please try refreshing the page.</p>
          <p>If the problem persists, please contact support.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '1rem' }}>
            Error details: {error}
          </p>
        </div>
      </div>
    );
  }

  // Render the page with validated data
  return (
    <div className="landing-page-container">
      <Hero
        attention={safeData.attention}
        ctaText={safeData.interest.headline}
        buttonText={safeData.action.button_text}
      />

      <FeatureCards features={safeData.interest.features} />
      
      <StickerShowcase
        title={safeData.showcase.title}
        subtitle={safeData.showcase.subtitle}
        carousels={safeData.showcase.carousels}
        featureLabels={safeData.showcase.feature_labels}
        overlay={safeData.showcase.overlay}
      />

      <UseCases
        useCases={safeData.interest.use_cases}
        additionalBenefits={safeData.interest.additional_benefits}
      />

      <WorryFree
        title={safeData.worry_free_experience.title}
        description={safeData.worry_free_experience.description}
        items={safeData.worry_free_experience.items}
        closing={safeData.worry_free_experience.closing}
      />

      <CTA desire={safeData.desire} buttonText={safeData.action.button_text} />
    </div>
  );
}

