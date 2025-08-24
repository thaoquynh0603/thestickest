'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';

interface StripePaymentProps {
  applicationId: string;
  email?: string;
  originalAmount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading?: boolean;
}

interface DiscountCodeResult {
  isValid: boolean;
  discountAmount: number;
  discountType: string;
  discountValue: number;
  message: string;
  finalAmount: number;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!, {
  apiVersion: '2025-07-30.basil',
  stripeAccount: undefined,
  betas: ['elements_enable_deferred_intent_beta_1']
});

export default function StripePayment({ 
  applicationId, 
  email, 
  originalAmount,
  onSuccess, 
  onError, 
  isLoading = false 
}: StripePaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discountResult, setDiscountResult] = useState<DiscountCodeResult | null>(null);
  const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Use nullish coalescing so a valid 0 final amount does not fall back to the original amount
  const finalAmount = (discountResult?.finalAmount ?? originalAmount);
  const discountAmount = (discountResult?.discountAmount ?? 0);

  const validateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    setIsValidatingDiscount(true);
    setDiscountError(null);

    try {
      const response = await fetch('/api/validate-discount-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode.trim(),
          email: email || '',
          orderAmount: originalAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDiscountError(data.error || 'Invalid discount code');
        setDiscountResult(null);
        return;
      }

      setDiscountResult(data);
      setDiscountError(null);
    } catch (err) {
      setDiscountError('Failed to validate discount code');
      setDiscountResult(null);
    } finally {
      setIsValidatingDiscount(false);
    }
  };

  const handlePayment = async () => {
    if (isProcessing || isLoading) return;

    setIsProcessing(true);
    setError(null);

    try {
      // If final amount is zero, skip Stripe and mark as paid
      if (finalAmount <= 0) {
        const r = await fetch('/api/zero-amount-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            email: email || '',
            originalAmount,
            discountCode: discountResult ? discountCode : undefined,
            discountAmount,
          }),
        });
        if (!r.ok) {
          const e = await r.json();
          throw new Error(e.error || 'Failed to record zero-amount payment');
        }
        onSuccess();
        return;
      }

      // Prefer Stripe Checkout for full-page card entry and redirects
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          email: email || '',
          discountCode: discountResult ? discountCode : undefined,
          originalAmount: originalAmount,
          returnUrl: window.location.origin,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start checkout');
      }

      const { sessionId } = await response.json();

      // Load Stripe with error handling
      let stripe;
      try {
        stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load');
        }
      } catch (stripeLoadError) {
        console.error('Stripe loading error:', stripeLoadError);
        // If it's a locale error, try to reload without locale config
        if (stripeLoadError instanceof Error && stripeLoadError.message.includes('Cannot find module')) {
          try {
            const fallbackStripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
            if (!fallbackStripe) {
              throw new Error('Stripe fallback failed to load');
            }
            stripe = fallbackStripe;
          } catch (fallbackError) {
            throw new Error('Payment system unavailable. Please try again later.');
          }
        } else {
          throw new Error('Payment system unavailable. Please try again later.');
        }
      }

      // Redirect to Checkout
      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment failed');
      }

      // Payment successful
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="stripe-payment">
      <div className="payment-summary">
        <h3>Payment Summary</h3>
        
        {/* Discount Code Section */}
        <div className="discount-section">
          <h4>Have a discount code?</h4>
          <div className="discount-input-group">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Enter discount code"
              className="discount-input"
              disabled={isValidatingDiscount}
            />
            <button
              onClick={validateDiscountCode}
              disabled={isValidatingDiscount || !discountCode.trim()}
              className="discount-button"
            >
              {isValidatingDiscount ? 'Validating...' : 'Apply'}
            </button>
          </div>
          
          {discountError && (
            <div className="discount-error">
              <p>{discountError}</p>
            </div>
          )}
          
          {discountResult && (
            <div className="discount-success">
              <p>{discountResult.message}</p>
            </div>
          )}
        </div>

        <div className="payment-details">
          <div className="payment-item">
            <span>Design Request Fee:</span>
            <span>${originalAmount.toFixed(2)}</span>
          </div>
          
          {discountAmount > 0 && (
            <div className="payment-item discount">
              <span>Discount:</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          
          <div className="payment-total">
            <span>Total:</span>
            <span>${finalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <p>Error: {error}</p>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={isProcessing || isLoading}
        className="payment-button"
      >
        {isProcessing || isLoading ? 'Processing...' : `Pay $${finalAmount.toFixed(2)}`}
      </button>

      <div className="payment-info">
        <p>Your payment is secure and processed by Stripe.</p>
        <p>You will receive a confirmation email after successful payment.</p>
      </div>
    </div>
  );
}
