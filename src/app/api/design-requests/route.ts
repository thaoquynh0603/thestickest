import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      productId,
      email,
      designDescription,
      preferredStyle,
      preferredShape,
      additionalDetails
    } = body;

    // For initial creation, only productId is required
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Generate design code using the database function
    const { data: designCodeResult, error: codeError } = await supabase
      .rpc('generate_design_code');

    if (codeError) {
      console.error('Error generating design code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate design code' },
        { status: 500 }
      );
    }

    const designCode = designCodeResult;

    // Create the initial design request with minimal data
    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .insert({
        product_id: productId,
        email: email || null, // Allow null for initial creation
        design_code: designCode,
        status: 'DRAFT'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating design request:', error);
      return NextResponse.json(
        { error: 'Failed to create design request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      designCode,
      designRequest
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    
    const {
      requestId,
      answers,
      email,
      status,
      selectedStyleId
    } = body;

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    const effectiveRequestId: string | null =
      typeof requestId === 'string' && uuidRegex.test(requestId)
        ? requestId
        : (typeof (body as any).applicationId === 'string' && uuidRegex.test((body as any).applicationId)
            ? (body as any).applicationId
            : null);

    let targetRequestId: string | null = effectiveRequestId;

    if (!targetRequestId && typeof email === 'string' && email.trim()) {
      // Fallback: derive the most recent request by email when id isn't supplied correctly
      const { data: recent, error: recentErr } = await supabase
        .from('design_requests')
        .select('id')
        .eq('email', email.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!recentErr && recent?.id) {
        targetRequestId = recent.id as string;
      }
    }

    if (!targetRequestId) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
    }

    // Persist answers via history RPC if provided
    if (answers !== undefined) {
      let parsedAnswers: any = answers;
      if (typeof answers === 'string') {
        try {
          parsedAnswers = JSON.parse(answers);
        } catch {
          // keep as raw string
        }
      }

      if (parsedAnswers && typeof parsedAnswers === 'object') {
        const entries = Object.entries(parsedAnswers as Record<string, any>);
        await Promise.all(entries.map(async ([questionId, value]) => {
          // Decide which RPC params to populate
          let p_answer_text: string | undefined = undefined;
          let p_answer_file_url: string | undefined = undefined;
          let p_answer_options: any | undefined = undefined;

          if (Array.isArray(value)) {
            // Store arrays as options payload
            p_answer_options = { values: value };
          } else if (value && typeof value === 'object') {
            // Store objects as options payload
            p_answer_options = value;
          } else if (typeof value === 'string') {
            // Heuristic: URLs saved as text should go to file_url, otherwise text
            const isUrl = /^https?:\/\//i.test(value);
            if (isUrl) {
              p_answer_file_url = value;
            } else {
              p_answer_text = value;
            }
          }

          try {
            await supabase.rpc('add_design_request_answer_history', {
              p_request_id: targetRequestId,
              p_question_id: questionId,
              p_answer_text,
              p_answer_file_url,
              p_answer_options,
            });
          } catch (e) {
            console.warn('Failed to log answer history for question', questionId, e);
          }
        }));
      }
    }

    // Update the design request with new data (excluding answers which live in history)
    const updateData: any = {};

    if (email) {
      updateData.email = email;
    }

    if (status) {
      updateData.status = status;
    }

    if (selectedStyleId && uuidRegex.test(String(selectedStyleId))) {
      updateData.selected_style_id = selectedStyleId;
    }

    if (Object.keys(updateData).length === 0) {
      // If we only logged answers and there are no direct fields to update, consider this a success
      return NextResponse.json({ success: true });
    }

    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .update(updateData)
      .eq('id', targetRequestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating design request:', error);
      return NextResponse.json(
        { error: 'Failed to update design request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      designRequest
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const designCode = searchParams.get('designCode');

    let query = supabase
      .from('design_requests')
      .select(`
        *,
        products (
          id,
          title,
          slug,
          starting_price
        )
      `);

    if (email) {
      query = query.eq('email', email);
    }

    if (designCode) {
      query = query.eq('design_code', designCode);
    }

    const { data: designRequests, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching design requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch design requests' },
        { status: 500 }
      );
    }

    return NextResponse.json(designRequests);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
