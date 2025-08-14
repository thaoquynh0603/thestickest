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


