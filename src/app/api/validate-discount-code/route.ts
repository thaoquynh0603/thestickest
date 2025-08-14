import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { code, email, orderAmount } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid order amount is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Validate discount code using the database function
    const { data, error } = await supabase.rpc('validate_discount_code', {
      p_code: code,
      p_email: email || null,
      p_order_amount: orderAmount
    });

    if (error) {
      console.error('Error validating discount code:', error);
      return NextResponse.json(
        { error: 'Failed to validate discount code' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 400 }
      );
    }

    const result = data[0];

    if (!result.is_valid) {
      return NextResponse.json(
        { 
          error: result.message,
          isValid: false,
          discountAmount: 0
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      isValid: true,
      discountAmount: result.discount_amount,
      discountType: result.discount_type,
      discountValue: result.discount_value,
      message: result.message,
      finalAmount: orderAmount - result.discount_amount
    });

  } catch (error) {
    console.error('Error in discount code validation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
