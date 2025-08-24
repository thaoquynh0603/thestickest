import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendCustomerConfirmationEmail, sendAdminNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const {
      applicationId,
      email,
      originalAmount = 0,
      discountCode,
      discountAmount = 0,
    } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    const supabase = createClient();

    // Try to read state view first, then fall back to base table
    const { data: requestState } = await supabase
      .from('design_request_states')
      .select('*')
      .eq('request_id', applicationId)
      .maybeSingle();

    let baseRequest: any = null;
    if (!requestState) {
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
        } as any;
      }
    }

    if (!requestState && !baseRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // If discount applied, increment its usage for analytics
    if (discountCode) {
      try {
        await supabase.rpc('increment_discount_code_usage', { p_code: discountCode });
      } catch (e) {
        // Non-blocking
        console.warn('Failed to increment discount usage', e);
      }
    }

    const designCode = (requestState || baseRequest).design_code;

    // Emit domain event: payment succeeded (zero-amount)
    await supabase.rpc('add_design_request_event', {
      p_request_id: applicationId,
      p_event_type: 'PAYMENT_SUCCEEDED',
      p_event_data: {
        stripe_payment_intent_id: null,
        amount: 0,
        original_amount: originalAmount,
        discount_code: discountCode || null,
        discount_amount: discountAmount || 0,
        currency: 'AUD',
        payment_method: 'zero_amount',
        payment_type: 'zero_amount_discount', // Clearly identify zero-amount payments
      },
      p_created_by: email || 'system',
      p_metadata: { design_code: designCode, discount_applied: !!discountCode },
    });

    // Log payment summary for analytics
    await supabase.rpc('log_payment_event', {
      p_application_id: applicationId,
      p_stripe_payment_intent_id: '', // Empty string for zero-amount payments
      p_event_type: 'payment_succeeded',
      p_event_data: {
        amount: 0,
        currency: 'AUD',
        original_amount: originalAmount,
        discount_code: discountCode || null,
        discount_amount: discountAmount || 0,
        zero_amount: true,
      },
      p_amount: 0,
      p_currency: 'AUD',
      p_status: 'SUCCEEDED',
      p_error_message: '',
    });

    // Send confirmation emails for zero-amount payment
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
        .eq('id', applicationId)
        .single();

              // Get questions and application details with proper ID mapping
        let questions: any[] = [];
        let applicationDetails: Record<string, any> = {};
        
        try {
          if (designRequest?.products?.id) {
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
              .eq('request_id', applicationId)
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
        } catch (error) {
          console.error('Error fetching questions or answers:', error);
          // Continue without questions/answers if there's an error
        }

      // Log the final questions array for debugging
      console.log('📧 Final questions array with option_items (zero-amount):', questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        option_items_count: q.option_items?.length || 0,
        option_items: q.option_items
      })));

      // Get application answers
      if (!requestError && designRequest) {
        // Check if email exists, if not, try to get it from application data
        let customerEmail = designRequest.email;
        
        if (!customerEmail) {
          // Try to get email from the most recent answer
          const { data: emailAnswer } = await supabase
            .from('design_request_answers_history')
            .select('answer_text')
            .eq('request_id', applicationId)
            .eq('is_current', true)
            .eq('question_id', '97ecfb67-87e9-4ebd-9ad6-e28f1cf354d4') // Email question ID
            .maybeSingle();
          
          if (emailAnswer?.answer_text) {
            customerEmail = emailAnswer.answer_text;
            console.log(`📧 Found email in answers: ${customerEmail}`);
          } else {
            console.error(`❌ No email found for design request ${applicationId} (${designCode})`);
            console.error('This will prevent confirmation emails from being sent');
            return NextResponse.json({ 
              success: true, 
              designCode,
              warning: 'No email found - confirmation emails cannot be sent'
            });
          }
        }
        
        // Prepare email data
        const emailData = {
          designCode,
          customerEmail,
          customerName: undefined, // Could be added later if you collect names
          productTitle: designRequest.products?.title || 'Custom Sticker Design',
          amount: 0, // Zero amount for discount
          discountCode: discountCode || undefined,
          discountAmount: discountAmount || 0,
          paymentMethod: 'Discount Applied',
          requestId: applicationId,
          questions,
          applicationDetails,
        };

        // Send emails asynchronously
        console.log(`📧 Starting to send confirmation emails for zero-amount payment ${applicationId} (${designCode})`);
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

        console.log(`📧 Confirmation emails queued for zero-amount payment ${applicationId} (${designCode})`);
      }
    } catch (emailError) {
      console.error('Error sending confirmation emails for zero-amount payment:', emailError);
      // Don't fail the payment if email fails
    }

    return NextResponse.json({ success: true, designCode });
  } catch (error) {
    console.error('Error recording zero-amount payment:', error);
    return NextResponse.json({ error: 'Failed to record zero-amount payment' }, { status: 500 });
  }
}


