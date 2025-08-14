import React from 'react';

interface WelcomeStepProps {
  onStart: () => void;
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="step-container">
      <h2 className="step-title">Welcome</h2>
      <div className="step-description" style={{ marginBottom: 24 }}>
        Here's the simple process to get your custom stickers:
      </div>
      <ul className="welcome-list" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        <li className="review-item">1. Fill out the application and pay refundable fee</li>
        <li className="review-item">2. Then the design will be send within 24 hours with a order form</li>
        <li className="review-item">3. you fill out the order form and pay for the physical sticker and delivery fee</li>
      </ul>
      <div className="welcome-navigation">
        <button className="cta-button-primary" onClick={onStart}>
          Let's make stickers
        </button>
      </div>
    </div>
  );
}


