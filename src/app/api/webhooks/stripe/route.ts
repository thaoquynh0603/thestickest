import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';

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

    // Send confirmation emails
    if (designCode) {
      await sendConfirmationEmails(supabase, requestId, designCode, session.amount_total! / 100, 'stripe_checkout', session.metadata?.discount_code || undefined, session.metadata?.discount_amount || undefined);
    }

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

    // Send confirmation emails
    if (designCode) {
      await sendConfirmationEmails(supabase, requestId, designCode, paymentIntent.amount / 100, paymentIntent.metadata.payment_type || 'stripe_webhook', paymentIntent.metadata.discount_code, paymentIntent.metadata.discount_amount);
    }

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

// Helper function to send confirmation emails
async function sendConfirmationEmails(
  supabase: any, 
  requestId: string, 
  designCode: string, 
  amount: number, 
  paymentMethod: string,
  discountCode?: string,
  discountAmount?: string
) {
  try {
    // Get design request details including product information
    const { data: designRequest, error: requestError } = await supabase
      .from('design_requests')
      .select(`
        *,
        products (
          id,
          title,
          slug
        )
      `)
      .eq('id', requestId)
      .single();

          // Get questions and application details
      let questions: any[] = [];
      let applicationDetails: Record<string, any> = {};
      
      try {
        // Get questions for this product with proper ID mapping
        if (designRequest.products?.id) {
          // Get questions for this product
          const { data: questionsData } = await supabase
            .from('request_questions')
            .select('*')
            .eq('product_id', designRequest.products.id)
            .order('sort_order', { ascending: true });

          // Get answers for this request
          const { data: answersData } = await supabase
            .from('design_request_answers_history')
            .select('*')
            .eq('request_id', requestId)
            .eq('is_current', true);

          if (questionsData && answersData) {
            questions = questionsData;
            
            // Map answers to questions
            answersData.forEach((answer: any) => {
              if (answer.answer_text) {
                applicationDetails[answer.question_id] = answer.answer_text;
              } else if (answer.answer_file_url) {
                applicationDetails[answer.question_id] = {
                  answer_text: null,
                  answer_file_url: answer.answer_file_url,
                  answer_options: null
                };
              } else if (answer.answer_options) {
                applicationDetails[answer.question_id] = answer.answer_options;
              }
            });

            // For each question, fetch the actual option values
            for (const question of questions as any) {
              if (question.option_template_id) {
                // Get options from option_templates
                const { data: optionTemplate } = await supabase
                  .from('option_templates')
                  .select('*')
                  .eq('id', question.option_template_id)
                  .single();

                if (optionTemplate) {
                  if (optionTemplate.source_type === 'design_styles') {
                    // Get design styles - include both product-specific and global styles
                    let stylesQuery = supabase
                      .from('design_styles')
                      .select('id, name, description');
                    
                    // Try to get product-specific styles first, then global styles
                    const { data: productStyles } = await stylesQuery
                      .eq('product_id', designRequest.products.id);
                    
                    const { data: globalStyles } = await supabase
                      .from('design_styles')
                      .select('id, name, description')
                      .is('product_id', null);
                    
                    // Combine both sets of styles
                    const allStyles = [...(productStyles || []), ...(globalStyles || [])];
                    question.option_items = allStyles.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    console.log(`🎨 Design styles for question "${question.question_text}":`, question.option_items);
                  } else if (optionTemplate.source_type === 'question_demo_items') {
                    // Get demo items - need to determine the question slug
                    let questionSlug = '';
                    if (question.question_text?.toLowerCase().includes('shape')) {
                      questionSlug = 'shape';
                    } else if (question.question_text?.toLowerCase().includes('style')) {
                      questionSlug = 'style';
                    } else if (question.question_text?.toLowerCase().includes('product')) {
                      questionSlug = 'product';
                    }
                    
                    if (questionSlug) {
                      const { data: demoItems } = await supabase
                        .from('question_demo_items')
                        .select('id, name, description')
                        .eq('question_slug', questionSlug)
                        .order('sort_order');
                      question.option_items = demoItems || [];
                      console.log(`🔷 Demo items for question "${question.question_text}" (slug: ${questionSlug}):`, question.option_items);
                    } else {
                      question.option_items = [];
                      console.log(`⚠️ No question slug found for question "${question.question_text}"`);
                    }
                  } else if (optionTemplate.source_type === 'products') {
                    // Get all active products
                    const { data: products } = await supabase
                      .from('products')
                      .select('id, title, name')
                      .eq('is_active', true)
                      .order('display_order');
                    
                    question.option_items = products?.map((p: any) => ({
                      id: p.id,
                      name: p.name || p.title
                    })) || [];
                    console.log(`📦 Products for question "${question.question_text}":`, question.option_items);
                  }
                }
              } else if (question.custom_template_id) {
                // For custom templates, get the actual custom questions
                const { data: customQuestions } = await supabase
                  .from('custom_questions')
                  .select('id, question_text')
                  .eq('custom_template_id', question.custom_template_id)
                  .order('sort_order');
                
                question.option_items = customQuestions?.map((cq: any) => ({
                  id: String(cq.id),
                  name: cq.question_text
                })) || [];
              } else {
                question.option_items = [];
              }
            }
          }
        }

      // Log the final questions array for debugging
      console.log('📧 Final questions array with option_items:', questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        option_items_count: q.option_items?.length || 0,
        option_items: q.option_items
      })));

      // Get application answers
        const { data: answersData } = await supabase
          .from('design_request_answers_history')
          .select(`
            question_id,
            answer_text,
            answer_options
          `)
          .eq('request_id', requestId);

        if (answersData) {
          answersData.forEach((answer: any) => {
            if (answer.answer_text) {
              applicationDetails[answer.question_id] = answer.answer_text;
            } else if (answer.answer_options) {
              applicationDetails[answer.question_id] = answer.answer_options;
            }
          });
        }
      } catch (error) {
        console.error('Error fetching questions or answers:', error);
        // Continue without questions/answers if there's an error
      }

    if (requestError || !designRequest) {
      console.error('Error fetching design request for email:', requestError);
      return;
    }

    // Get customer email from the request
    let customerEmail = designRequest.email;
    if (!customerEmail) {
      // Try to get email from the most recent answer
      const { data: emailAnswer } = await supabase
        .from('design_request_answers_history')
        .select('answer_text')
        .eq('request_id', requestId)
        .eq('is_current', true)
        .eq('question_id', '97ecfb67-87e9-4ebd-9ad6-e28f1cf354d4') // Email question ID
        .maybeSingle();
      
      if (emailAnswer?.answer_text) {
        customerEmail = emailAnswer.answer_text;
        console.log(`📧 Found email in answers: ${customerEmail}`);
      } else {
        console.error(`❌ No email found for design request ${requestId} (${designCode})`);
        console.error('This will prevent confirmation emails from being sent');
        return; // Skip email sending but don't fail the webhook
      }
    }

    // Calculate discount amount if provided
    const discountAmountNum = discountAmount ? parseInt(discountAmount) / 100 : 0;
    const finalAmount = amount - discountAmountNum;

    // Prepare email data
    const emailData = {
      designCode,
      customerEmail,
      customerName: undefined, // Could be added later if you collect names
      productTitle: designRequest.products?.title || 'Custom Sticker Design',
      amount: finalAmount,
      discountCode: discountCode || undefined,
      discountAmount: discountAmountNum || undefined,
      paymentMethod: paymentMethod === 'stripe_checkout' ? 'Credit Card' : paymentMethod,
      requestId,
      questions,
      applicationDetails,
    };

    // Send emails asynchronously (don't block the webhook response)
    console.log(`📧 Starting to send confirmation emails for request ${requestId} (${designCode})`);
    console.log(`📧 Customer email will be sent to: ${customerEmail}`);
    console.log(`📧 Admin email will be sent to: quynh.datame@gmail.com`);
    
    Promise.all([
      sendCustomerConfirmationEmail(emailData),
      sendAdminNotificationEmail(emailData)
    ]).then(([customerResult, adminResult]) => {
      console.log(`📧 Email sending results for ${designCode}:`);
      console.log(`  ✅ Customer email: ${customerResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`  ✅ Admin email: ${adminResult.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (!customerResult.success) {
        console.error('❌ Failed to send customer confirmation email:', customerResult.error);
      }
      if (!adminResult.success) {
        console.error('❌ Failed to send admin notification email:', adminResult.error);
      }
      
      if (customerResult.success && adminResult.success) {
        console.log(`🎉 Both emails sent successfully for ${designCode}!`);
      } else {
        console.error(`⚠️ Some emails failed for ${designCode}. Check logs above.`);
      }
    }).catch(error => {
      console.error('❌ Error sending confirmation emails:', error);
    });

    console.log(`📧 Confirmation emails queued for request ${requestId} (${designCode})`);
  } catch (error) {
    console.error('Error in sendConfirmationEmails:', error);
  }
}
