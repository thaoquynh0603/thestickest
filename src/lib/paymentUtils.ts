import { supabase } from './supabase';

export interface PaymentStatus {
  hasPaid: boolean;
  paymentStatus: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  stripePaymentIntentId?: string;
  paymentConfirmedAt?: string;
  discountApplied?: string;
  netAmount?: number;
  message: string;
}

export interface PaymentDetails extends PaymentStatus {
  stripeChargeId?: string;
  stripeReceiptUrl?: string;
  paymentCreatedAt?: string;
  paymentFailedAt?: string;
  discountCode?: string;
  discountAmount?: number;
  processingFee?: number;
  failureReason?: string;
  failureCode?: string;
  designCode?: string;
  email?: string;
  productId?: string;
  requestStatus?: string;
}

/**
 * Check payment status for a design request by ID
 */
export async function checkPaymentStatusByRequestId(requestId: string): Promise<PaymentStatus | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_request_payment_summary', { p_request_id: requestId });

    if (error) {
      console.error('Error checking payment status:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return {
        hasPaid: false,
        paymentStatus: 'no_payment_record',
        message: 'No payment record found for this request'
      };
    }

    const summary = data[0];
    return {
      hasPaid: summary.has_paid,
  paymentStatus: summary.payment_status ?? 'unknown',
  paymentAmount: summary.payment_amount ? summary.payment_amount / 100 : undefined,
  paymentCurrency: summary.payment_currency ?? undefined,
  stripePaymentIntentId: summary.stripe_payment_intent_id ?? undefined,
  paymentConfirmedAt: summary.payment_confirmed_at ?? undefined,
  discountApplied: summary.discount_applied ?? undefined,
  netAmount: summary.net_amount ? summary.net_amount / 100 : undefined,
      message: summary.has_paid ? 'Payment confirmed' : `Payment status: ${summary.payment_status}`
    };
  } catch (error) {
    console.error('Error in checkPaymentStatusByRequestId:', error);
    return null;
  }
}

/**
 * Check payment status for a design request by design code
 */
export async function checkPaymentStatusByDesignCode(designCode: string): Promise<PaymentStatus | null> {
  try {
    // First get the request ID from design code
    const { data: requestData, error: requestError } = await supabase
      .from('design_requests')
      .select('id')
      .eq('design_code', designCode)
      .single();

    if (requestError || !requestData) {
      return null;
    }

    return await checkPaymentStatusByRequestId(requestData.id);
  } catch (error) {
    console.error('Error in checkPaymentStatusByDesignCode:', error);
    return null;
  }
}

/**
 * Get detailed payment information for a design request
 */
export async function getPaymentDetails(requestId: string): Promise<PaymentDetails | null> {
  try {
    const { data, error } = await supabase
      .from('payment_tracking')
      .select(`
        *,
        design_requests!inner(
          design_code,
          email,
          product_id,
          status
        )
      `)
      .eq('request_id', requestId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const payment = data[0];
    const designRequest = payment.design_requests;

    return {
      hasPaid: payment.payment_status === 'succeeded',
      paymentStatus: payment.payment_status ?? 'unknown',
      paymentAmount: payment.payment_amount ? payment.payment_amount / 100 : undefined,
      paymentCurrency: payment.payment_currency ?? undefined,
      stripePaymentIntentId: payment.stripe_payment_intent_id ?? undefined,
      paymentConfirmedAt: payment.payment_confirmed_at ?? undefined,
      discountApplied: payment.discount_code_applied ?? undefined,
      netAmount: payment.net_amount ? payment.net_amount / 100 : undefined,
      stripeChargeId: payment.stripe_charge_id ?? undefined,
      stripeReceiptUrl: payment.stripe_receipt_url ?? undefined,
      paymentCreatedAt: payment.payment_created_at ?? undefined,
      paymentFailedAt: payment.payment_failed_at ?? undefined,
      discountCode: payment.discount_code_applied ?? undefined,
      discountAmount: payment.discount_amount ? payment.discount_amount / 100 : undefined,
      processingFee: payment.processing_fee_amount ? payment.processing_fee_amount / 100 : undefined,
      failureReason: payment.failure_reason ?? undefined,
      failureCode: payment.failure_code ?? undefined,
      designCode: designRequest?.design_code ?? undefined,
      email: designRequest?.email ?? undefined,
      productId: designRequest?.product_id ?? undefined,
      requestStatus: designRequest?.status ?? undefined,
      message: payment.payment_status === 'succeeded' ? 'Payment confirmed' : `Payment status: ${payment.payment_status ?? 'unknown'}`
    };
  } catch (error) {
    console.error('Error in getPaymentDetails:', error);
    return null;
  }
}

/**
 * Check if a design request has been paid for
 */
export async function hasRequestBeenPaid(requestId: string): Promise<boolean> {
  try {
    const paymentStatus = await checkPaymentStatusByRequestId(requestId);
    return paymentStatus?.hasPaid || false;
  } catch (error) {
    console.error('Error checking if request has been paid:', error);
    return false;
  }
}

/**
 * Get all paid requests within a date range
 */
export async function getPaidRequests(
  startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default to 30 days ago
  endDate: Date = new Date()
): Promise<any[]> {
  try {
    const { data, error } = await supabase.rpc('get_paid_requests', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (error) {
      console.error('Error getting paid requests:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPaidRequests:', error);
    return [];
  }
}

/**
 * Format currency amount from cents to dollars
 */
export function formatCurrency(amountInCents: number, currency: string = 'USD'): string {
  const amount = amountInCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Get payment status display text
 */
export function getPaymentStatusDisplay(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Payment Pending',
    'processing': 'Processing Payment',
    'succeeded': 'Payment Confirmed',
    'canceled': 'Payment Canceled',
    'failed': 'Payment Failed',
    'no_payment_record': 'No Payment Record'
  };

  return statusMap[status] || status;
}

/**
 * Get payment status color for UI
 */
export function getPaymentStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'pending': 'text-yellow-600',
    'processing': 'text-blue-600',
    'succeeded': 'text-green-600',
    'canceled': 'text-gray-600',
    'failed': 'text-red-600',
    'no_payment_record': 'text-gray-500'
  };

  return colorMap[status] || 'text-gray-500';
}
