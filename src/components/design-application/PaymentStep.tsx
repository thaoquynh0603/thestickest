import React from 'react';
import StripePayment from '@/components/StripePayment';

interface PaymentStepProps {
  applicationId: string;
  email?: string;
  amount: number;
  isLoading: boolean;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}

export function PaymentStep({ applicationId, email, amount, isLoading, onSuccess, onError }: PaymentStepProps) {
  // Validate that email exists before allowing payment
  if (!email || email.trim() === '') {
    return (
      <div className="step-container">
        <h2 className="step-title">Payment Error</h2>
        <div className="error-message" style={{ color: '#dc2626', padding: '20px', textAlign: 'center' }}>
          <p>❌ <strong>Email address is required</strong></p>
          <p>Please go back to the previous step and provide your email address.</p>
          <p>This is required to send you confirmation emails and updates about your design request.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="step-container">
      <h2 className="step-title">Payment</h2>
      <p className="step-description">Complete your payment of ${amount} to finalize your design request.</p>
      <StripePayment
        applicationId={applicationId}
        email={email}
        originalAmount={amount}
        onSuccess={onSuccess}
        onError={onError}
        isLoading={isLoading}
      />
    </div>
  );
}


