import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  console.log('🔍 GET request received at:', new Date().toISOString());
  return NextResponse.json(
    { 
      success: true,
      message: 'AI Inspiration API is accessible',
      timestamp: new Date().toISOString(),
      supports: ['POST'],
      note: 'Use POST with questionId and requestId in the request body.'
    }
  );
}

export async function POST(request: NextRequest) {
  console.log('🔍 AI Inspiration API called at:', new Date().toISOString());
  console.log('🔍 Request URL:', request.url);
  console.log('🔍 Request method:', request.method);
  console.log('🔍 Request headers available:', request.headers.has('content-type'), request.headers.has('user-agent'));
  
  try {
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const { questionId, requestId } = body;

    if (!questionId || !requestId) {
      console.log('❌ Missing required fields - questionId:', questionId, 'requestId:', requestId);
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Processing request for questionId:', questionId, 'requestId:', requestId);

    // Get the question details to check if AI generation is supported
    console.log('🔍 Fetching question details for ID:', questionId);
    const { data: question, error: questionError } = await supabase
      .from('request_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError) {
      console.log('❌ Error fetching question:', questionError);
      return NextResponse.json(
        { success: false, error: 'Question not found', details: questionError.message },
        { status: 404 }
      );
    }
    
    if (!question) {
      console.log('❌ Question not found for ID:', questionId);
      return NextResponse.json(
        { success: false, error: 'Question not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Question found:', {
      id: question.id,
      question_text: question.question_text,
      is_ai_generated: question.is_ai_generated,
      has_prompt: !!question.ai_generated_prompt
    });

    if (!question.is_ai_generated || !question.ai_generated_prompt) {
      console.log('❌ AI generation not supported:', {
        is_ai_generated: question.is_ai_generated,
        has_prompt: !!question.ai_generated_prompt,
        prompt_length: question.ai_generated_prompt?.length || 0
      });
      return NextResponse.json(
        { success: false, error: 'AI generation not supported for this question' },
        { status: 400 }
      );
    }
    
    console.log('✅ AI generation is supported for this question');

    // Get the design request to check product slug
    console.log('🔍 Fetching design request for ID:', requestId);
    const { data: designRequest, error: designError } = await supabase
      .from('design_requests')
      .select('product_id')
      .eq('id', requestId)
      .single();

    if (designError) {
      console.log('❌ Error fetching design request:', designError);
      return NextResponse.json(
        { success: false, error: 'Design request not found', details: designError.message },
        { status: 404 }
      );
    }
    
    if (!designRequest) {
      console.log('❌ Design request not found for ID:', requestId);
      return NextResponse.json(
        { success: false, error: 'Design request not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Design request found:', {
      product_id: designRequest.product_id
    });

    // Get product details
    console.log('🔍 Fetching product details for ID:', designRequest.product_id);
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('slug, title, subtitle, description')
      .eq('id', designRequest.product_id)
      .single();

    if (productError) {
      console.log('❌ Error fetching product:', productError);
      return NextResponse.json(
        { success: false, error: 'Product not found', details: productError.message },
        { status: 404 }
      );
    }
    
    if (!product) {
      console.log('❌ Product not found for ID:', designRequest.product_id);
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ Product found:', {
      slug: product.slug,
      title: product.title,
      subtitle: product.subtitle
    });

    // Get previous answers for this request to replace placeholders
    const { data: previousAnswers, error: answersError } = await supabase
      .from('design_request_answers_history')
      .select('question_id, answer_text, answer_options')
      .eq('request_id', requestId)
      .eq('is_current', true);

    if (answersError) {
      console.error('Error fetching previous answers:', answersError);
    }

    // Build the prompt with replacements
    let finalPrompt = question.ai_generated_prompt;

    // Replace product placeholders if slug is general_default_hidden
    if (product.slug === 'general_default_hidden') {
      finalPrompt = finalPrompt
        .replace(/##product_title##/g, product.title || '')
        .replace(/##product_subtitle##/g, product.subtitle || '')
        .replace(/##description##/g, product.description || '');
    }

    // Replace answer placeholders
    if (question.ai_prompt_placeholder && previousAnswers) {
      try {
        console.log('🔍 Processing AI prompt placeholders:', question.ai_prompt_placeholder);
        
        // Ensure placeholders is an array and handle different formats
        let placeholders = question.ai_prompt_placeholder;
        
        // If it's a string, try to parse it as JSON
        if (typeof placeholders === 'string') {
          try {
            placeholders = JSON.parse(placeholders);
          } catch (parseError) {
            console.error('Failed to parse ai_prompt_placeholder as JSON:', parseError);
            placeholders = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(placeholders)) {
          console.warn('ai_prompt_placeholder is not an array, converting to array:', placeholders);
          placeholders = [placeholders];
        }
        
        console.log('🔍 Processed placeholders array:', placeholders);
        
        for (const placeholder of placeholders) {
          if (placeholder && typeof placeholder === 'object') {
            for (const [key, config] of Object.entries(placeholder)) {
              if (config && typeof config === 'object' && 'question_id' in config && 'question_text' in config) {
                const configObj = config as { question_id: string[], question_text: string[] };
                
                console.log('🔍 Processing placeholder key:', key, 'with config:', configObj);
                
                // Find matching questions by question_text
                const matchingAnswers = previousAnswers.filter(answer => {
                  const questionText = configObj.question_text;
                  return questionText.some(text => 
                    answer.answer_text && answer.answer_text.includes(text)
                  );
                });

                if (matchingAnswers.length > 0) {
                  const answerText = matchingAnswers[0].answer_text || '';
                  console.log('✅ Replacing placeholder', key, 'with:', answerText);
                  finalPrompt = finalPrompt.replace(new RegExp(`##${key}##`, 'g'), answerText);
                } else {
                  console.log('⚠️ No matching answers found for placeholder:', key);
                }
              }
            }
          }
        }
      } catch (placeholderError) {
        console.error('Error processing placeholders:', placeholderError);
        // Continue without placeholder replacement
      }
    }

    // Call Gemini API
    console.log('🔍 Checking Gemini API key...');
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.log('❌ Gemini API key not configured');
      return NextResponse.json(
        { success: false, error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }
    
    console.log('✅ Gemini API key found, length:', geminiApiKey.length);
    console.log('🔍 Final prompt to send to Gemini:', finalPrompt);

    console.log('🚀 Calling Gemini API with prompt length:', finalPrompt.length);
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: finalPrompt
                }
              ]
            }
          ]
        })
      }
    );

    console.log('🔍 Gemini API response status:', geminiResponse.status, geminiResponse.statusText);

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error('❌ Gemini API error response:', {
        status: geminiResponse.status,
        statusText: geminiResponse.statusText,
        errorData: errorData
      });
      
      // Try to parse error details
      let errorMessage = 'Failed to generate AI content';
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // Use raw error data if JSON parsing fails
        errorMessage = errorData.substring(0, 200) + (errorData.length > 200 ? '...' : '');
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: geminiResponse.status }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // Parse the response based on the structured output schema
    let parsedResponse;
    try {
      console.log('🔍 Raw Gemini response:', geminiData);
      
      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log('🔍 Gemini content text:', content);
      
      if (question.ai_structured_output && content) {
        console.log('🔍 Processing structured output with schema:', question.ai_structured_output);
        
        // Try multiple parsing strategies
        let jsonStr = content;
        
        // Strategy 1: Look for JSON wrapped in markdown code blocks
        const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
          console.log('✅ Found JSON in markdown block');
        } else {
          // Strategy 2: Look for JSON at the start or end
          const startBrace = content.indexOf('{');
          const endBrace = content.lastIndexOf('}');
          if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
            jsonStr = content.substring(startBrace, endBrace + 1);
            console.log('✅ Found JSON between braces');
          }
        }
        
        try {
          parsedResponse = JSON.parse(jsonStr);
          console.log('✅ Successfully parsed structured response:', parsedResponse);
        } catch (jsonError) {
          console.error('Failed to parse JSON, trying to extract text only:', jsonError);
          // Fallback: extract just the text content
          parsedResponse = {
            text: content.replace(/```json\s*|\s*```/g, '').trim(),
            placeholders: []
          };
        }
      } else {
        // Fallback to simple text response
        parsedResponse = {
          text: content || 'No content generated',
          placeholders: []
        };
        console.log('✅ Using fallback text response');
      }
      
      // Ensure the response has the expected structure
      if (!parsedResponse.text) {
        parsedResponse.text = content || 'No content generated';
      }
      if (!parsedResponse.placeholders) {
        parsedResponse.placeholders = [];
      }
      
      console.log('🔍 Final parsed response:', parsedResponse);
      
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      // Fallback response
      const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      parsedResponse = {
        text: content || 'No content generated',
        placeholders: []
      };
      console.log('✅ Using error fallback response');
    }

    // Log the Gemini run
    const { data: geminiRun, error: logError } = await supabase
      .from('gemini_runs')
      .insert({
        request_id: requestId,
        question_id: questionId,
        prompt: finalPrompt,
        response: parsedResponse,
        metadata: {
          product_slug: product.slug,
          question_text: question.question_text,
          original_prompt: question.ai_generated_prompt,
          structured_output_schema: question.ai_structured_output
        }
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging Gemini run:', logError);
      // Don't fail the request if logging fails
    }

    console.log('✅ AI inspiration generated successfully:', {
      response: parsedResponse,
      geminiRunId: geminiRun?.id
    });
    
    return NextResponse.json({
      success: true,
      response: parsedResponse,
      geminiRunId: geminiRun?.id
    });

  } catch (error) {
    console.error('❌ AI inspiration error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
