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
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(supabase, event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(supabase, event.data.object as Stripe.PaymentIntent);
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

async function handlePaymentSuccess(supabase: any, paymentIntent: Stripe.PaymentIntent) {
  const applicationId = paymentIntent.metadata.application_id;
  const designCode = paymentIntent.metadata.design_code;

  if (!applicationId) {
    console.error('No application ID in payment intent metadata');
    return;
  }

  try {
    // Create payment success event instead of updating
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
        payment_method: paymentIntent.payment_method_types?.[0] || 'unknown'
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
    // Create payment failure event instead of updating
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
    // Create payment canceled event instead of updating
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
