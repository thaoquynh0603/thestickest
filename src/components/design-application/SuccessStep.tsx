import React from 'react';

interface SuccessStepProps {
  designCode: string;
  productTitle: string;
  email?: string;
  amount: number;
}

export function SuccessStep({ designCode, productTitle, email, amount }: SuccessStepProps) {
  return (
    <div className="step-container success">
      <h2 className="step-title">Payment Successful!</h2>
      <p className="step-description">Thank you for your order! Your design request has been submitted successfully.</p>

      <div className="design-code-display">
        <p className="design-code-label">
          Your Design Code: <strong>{designCode}</strong>
        </p>
        <p className="design-code-help">Save this code to track your application later</p>
      </div>

      <div className="success-details">
        <p>
          <strong>Product:</strong> {productTitle}
        </p>
        <p>
          <strong>Email:</strong> {email}
        </p>
        <p>
          <strong>Amount Paid:</strong> ${amount}
        </p>
      </div>
      <div className="next-steps">
        <h3>What happens next?</h3>
        <ul>
          <li>We'll review your request within 24 hours</li>
          <li>Our design team will start working on your concept</li>
          <li>You'll receive updates via email</li>
          <li>You can track progress using your design code</li>
        </ul>
      </div>
      <p className="important-note">
        <strong>Important:</strong> Please save your design code ({designCode}) for easy reference and tracking.
      </p>
    </div>
  );
}


