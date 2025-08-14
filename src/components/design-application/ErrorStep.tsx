import React from 'react';

interface ErrorStepProps {
  designCode: string;
  productTitle: string;
}

export function ErrorStep({ designCode, productTitle }: ErrorStepProps) {
  return (
    <div className="step-container error">
      <h2 className="step-title">Payment Unsuccessful</h2>
      <p className="step-description">
        We're sorry, but the payment was not successful. Please try again or contact us for assistance.
      </p>
      <div className="error-details">
        <p>
          <strong>Design Code:</strong> {designCode}
        </p>
        <p>
          <strong>Product:</strong> {productTitle}
        </p>
      </div>
      <div className="contact-info">
        <p>If you need assistance, please contact us at:</p>
        <p>
          <strong>Email:</strong> hello@stickest.com
        </p>
      </div>
    </div>
  );
}


