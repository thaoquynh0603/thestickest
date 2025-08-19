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
  const requestId = paymentIntent.metadata.request_id || paymentIntent.metadata.application_id; // Support both field names
  const designCode = paymentIntent.metadata.design_code;
  const discountCode = paymentIntent.metadata.discount_code;
  const discountAmount = paymentIntent.metadata.discount_amount ? parseInt(paymentIntent.metadata.discount_amount) : 0;

  if (!requestId) {
    console.error('No request ID in payment intent metadata');
    return;
  }

  if (!designCode) {
    console.error('No design code in payment intent metadata');
    return;
  }

  try {
    // Create payment intent created event
    await supabase.rpc('add_design_request_event', {
      p_request_id: requestId,
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

    console.log(`Payment intent created event recorded for request ${requestId} (${designCode})`);

  } catch (error) {
    console.error('Error handling payment intent created:', error);
  }
}

async function handleCheckoutSessionCompleted(supabase: any, session: Stripe.Checkout.Session) {
  const paymentIntentId = session.payment_intent as string;
  const requestId = session.metadata?.request_id || session.metadata?.application_id; // Support both field names
  const designCode = session.metadata?.design_code;

  if (!requestId) {
    console.error('No request ID in checkout session metadata');
    return;
  }

  try {


    // Create payment success event
    await supabase.rpc('add_design_request_event', {
      p_request_id: requestId,
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



    console.log(`Payment succeeded for application ${requestId} (${designCode}) via checkout session`);
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const requestId = paymentIntent.metadata.request_id || paymentIntent.metadata.application_id; // Support both field names
  const designCode = paymentIntent.metadata.design_code;

  if (!requestId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  // Skip if this payment intent was created via checkout session to avoid duplicates
  // Checkout session webhook will handle the payment success event
  if (paymentIntent.metadata.payment_type === 'stripe_checkout') {
    console.log(`Skipping payment_intent.succeeded for checkout session payment ${requestId} (${designCode})`);
    return;
  }

  try {
    // Create payment success event only for direct payment intents
    await supabase.rpc('add_design_request_event', {
      p_request_id: requestId,
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

    console.log(`Payment succeeded for application ${requestId} (${designCode}) via direct payment intent`);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const requestId = paymentIntent.metadata.request_id || paymentIntent.metadata.application_id; // Support both field names
  const designCode = paymentIntent.metadata.design_code;

  if (!requestId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  // Skip if this payment intent was created via checkout session to avoid duplicates
  if (paymentIntent.metadata.payment_type === 'stripe_checkout') {
    console.log(`Skipping payment_intent.payment_failed for checkout session payment ${requestId} (${designCode})`);
    return;
  }

  try {
    // Create payment failure event only for direct payment intents
    await supabase.rpc('add_design_request_event', {
      p_request_id: requestId,
      p_event_type: 'PAYMENT_FAILED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id,
        failure_reason: paymentIntent.last_payment_error?.message || 'Payment failed',
        failure_code: paymentIntent.last_payment_error?.code || 'unknown'
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    console.log(`Payment failed for application ${requestId} (${designCode}) via direct payment intent`);
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCanceled(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const requestId = paymentIntent.metadata.request_id || paymentIntent.metadata.application_id; // Support both field names
  const designCode = paymentIntent.metadata.design_code;

  if (!requestId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  // Skip if this payment intent was created via checkout session to avoid duplicates
  if (paymentIntent.metadata.payment_type === 'stripe_checkout') {
    console.log(`Skipping payment_intent.canceled for checkout session payment ${requestId} (${designCode})`);
    return;
  }

  try {
    // Create payment canceled event only for direct payment intents
    await supabase.rpc('add_design_request_event', {
      p_request_id: requestId,
      p_event_type: 'PAYMENT_CANCELLED',
      p_event_data: {
        stripe_payment_intent_id: paymentIntent.id
      },
      p_created_by: 'stripe_webhook',
      p_metadata: { design_code: designCode }
    });

    console.log(`Payment canceled for application ${requestId} (${designCode}) via direct payment intent`);
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}
