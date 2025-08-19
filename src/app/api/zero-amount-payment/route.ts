import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ success: true, designCode });
  } catch (error) {
    console.error('Error recording zero-amount payment:', error);
    return NextResponse.json({ error: 'Failed to record zero-amount payment' }, { status: 500 });
  }
}


