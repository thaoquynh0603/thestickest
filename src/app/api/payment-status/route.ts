import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const designCode = searchParams.get('designCode');

    if (!requestId && !designCode) {
      return NextResponse.json(
        { error: 'Either requestId or designCode is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let requestIdToUse: string;

    if (requestId) {
      requestIdToUse = requestId;
    } else if (designCode) {
      // First get the request ID from design code
      const { data: requestData, error: requestError } = await supabase
        .from('design_requests')
        .select('id')
        .eq('design_code', designCode)
        .single();

      if (requestError || !requestData) {
        return NextResponse.json(
          { error: 'Design request not found' },
          { status: 404 }
        );
      }

      requestIdToUse = requestData.id;
    } else {
      return NextResponse.json(
        { error: 'Either requestId or designCode is required' },
        { status: 400 }
      );
    }

    // Use direct table query instead of RPC function for better reliability
    const { data: paymentSummary, error } = await supabase
      .from('payment_tracking')
      .select(`
        request_id,
        payment_amount,
        payment_currency,
        payment_status,
        stripe_payment_intent_id,
        payment_confirmed_at,
        discount_code_applied,
        net_amount
      `)
      .eq('request_id', requestIdToUse)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Direct query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment information' },
        { status: 500 }
      );
    }

    // Handle empty results (no payment record)
    if (!paymentSummary || paymentSummary.length === 0) {
      return NextResponse.json({
        hasPaid: false,
        paymentStatus: 'no_payment_record',
        message: 'No payment record found for this request',
        requestId: requestIdToUse,
        designCode: designCode || null
      });
    }

    const summary = paymentSummary[0];
    
    return NextResponse.json({
      hasPaid: summary.payment_status === 'succeeded',
      paymentStatus: summary.payment_status,
      paymentAmount: summary.payment_amount ? summary.payment_amount / 100 : 0,
      paymentCurrency: summary.payment_currency,
      stripePaymentIntentId: summary.stripe_payment_intent_id,
      paymentConfirmedAt: summary.payment_confirmed_at,
      discountApplied: summary.discount_code_applied,
      netAmount: summary.net_amount ? summary.net_amount / 100 : 0,
      message: summary.payment_status === 'succeeded' ? 'Payment confirmed' : `Payment status: ${summary.payment_status}`,
      requestId: requestIdToUse,
      designCode: designCode || null
    });

  } catch (error) {
    console.error('Error in payment status check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, designCode } = body;

    if (!requestId && !designCode) {
      return NextResponse.json(
        { error: 'Either requestId or designCode is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    let requestIdToUse = requestId;

    if (!requestIdToUse && designCode) {
      // Get request ID from design code
      const { data: requestData, error: requestError } = await supabase
        .from('design_requests')
        .select('id')
        .eq('design_code', designCode)
        .single();

      if (requestError || !requestData) {
        return NextResponse.json(
          { error: 'Design request not found' },
          { status: 404 }
        );
      }

      requestIdToUse = requestData.id;
    }

    // Get detailed payment information
    const { data: paymentDetails, error } = await supabase
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
      .eq('request_id', requestIdToUse)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment details' },
        { status: 500 }
      );
    }

    if (!paymentDetails || paymentDetails.length === 0) {
      return NextResponse.json({
        hasPaid: false,
        paymentStatus: 'no_payment_record',
        message: 'No payment record found for this request',
        requestId: requestIdToUse
      });
    }

    const latestPayment = paymentDetails[0];
    const designRequest = latestPayment.design_requests;
    
    return NextResponse.json({
      hasPaid: latestPayment.payment_status === 'succeeded',
      paymentStatus: latestPayment.payment_status,
      paymentAmount: latestPayment.payment_amount / 100,
      paymentCurrency: latestPayment.payment_currency,
      stripePaymentIntentId: latestPayment.stripe_payment_intent_id,
      stripeChargeId: latestPayment.stripe_charge_id,
      stripeReceiptUrl: latestPayment.stripe_receipt_url,
      paymentCreatedAt: latestPayment.payment_created_at,
      paymentConfirmedAt: latestPayment.payment_confirmed_at,
      paymentFailedAt: latestPayment.payment_failed_at,
      discountCode: latestPayment.discount_code_applied,
      discountAmount: latestPayment.discount_amount / 100,
      netAmount: latestPayment.net_amount / 100,
      processingFee: latestPayment.processing_fee_amount / 100,
      failureReason: latestPayment.failure_reason,
      failureCode: latestPayment.failure_code,
      designCode: designRequest.design_code,
      email: designRequest.email,
      productId: designRequest.product_id,
      requestStatus: designRequest.status,
      message: latestPayment.payment_status === 'succeeded' ? 'Payment confirmed' : `Payment status: ${latestPayment.payment_status}`
    });

  } catch (error) {
    console.error('Error in payment status check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
