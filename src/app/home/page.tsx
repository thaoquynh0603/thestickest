import Hero from '@/components/Hero';
import FeatureCards from '@/components/FeatureCards';
import UseCases from '@/components/UseCases';
import CTA from '@/components/CTA';
import WorryFree from '@/components/WorryFree';
import StickerShowcase from '@/components/StickerShowcase';

import landing from '../../../landing-page.json';

type Landing = typeof import('../../../landing-page.json');

export default function HomePage() {
  const data = (landing as Landing).landing_page;

  return (
    <div className="landing-page-container">
      <Hero
        attention={data.attention}
        ctaText={data.interest.headline}
        buttonText={data.action.button_text}
      />

      <FeatureCards features={data.interest.features} />

      <UseCases
        useCases={data.interest.use_cases}
        additionalBenefits={data.interest.additional_benefits}
      />

      <WorryFree
        title={data.worry_free_experience.title}
        description={data.worry_free_experience.description}
        items={data.worry_free_experience.items}
        closing={data.worry_free_experience.closing}
      />

      <StickerShowcase
        title={data.showcase.title}
        subtitle={data.showcase.subtitle}
        carousels={data.showcase.carousels}
        featureLabels={data.showcase.feature_labels}
        overlay={data.showcase.overlay}
      />

      <CTA desire={data.desire} buttonText={data.action.button_text} />
    </div>
  );
}
