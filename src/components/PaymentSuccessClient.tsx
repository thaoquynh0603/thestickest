'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  description?: string;
}

interface PaymentEvent {
  amount: number;
  currency: string;
  status: string;
  event_type: string;
}

interface Application {
  id: string;
  email?: string;
  design_code: string;
  status: string;
  created_at: string;
  products?: Product;
  payment_events?: PaymentEvent[];
  total_amount?: number;
}

interface PaymentSuccessClientProps {
  application: Application;
  designCode: string;
}

export function PaymentSuccessClient({ application, designCode }: PaymentSuccessClientProps) {
  const router = useRouter();
  
  // Prevent back navigation to this page
  useEffect(() => {
    // Replace the current history entry with the home URL
    // This prevents the back button from returning to this page
    window.history.replaceState(null, '', '/');
    
    // Handle back/forward navigation
    const handleBackForward = () => {
      // If user tries to go back, push them forward to the home page
      router.replace('/');
    };

    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handleBackForward);

    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handleBackForward);
    };
  }, [router]);

  // Helper function to get the amount paid
  const getAmountPaid = (): string => {
    // Try to get amount from payment events first
    if (application.payment_events && application.payment_events.length > 0) {
      const latestPayment = application.payment_events[0];
      if (latestPayment.amount > 0) {
        return `${latestPayment.currency} ${latestPayment.amount.toFixed(2)}`;
      }
    }
    
    // Fallback to total_amount or product price
    if (application.total_amount && application.total_amount > 0) {
      return `$${application.total_amount.toFixed(2)}`;
    }
    
    if (application.products?.price) {
      return `$${application.products.price.toFixed(2)}`;
    }
    
    return '$2.00'; // Default fallback
  };

  // Helper function to get product title
  const getProductTitle = (): string => {
    return application.products?.title || 'Design Request';
  };

  // Helper function to get product slug
  const getProductSlug = (): string => {
    return application.products?.slug || '';
  };

  return (
    <div className="payment-success-page">
      <div className="container">
        <div className="success-content">
          <div className="success-icon">✅</div>
          <h1>Payment Successful!</h1>
          <p className="success-message">
            Thank you for your order! Your design request has been submitted successfully.
          </p>
          
          <div className="design-code-display">
            <h2>Your Design Code</h2>
            <div className="code-box">
              <strong>{designCode}</strong>
            </div>
            <p className="code-help">Save this code to track your application later</p>
          </div>
          
          <div className="order-details">
            <h3>Order Details</h3>
            <div className="details-grid">
              <div className="detail-item">
                <span>Product:</span>
                <span>{getProductTitle()}</span>
              </div>
              <div className="detail-item">
                <span>Email:</span>
                <span>{application.email || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <span>Amount Paid:</span>
                <span>{getAmountPaid()}</span>
              </div>
              <div className="detail-item">
                <span>Status:</span>
                <span className={`status-${application.status.toLowerCase()}`}>
                  {application.status.replace('_', ' ')}
                </span>
              </div>
            </div>
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
          
          <div className="important-note">
            <p><strong>Important:</strong> Please save your design code ({designCode}) for easy reference and tracking.</p>
          </div>
          
          <div className="actions">
            <a href="/" className="btn btn-primary">
              Return to Home
            </a>
            {getProductSlug() && (
              <a href={`/store/${getProductSlug()}`} className="btn btn-secondary">
                View Product
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
