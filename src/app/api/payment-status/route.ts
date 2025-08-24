import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const email = searchParams.get('email');
    
    if (!requestId && !email) {
      return NextResponse.json(
        { error: 'Either requestId or email parameter is required' },
        { status: 400 }
      );
    }
    
    const supabase = createClient();
    
    let query = supabase
      .from('design_request_states')
      .select(`
        request_id,
        design_code,
        email,
        current_payment_status,
        current_status,
        total_amount,
        payment_confirmed_at,
        stripe_payment_intent_id,
        updated_at
      `);
    
    if (requestId) {
      query = query.eq('request_id', requestId);
    } else if (email) {
      query = query.eq('email', email);
    }
    
    const { data, error } = await query.single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching payment status:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payment status' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      paymentStatus: data
    });

  } catch (error) {
    console.error('Error in payment status check:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
