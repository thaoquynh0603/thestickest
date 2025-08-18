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

    // Log if this is a general_default_hidden product that needs special handling
    if (product.slug === 'general_default_hidden') {
      console.log('🔍 This is a general_default_hidden product - will look for user product choice context');
    }

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
    let userSelectedProduct = null;
    
    if (product.slug === 'general_default_hidden') {
      // For general_default_hidden products, we need to find the user's actual product choice
      // from the "What product are you interested in?" question
      
      if (previousAnswers && previousAnswers.length > 0) {
        // Look for the answer to the "What product are you interested in?" question
        // This question has ID: 200ad2dc-bf2d-45c6-8aa7-1e0339a7f589
        const productChoiceAnswer = previousAnswers.find(answer => 
          answer.question_id === '200ad2dc-bf2d-45c6-8aa7-1e0339a7f589'
        );
        
        if (productChoiceAnswer && productChoiceAnswer.answer_text) {
          console.log('✅ Found user product choice:', productChoiceAnswer.answer_text);
          
          // The answer_text contains the product ID, so look it up directly
          const { data: selectedProduct, error: selectedProductError } = await supabase
            .from('products')
            .select('id, slug, title, subtitle, description')
            .eq('id', productChoiceAnswer.answer_text)
            .eq('is_active', true)
            .neq('slug', 'general_default_hidden')
            .single();
          
          if (selectedProduct && !selectedProductError) {
            userSelectedProduct = selectedProduct;
            console.log('✅ Found matching product:', {
              id: selectedProduct.id,
              slug: selectedProduct.slug,
              title: selectedProduct.title,
              subtitle: selectedProduct.subtitle
            });
          } else {
            console.log('⚠️ Could not find matching product for user choice:', productChoiceAnswer.answer_text);
            if (selectedProductError) {
              console.log('Error details:', selectedProductError);
            }
          }
        }
      }
      
      // Replace placeholders with the user's selected product information
      if (userSelectedProduct) {
        finalPrompt = finalPrompt
          .replace(/##product_title##/g, userSelectedProduct.title || '')
          .replace(/##product_subtitle##/g, userSelectedProduct.subtitle || '')
          .replace(/##description##/g, userSelectedProduct.description || '');
        
        console.log('✅ Replaced product placeholders with user selection:');
        console.log('  - ##product_title## →', userSelectedProduct.title);
        console.log('  - ##product_subtitle## →', userSelectedProduct.subtitle);
        console.log('  - ##description## →', userSelectedProduct.description);
      } else {
        // Fallback: replace with empty strings if no product found
        finalPrompt = finalPrompt
          .replace(/##product_title##/g, '')
          .replace(/##product_subtitle##/g, '')
          .replace(/##description##/g, '');
        
        console.log('⚠️ No user product selection found, replaced placeholders with empty strings');
      }
      
      // For general_default_hidden products, also look for the user's product choice
      // from the "What product are you interested in?" question
      if (previousAnswers && previousAnswers.length > 0) {
        // First, try to find a more specific product choice question
        let productChoiceQuestion = previousAnswers.find(answer => {
          // Look for answers that might be from the "What product are you interested in?" question
          // Check if the question text contains product-related keywords
          return answer.answer_text && (
            answer.answer_text.toLowerCase().includes('product') ||
            answer.answer_text.toLowerCase().includes('interested') ||
            answer.answer_text.toLowerCase().includes('design') ||
            answer.answer_text.toLowerCase().includes('sticker') ||
            answer.answer_text.toLowerCase().includes('custom')
          );
        });
        
        if (productChoiceQuestion) {
          console.log('✅ Found product choice answer:', productChoiceQuestion.answer_text);
          // Add the user's product choice to the prompt context
          finalPrompt = finalPrompt
            .replace(/##user_product_choice##/g, productChoiceQuestion.answer_text)
            .replace(/##product_context##/g, `The user is interested in: ${productChoiceQuestion.answer_text}`)
            .replace(/##design_context##/g, `Design context: The user wants to create ${productChoiceQuestion.answer_text}`);
          
          console.log('🔍 Added product context to prompt. Available placeholders:');
          console.log('  - ##user_product_choice## →', productChoiceQuestion.answer_text);
          console.log('  - ##product_context## → The user is interested in:', productChoiceQuestion.answer_text);
          console.log('  - ##design_context## → Design context: The user wants to create', productChoiceQuestion.answer_text);
        } else {
          console.log('⚠️ No specific product choice found in previous answers');
        }
      }
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
    
    // Record start time for latency calculation
    const apiCallStartTime = Date.now();

    // Prepare the request payload for Gemini API
    const geminiRequestPayload = {
      contents: [
        {
          parts: [
            {
              text: finalPrompt
            }
          ]
        }
      ]
    };
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiRequestPayload)
      }
    );

    console.log('🔍 Gemini API response status:', geminiResponse.status, geminiResponse.statusText);
    const apiCallEndTime = Date.now();
    const apiLatencyMs = apiCallEndTime - apiCallStartTime;
    console.log('⏱️ Gemini API latency (ms):', apiLatencyMs);

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
    
    // Build raw input/output logs for storage without parsing
    const inputLog = {
      model: 'gemini-2.0-flash',
      api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      request_payload: geminiRequestPayload,
      prompt_length: finalPrompt.length,
      timestamp: new Date().toISOString()
    } as const;

    const outputLog = {
      status: geminiResponse.status,
      status_text: geminiResponse.statusText,
      headers: Object.fromEntries(geminiResponse.headers.entries()),
      latency_ms: apiLatencyMs,
      raw_response: geminiData,
      timestamp: new Date().toISOString()
    } as const;
    
    // Extract input metadata for logging
    const inputMetadata = {
      request_payload: geminiRequestPayload,
      model: 'gemini-2.0-flash',
      api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      prompt_length: finalPrompt.length,
      question_details: {
        question_id: questionId,
        question_text: question.question_text,
        is_ai_generated: question.is_ai_generated,
        has_prompt: !!question.ai_generated_prompt,
        structured_output_schema: question.ai_structured_output,
        prompt_placeholders: question.ai_prompt_placeholder
      },
      product_details: {
        product_id: designRequest.product_id,
        slug: product.slug,
        title: product.title,
        subtitle: product.subtitle
      },
      placeholder_replacements: {
        product_title_replaced: product.slug === 'general_default_hidden',
        answer_placeholders_processed: !!question.ai_prompt_placeholder && (previousAnswers?.length || 0) > 0,
        product_context_added: product.slug === 'general_default_hidden' && (() => {
          if (previousAnswers && previousAnswers.length > 0) {
            const productChoiceQuestion = previousAnswers.find(answer => {
              return answer.answer_text && (
                answer.answer_text.toLowerCase().includes('product') ||
                answer.answer_text.toLowerCase().includes('interested') ||
                answer.answer_text.toLowerCase().includes('design') ||
                answer.answer_text.toLowerCase().includes('sticker') ||
                answer.answer_text.toLowerCase().includes('custom')
              );
            });
            return !!productChoiceQuestion;
          }
          return false;
        })(),
        available_placeholders: product.slug === 'general_default_hidden' ? [
          '##user_product_choice##',
          '##product_context##', 
          '##design_context##'
        ] : [],
        user_selected_product: (() => {
          if (product.slug === 'general_default_hidden' && previousAnswers && previousAnswers.length > 0) {
            const productChoiceAnswer = previousAnswers.find(answer => 
              answer.question_id === '200ad2dc-bf2d-45c6-8aa7-1e0339a7f589'
            );
            if (productChoiceAnswer && productChoiceAnswer.answer_text) {
              return {
                question_id: productChoiceAnswer.question_id,
                answer_text: productChoiceAnswer.answer_text,
                found_in_products_table: true, // This will be updated after the product lookup
                matched_product: null as any // This will be updated after the product lookup
              };
            }
          }
          return null;
        })(),
        actual_replacements: (() => {
          if (product.slug === 'general_default_hidden') {
            return {
              product_title: '##product_title##',
              product_subtitle: '##product_subtitle##',
              description: '##description##'
            };
          }
          return null;
        })()
      },
      timestamp: new Date().toISOString()
    };
    
    // Update the metadata to reflect the actual placeholder replacements that were made
    if (product.slug === 'general_default_hidden' && inputMetadata.placeholder_replacements.actual_replacements) {
      if (userSelectedProduct) {
        inputMetadata.placeholder_replacements.actual_replacements.product_title = userSelectedProduct.title || '';
        inputMetadata.placeholder_replacements.actual_replacements.product_subtitle = userSelectedProduct.subtitle || '';
        inputMetadata.placeholder_replacements.actual_replacements.description = userSelectedProduct.description || '';
        
        if (inputMetadata.placeholder_replacements.user_selected_product) {
          inputMetadata.placeholder_replacements.user_selected_product.found_in_products_table = true;
          inputMetadata.placeholder_replacements.user_selected_product.matched_product = {
            id: userSelectedProduct.id,
            slug: userSelectedProduct.slug,
            title: userSelectedProduct.title,
            subtitle: userSelectedProduct.subtitle
          };
        }
      } else {
        inputMetadata.placeholder_replacements.actual_replacements.product_title = '';
        inputMetadata.placeholder_replacements.actual_replacements.product_subtitle = '';
        inputMetadata.placeholder_replacements.actual_replacements.description = '';
        
        if (inputMetadata.placeholder_replacements.user_selected_product) {
          inputMetadata.placeholder_replacements.user_selected_product.found_in_products_table = false;
        }
      }
    }
    
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

    // Extract output metadata for logging (after response parsing is complete)
    const outputMetadata = {
      response_status: geminiResponse.status,
      response_headers: Object.fromEntries(geminiResponse.headers.entries()),
      response_timestamp: new Date().toISOString(),
      model_response: {
        candidates_count: geminiData.candidates?.length || 0,
        has_content: !!geminiData.candidates?.[0]?.content,
        content_parts_count: geminiData.candidates?.[0]?.content?.parts?.length || 0,
        response_length: geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.length || 0
      },
      // Extract any additional metadata from Gemini response if available
      gemini_metadata: {
        promptFeedback: geminiData.promptFeedback || null,
        usageMetadata: geminiData.usageMetadata || null,
        safetyRatings: geminiData.candidates?.[0]?.safetyRatings || null,
        finishReason: geminiData.candidates?.[0]?.finishReason || null,
        index: geminiData.candidates?.[0]?.index || null
      },
      // Additional response analysis
      response_analysis: {
        parsing_success: !!parsedResponse,
        has_text_content: !!parsedResponse?.text,
        has_placeholders: !!parsedResponse?.placeholders,
        text_length: parsedResponse?.text?.length || 0,
        placeholders_count: parsedResponse?.placeholders?.length || 0
      },
      // Include latency in metadata for convenience
      performance: {
        api_latency_ms: apiLatencyMs
      }
    };

    // Log the Gemini run with enhanced metadata
    console.log('🔍 Logging Gemini run with enhanced metadata:', {
      inputMetadata: inputMetadata,
      outputMetadata: outputMetadata
    });
    
    const { data: geminiRun, error: logError } = await supabase
      .from('gemini_runs')
      .insert({
        request_id: requestId,
        question_id: questionId,
        prompt: finalPrompt,
        // Store the full raw Gemini response JSON as requested
        response: geminiData,
        metadata: {
          // Store whole input/output logs (raw) for auditing
          input_log: inputLog,
          output_log: outputLog,
          // Keep existing structured metadata for convenience/analytics
          input_metadata: inputMetadata,
          output_metadata: outputMetadata,
          // Backward compatibility fields
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
      geminiRunId: geminiRun?.id,
      inputMetadata: inputMetadata,
      outputMetadata: outputMetadata
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
