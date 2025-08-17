import React, { useState } from 'react';
import welcomeData from './welcome-page.json';

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  // explicit any because JSON import types are dynamic; keeps strict mode happy
  const welcome: any = welcomeData ?? {};
  const wp: any = welcome.welcome_page ?? {};
  const compact = wp.compact_pricing ?? {};
  const pricingSteps: any[] = Array.isArray(compact.steps) ? compact.steps : [];
  const processIntro: string = wp.process_intro ?? '';
  const processSteps: string[] = Array.isArray(wp.process_steps) ? wp.process_steps : [];
  const cta = wp.cta ?? { text: 'Start', aria_label: 'Start' };
  // Track which compact pricing step (if any) is expanded on the welcome screen
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (index: number) => {
    setExpandedStep(prev => (prev === index ? null : index));
  };

  return (
    <div className="step-container">
  <h2 className="step-title">{wp.title ?? 'Welcome'}</h2>
      {/* Compact Pricing Container */}
      <div className="pricing-container-compact">
        <div className="pricing-header-compact">
          <p className="pricing-subtitle-compact">{welcome.welcome_page.compact_pricing.header}</p>
        </div>

        <div className="pricing-steps-compact">
          {pricingSteps.map((step: any, idx: number) => (
            <div className="pricing-step-compact" key={idx} onClick={() => toggleStep(idx)}>
              <div className="step-header-compact">
                <h3>{step.title}</h3>
                <span className="expand-icon">{expandedStep === idx ? '−' : '+'}</span>
              </div>
              <div className={`step-content-compact ${expandedStep === idx ? '' : 'collapsed'}`}>
                <p>{step.description}</p>
                {step.note && <p className="feedback-note-compact">{step.note}</p>}
                {step.options && (
                  <div className="options-grid-compact">
                    {step.options.map((opt: string, oi: number) => (
                      <div className="option-item-compact" key={oi}>
                        <span className="option-label-compact">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {step.price_range && <p className="price-range-compact">{step.price_range}</p>}
                {step.shipping_info && <p className="shipping-info-compact">{step.shipping_info}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="step-description" style={{ marginBottom: 24 }}>
        {processIntro}
      </div>
      <ul className="welcome-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {processSteps.map((s: string, i: number) => (
          <li className="review-item" key={i}>{s}</li>
        ))}
      </ul>
      <div className="welcome-navigation">
        <button className="cta-button-primary" onClick={onStart} aria-label={cta.aria_label}>
          {cta.text}
        </button>
      </div>
    </div>
  );
}


