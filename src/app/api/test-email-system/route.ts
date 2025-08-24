import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { designCode } = await request.json();
    
    if (!designCode) {
      return NextResponse.json({ error: 'Design code is required' }, { status: 400 });
    }

    // Get the design request
    const { data: designRequest, error: requestError } = await supabase
      .from('design_requests')
      .select(`
        *,
        products (*)
      `)
      .eq('design_code', designCode)
      .single();

    if (requestError || !designRequest) {
      return NextResponse.json({ error: 'Design request not found' }, { status: 404 });
    }

    let questions: any[] = [];
    let applicationDetails: Record<string, any> = {};

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
        .eq('request_id', designRequest.id)
        .eq('is_current', true);

      if (questionsData && answersData) {
        questions = questionsData;
        
        // Map answers to questions with proper structure
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
                // Get design styles for this product
                const { data: styles } = await supabase
                  .from('design_styles')
                  .select('id, name, description')
                  .eq('product_id', designRequest.products.id)
                  .order('sort_order');
                question.option_items = styles || [];
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
                } else {
                  question.option_items = [];
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

    // Return the data structure for inspection
    return NextResponse.json({
      success: true,
      designCode,
      questions: questions.map(q => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        option_items: q.option_items
      })),
      applicationDetails,
      mappedAnswers: questions.map(q => {
        const answer = applicationDetails[q.id];
        let displayAnswer = '';
        
        if (q.question_type === 'file_upload') {
          if (answer && typeof answer === 'string' && /^https?:\/\//i.test(answer)) {
            displayAnswer = 'Image uploaded';
          } else if (answer && typeof answer === 'object' && answer.answer_file_url) {
            displayAnswer = 'Image uploaded';
          } else {
            displayAnswer = 'No file uploaded';
          }
        } else if (q.question_type === 'multiple_choice' && q.option_items && q.option_items.length > 0) {
          if (typeof answer === 'string') {
            const match = q.option_items.find((item: any) => item.id === answer);
            displayAnswer = match?.name || answer;
          } else {
            displayAnswer = String(answer);
          }
        } else {
          displayAnswer = String(answer);
        }
        
        return {
          question: q.question_text,
          answer: answer,
          displayAnswer: displayAnswer
        };
      })
    });

  } catch (error) {
    console.error('Error in test email system:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
