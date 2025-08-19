import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = createClient();

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.created':
        await handlePaymentIntentCreated(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentCreated(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const applicationId = paymentIntent.metadata.application_id;
  const designCode = paymentIntent.metadata.design_code;
  const discountCode = paymentIntent.metadata.discount_code;
  const discountAmount = paymentIntent.metadata.discount_amount ? parseInt(paymentIntent.metadata.discount_amount) : 0;

  if (!applicationId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  try {
    // Insert payment tracking record when payment intent is created
    const { data: paymentTrackingId, error: trackingError } = await supabase.rpc('insert_payment_tracking', {
      p_request_id: applicationId,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_payment_amount: paymentIntent.amount,
      p_payment_currency: paymentIntent.currency,
      p_stripe_customer_id: paymentIntent.customer as string,
      p_discount_code: discountCode || null,
      p_discount_amount: discountAmount,
      p_created_by: 'stripe_webhook'
    });

    if (trackingError) {
      console.error('Error creating payment tracking record:', trackingError);
    } else {
      console.log(`Payment tracking record created for application ${applicationId} (${designCode})`);
    }

    // Create payment intent created event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_INTENT_CREATED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        discount_code: discountCode,
        discount_amount: discountAmount / 100,
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

  } catch (error) {
    console.error('Error handling payment intent created:', error);
  }
}

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const paymentIntentId = session.payment_intent as string;
  const applicationId = session.metadata?.application_id;
  const designCode = session.metadata?.design_code;

  if (!applicationId) {
    console.error('No application ID in checkout session metadata');
    return;
  }

  try {
    // Update payment tracking status to succeeded
    const { data: updateResult, error: updateError } = await supabase.rpc('update_payment_status', {
      p_stripe_payment_intent_id: paymentIntentId,
      p_payment_status: 'succeeded',
      p_stripe_charge_id: session.payment_intent ? undefined : undefined, // Will be updated when payment intent webhook arrives
      p_stripe_receipt_url: undefined // Receipt URL not available in checkout session
    });

    if (updateError) {
      console.error('Error updating payment tracking status:', updateError);
    }

    // Create payment success event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_SUCCEEDED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntentId,
        amount: session.amount_total! / 100,
        currency: (session.currency || 'AUD').toUpperCase(),
        fee_amount: null, // Checkout sessions don't have application_fee_amount
        payment_method: session.payment_method_types?.[0] || 'unknown',
        payment_type: 'checkout_webhook',
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    // Log successful payment event
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: paymentIntentId,
      p_event_type: 'payment_succeeded',
      p_event_data: session,
      p_amount: session.amount_total! / 100,
      p_currency: (session.currency || 'AUD').toUpperCase(),
      p_status: 'SUCCEEDED',
      p_error_message: '',
    });

    console.log(`Payment succeeded for application ${applicationId} (${designCode}) via checkout session`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const applicationId = paymentIntent.metadata.application_id;
  const designCode = paymentIntent.metadata.design_code;

  if (!applicationId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  try {
    // Update payment tracking status to succeeded
    const { data: updateResult, error: updateError } = await supabase.rpc('update_payment_status', {
      p_stripe_payment_intent_id: paymentIntent.id,
      p_payment_status: 'succeeded',
      p_stripe_charge_id: paymentIntent.latest_charge as string,
      p_stripe_receipt_url: undefined // Will be populated if available
    });

    if (updateError) {
      console.error('Error updating payment tracking status:', updateError);
    }

    // Create payment success event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_SUCCEEDED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        fee_amount: paymentIntent.application_fee_amount 
          ? paymentIntent.application_fee_amount / 100 
          : null,
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown',
        payment_type: paymentIntent.metadata.payment_type || 'stripe_webhook',
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    // Log successful payment event
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_event_type: 'payment_succeeded',
      p_event_data: paymentIntent,
      p_amount: paymentIntent.amount / 100,
      p_currency: paymentIntent.currency.toUpperCase(),
      p_status: 'SUCCEEDED',
      p_error_message: '',
    });

    console.log(`Payment succeeded for application ${applicationId} (${designCode})`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const applicationId = paymentIntent.metadata.application_id;
  const designCode = paymentIntent.metadata.design_code;

  if (!applicationId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  try {
    // Update payment tracking status to failed
    const { data: updateResult, error: updateError } = await supabase.rpc('update_payment_status', {
      p_stripe_payment_intent_id: paymentIntent.id,
      p_payment_status: 'failed',
      p_failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
      p_failure_code: paymentIntent.last_payment_error?.code || 'unknown'
    });

    if (updateError) {
      console.error('Error updating payment tracking status:', updateError);
    }

    // Create payment failure event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_FAILED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        failure_code: paymentIntent.last_payment_error?.code || 'unknown'
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    // Log failed payment event
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_event_type: 'payment_failed',
      p_event_data: paymentIntent,
      p_amount: paymentIntent.amount / 100,
      p_currency: paymentIntent.currency.toUpperCase(),
      p_status: 'FAILED',
      p_error_message: paymentIntent.last_payment_error?.message || 'Payment failed',
    });

    console.log(`Payment failed for application ${applicationId} (${designCode})`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const applicationId = paymentIntent.metadata.application_id;
  const designCode = paymentIntent.metadata.design_code;

  if (!applicationId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  try {
    // Update payment tracking status to canceled
    const { data: updateResult, error: updateError } = await supabase.rpc('update_payment_status', {
      p_stripe_payment_intent_id: paymentIntent.id,
      p_payment_status: 'canceled'
    });

    if (updateError) {
      console.error('Error updating payment tracking status:', updateError);
    }

    // Create payment canceled event
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_CANCELLED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    // Log canceled payment event
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: paymentIntent.id,
      p_event_type: 'payment_canceled',
      p_event_data: paymentIntent,
      p_amount: paymentIntent.amount / 100,
      p_currency: paymentIntent.currency.toUpperCase(),
      p_status: 'CANCELLED',
      p_error_message: '',
    });

    console.log(`Payment canceled for application ${applicationId} (${designCode})`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
