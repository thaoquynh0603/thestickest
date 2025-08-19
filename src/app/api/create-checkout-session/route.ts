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
      originalAmount,
      discountCode,
      returnUrl,
    } = await request.json();

    if (!applicationId || !returnUrl) {
      return NextResponse.json({ error: 'applicationId and returnUrl are required' }, { status: 400 });
    }

    const supabase = createClient();

    // Prefer state view; fallback to base request
    const { data: requestData } = await supabase
      .from('design_request_states')
      .select('*')
      .eq('request_id', applicationId)
      .maybeSingle();

    let baseRequest: any = null;
    if (!requestData) {
      const { data: designReq } = await supabase
        .from('design_requests')
        .select('id, design_code, product_id, email')
        .eq('id', applicationId)
        .single();
      if (designReq) {
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

    const baseAmount = (requestData?.total_amount ?? originalAmount ?? 0) as number;

    // Validate discount server-side
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
      }
    }

    const finalAmountDollars = validatedFinalAmount;
    const amountCents = Math.round(finalAmountDollars * 100);

    if (amountCents <= 0) {
      return NextResponse.json({ error: 'Amount is zero; skip Stripe', zeroAmount: true }, { status: 400 });
    }

    const designCode = (requestData || baseRequest).design_code;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: (email && /.+@.+\..+/.test(email)) ? email : undefined,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            unit_amount: amountCents,
            product_data: {
              name: `Design request - ${designCode}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}/payment-success?code=${designCode}`,
      cancel_url: `${returnUrl}/store`,
      metadata: {
        request_id: applicationId,
        application_id: applicationId,
        design_code: designCode,
        product_id: (requestData || baseRequest).product_id || '',
        original_amount: (baseAmount * 100).toString(),
        discount_code: discountCode || '',
        discount_amount: validatedDiscountAmount ? (validatedDiscountAmount * 100).toString() : '',
        final_amount: finalAmountDollars.toString(),
        payment_type: 'stripe_checkout', // Distinguish from zero-amount payments
      },
      // Add this to ensure metadata transfers to payment intent
      payment_intent_data: {
        metadata: {
          request_id: applicationId,
          application_id: applicationId,
          design_code: designCode,
          product_id: (requestData || baseRequest).product_id || '',
          original_amount: (baseAmount * 100).toString(),
          discount_code: discountCode || '',
          discount_amount: validatedDiscountAmount ? (validatedDiscountAmount * 100).toString() : '',
          final_amount: finalAmountDollars.toString(),
          payment_type: 'stripe_checkout', // Distinguish from zero-amount payments
        },
      },
    });

    // Record event directly instead of using the problematic function
    const { error: eventError } = await supabase
      .from('design_request_events')
      .insert({
        request_id: applicationId,
        event_type: 'PAYMENT_INTENT_CREATED',
        event_data: {
          stripe_payment_intent_id: session.id,
          amount: finalAmountDollars,
          original_amount: baseAmount,
          discount_code: discountCode,
          discount_amount: validatedDiscountAmount,
          payment_attempts: 1,
        },
        created_by: email || 'system',
        metadata: {
          design_code: designCode,
          discount_applied: !!discountCode,
        },
      });

    if (eventError) {
      console.error('Error recording checkout session event:', eventError);
      // Don't fail the checkout session creation, just log the error
    }

    // Update the design request state to show payment is processing
    const { error: stateError } = await supabase
      .from('design_request_states')
      .upsert({
        request_id: applicationId,
        design_code: designCode,
        product_id: (requestData || baseRequest).product_id,
        current_status: 'SUBMITTED',
        current_payment_status: 'PROCESSING',
        stripe_payment_intent_id: session.id,
        payment_attempts: 1,
        last_payment_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'request_id'
      });

    if (stateError) {
      console.error('Error updating design request state:', stateError);
      // Don't fail the checkout session creation, just log the error
    }

    return NextResponse.json({ sessionId: session.id, designCode });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}


