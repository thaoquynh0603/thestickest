import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { 
      applicationId, 
      email, 
      amount: _clientAmount, // ignored; server will compute final amount
      discountCode, 
      discountAmount: _clientDiscountAmount = 0, // ignored; server validates
      originalAmount 
    } = await request.json();
    
    const supabase = createClient();

    // Get the request details from current state (preferred)
    const { data: requestData, error: appError } = await supabase
      .from('design_request_states')
      .select('*')
      .eq('request_id', applicationId)
      .maybeSingle();

    // Fallback to the base request if the state view hasn't materialized yet
    let baseRequest: any = null;
    if (!requestData) {
      const { data: designReq, error: designReqErr } = await supabase
        .from('design_requests')
        .select('id, design_code, product_id, email')
        .eq('id', applicationId)
        .single();
      if (!designReqErr && designReq) {
        baseRequest = {
          request_id: designReq.id,
          design_code: designReq.design_code,
          product_id: designReq.product_id,
          email: designReq.email,
          payment_attempts: 0,
        } as any;
      }
    }

    if (!requestData && !baseRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // If discount code is provided, increment its usage
    if (discountCode) {
      await supabase.rpc('increment_discount_code_usage', {
        p_code: discountCode
      });
    }

    // Determine base amount from state or request body
    const baseAmount = (requestData?.total_amount ?? originalAmount ?? 0) as number;

    // Validate discount server-side to avoid trusting client
    let validatedDiscountAmount = 0;
    let validatedFinalAmount = baseAmount;
    if (discountCode) {
      const { data: validationData, error: validationErr } = await supabase.rpc('validate_discount_code', {
        p_code: discountCode,
        p_email: email || null,
        p_order_amount: baseAmount,
      });
      if (!validationErr && Array.isArray(validationData) && validationData[0]?.is_valid) {
        validatedDiscountAmount = validationData[0].discount_amount || 0;
        validatedFinalAmount = Math.max(0, baseAmount - validatedDiscountAmount);
      } else {
        validatedDiscountAmount = 0;
        validatedFinalAmount = baseAmount;
      }
    }

    const finalAmountDollars = validatedFinalAmount;
    const amountCents = Math.round(finalAmountDollars * 100);
    
    if (amountCents <= 0) {
      return NextResponse.json({ error: 'Amount is zero; skip Stripe', zeroAmount: true }, { status: 400 });
    }

    // Create payment intent with discount information
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents, // cents, computed on server
      currency: 'aud',
      metadata: {
        request_id: applicationId,
        application_id: applicationId, // keep both keys for webhook compatibility
        design_code: (requestData || baseRequest).design_code,
        email: email,
        product_id: (requestData || baseRequest).product_id || '',
        original_amount: (baseAmount * 100).toString(),
        discount_code: discountCode || '',
        discount_amount: validatedDiscountAmount ? (validatedDiscountAmount * 100).toString() : '',
        final_amount: finalAmountDollars.toString(),
      },
      description: `Design request - ${(requestData || baseRequest).design_code}${discountCode ? ` (Discount: ${discountCode})` : ''}`,
      // Only include receipt_email if a non-empty, likely valid email is provided
      receipt_email: (email && /.+@.+\..+/.test(email)) ? email : undefined,
    });

    // Create payment intent event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_INTENT_CREATED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id,
        payment_attempts: ((requestData?.payment_attempts || baseRequest?.payment_attempts || 0) + 1),
        amount: finalAmountDollars,
        original_amount: baseAmount,
        discount_code: discountCode,
        discount_amount: validatedDiscountAmount,
        final_amount: finalAmountDollars,
      },
      p_created_by: email || null,
      p_metadata: { 
        design_code: (requestData || baseRequest).design_code,
        discount_applied: !!discountCode
      }
    });

    // Log payment event
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_event_type: 'payment_intent_created',
      p_event_data: { 
        amount: amountCents, 
        currency: 'aud',
        original_amount: baseAmount,
        discount_code: discountCode,
        discount_amount: validatedDiscountAmount
      },
      p_amount: finalAmountDollars,
      p_currency: 'AUD',
      p_status: 'PROCESSING',
      p_error_message: '',
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      designCode: (requestData || baseRequest).design_code,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
