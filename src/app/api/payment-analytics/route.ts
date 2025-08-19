import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    
    const supabase = createClient();
    
    // Get payment summary with clear distinction between payment types
    const { data: paymentSummary, error: summaryError } = await supabase
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
      `)
      .order('updated_at', { ascending: false });

    if (summaryError) {
      console.error('Error fetching payment summary:', summaryError);
      return NextResponse.json({ error: 'Failed to fetch payment summary' }, { status: 500 });
    }

    // Get recent payment events to distinguish payment types
    const { data: recentEvents, error: eventsError } = await supabase
      .from('design_request_events')
      .select(`
        id,
        request_id,
        event_type,
        event_data,
        created_at,
        created_by
      `)
      .in('event_type', ['PAYMENT_SUCCEEDED', 'PAYMENT_FAILED', 'PAYMENT_CANCELLED'])
      .order('created_at', { ascending: false })
      .limit(50);

    if (eventsError) {
      console.error('Error fetching recent events:', eventsError);
      return NextResponse.json({ error: 'Failed to fetch recent events' }, { status: 500 });
    }

    // Process the data to categorize payment types
    const processedSummary = paymentSummary?.map(item => {
      const paymentEvent = recentEvents?.find(event => 
        event.request_id === item.request_id && 
        event.event_type === 'PAYMENT_SUCCEEDED'
      );
      
      let paymentType = 'unknown';
      let actualAmountPaid = 0;
      
      if (paymentEvent?.event_data) {
        const eventData = paymentEvent.event_data as any;
        paymentType = eventData.payment_type || 'unknown';
        actualAmountPaid = eventData.amount || 0;
      }
      
      return {
        ...item,
        payment_type: paymentType,
        actual_amount_paid: actualAmountPaid,
        is_zero_amount: actualAmountPaid === 0,
        is_actual_payment: actualAmountPaid > 0,
      };
    });

    // Calculate statistics
    const totalApplications = processedSummary?.length || 0;
    const successfulPayments = processedSummary?.filter(item => 
      item.current_payment_status === 'SUCCEEDED'
    ).length || 0;
    
    const actualPayments = processedSummary?.filter(item => 
      item.current_payment_status === 'SUCCEEDED' && item.is_actual_payment
    ).length || 0;
    
    const zeroAmountDiscounts = processedSummary?.filter(item => 
      item.current_payment_status === 'SUCCEEDED' && item.is_zero_amount
    ).length || 0;
    
    const failedPayments = processedSummary?.filter(item => 
      item.current_payment_status === 'FAILED'
    ).length || 0;
    
    const pendingPayments = processedSummary?.filter(item => 
      item.current_payment_status === 'PENDING'
    ).length || 0;

    const totalRevenue = processedSummary?.reduce((sum, item) => 
      sum + (item.actual_amount_paid || 0), 0
    ) || 0;

    const statistics = {
      totalApplications,
      successfulPayments,
      actualPayments,
      zeroAmountDiscounts,
      failedPayments,
      pendingPayments,
      totalRevenue,
      successRate: totalApplications > 0 ? (successfulPayments / totalApplications) * 100 : 0,
    };

    return NextResponse.json({
      paymentSummary: processedSummary,
      recentEvents,
      statistics,
      period
    });

  } catch (error) {
    console.error('Error in payment analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
