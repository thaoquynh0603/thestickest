import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';
    const includeUnpaid = searchParams.get('includeUnpaid') === 'true';
    
    const supabase = createClient();
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7);
    }
    
    // Get paid requests using the new payment tracking table
    const { data: paidRequests, error: paidError } = await supabase.rpc('get_paid_requests', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (paidError) {
      console.error('Error fetching paid requests:', paidError);
      return NextResponse.json({ error: 'Failed to fetch paid requests' }, { status: 500 });
    }

    // Get all design requests in the period for comparison
    const { data: allRequests, error: allError } = await supabase
      .from('design_requests')
      .select(`
        id,
        design_code,
        email,
        created_at,
        status,
        product_id
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('Error fetching all requests:', allError);
      return NextResponse.json({ error: 'Failed to fetch all requests' }, { status: 500 });
    }

    // Get payment tracking analytics view
    const { data: paymentAnalytics, error: analyticsError } = await supabase
      .from('payment_tracking_analytics')
      .select('*')
      .gte('payment_date', startDate.toISOString().split('T')[0])
      .lte('payment_date', endDate.toISOString().split('T')[0])
      .order('payment_date', { ascending: false });

    if (analyticsError) {
      console.error('Error fetching payment analytics:', analyticsError);
      // Continue without analytics data
    }

    // Calculate comprehensive statistics
    const totalRequests = allRequests?.length || 0;
    const paidRequestsCount = paidRequests?.length || 0;
    const unpaidRequestsCount = totalRequests - paidRequestsCount;
    const conversionRate = totalRequests > 0 ? (paidRequestsCount / totalRequests) * 100 : 0;

    // Calculate revenue metrics
    const totalRevenue = paidRequests?.reduce((sum, req) => sum + (req.net_amount || 0), 0) || 0;
    const totalDiscounts = paidRequests?.reduce((sum, req) => sum + (req.discount_amount || 0), 0) || 0;
    const averageOrderValue = paidRequestsCount > 0 ? totalRevenue / paidRequestsCount : 0;

    // Group by date for trend analysis
    const requestsByDate = new Map();
    const paymentsByDate = new Map();

    allRequests?.forEach(request => {
      if (!request || !request.created_at) return; // skip malformed entries
      const date = request.created_at.split('T')[0];
      if (!requestsByDate.has(date)) {
        requestsByDate.set(date, { requests: 0, paid: 0, revenue: 0 });
      }
      requestsByDate.get(date).requests++;
    });

    paidRequests?.forEach(payment => {
      if (!payment || !payment.payment_confirmed_at) return; // skip if no confirmed date
      const date = payment.payment_confirmed_at.split('T')[0];
      if (!paymentsByDate.has(date)) {
        paymentsByDate.set(date, { requests: 0, paid: 0, revenue: 0 });
      }
      const dateData = paymentsByDate.get(date);
      dateData.paid++;
      dateData.revenue += payment.net_amount || 0;
    });

    // Merge data for daily trends
    const dailyTrends = Array.from(requestsByDate.keys()).map(date => {
      const requests = requestsByDate.get(date);
      const payments = paymentsByDate.get(date) || { requests: 0, paid: 0, revenue: 0 };
      
      return {
        date,
        totalRequests: requests.requests,
        paidRequests: payments.paid,
        conversionRate: requests.requests > 0 ? (payments.paid / requests.requests) * 100 : 0,
        revenue: payments.revenue / 100, // Convert cents to dollars
        unpaidRequests: requests.requests - payments.paid
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare response data
  const response: any = {
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalRequests,
        paidRequests: paidRequestsCount,
        unpaidRequests: unpaidRequestsCount,
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        totalDiscounts: totalDiscounts / 100,
        averageOrderValue: averageOrderValue / 100
      },
      dailyTrends,
      paidRequests: paidRequests?.map(req => ({
        requestId: req.request_id,
        designCode: req.design_code,
        email: req.email,
        paymentAmount: (req.payment_amount ?? 0) / 100,
        paymentCurrency: req.payment_currency,
        paymentConfirmedAt: req.payment_confirmed_at,
        discountCode: req.discount_code,
        netAmount: (req.net_amount ?? 0) / 100
      })) || [],
  paymentAnalytics: paymentAnalytics || [],
  unpaidRequests: [],
      insights: {
        topPerformingDays: dailyTrends
          .filter(day => day.conversionRate > 0)
          .sort((a, b) => b.conversionRate - a.conversionRate)
          .slice(0, 5),
        revenueTrend: dailyTrends
          .filter(day => day.revenue > 0)
          .map(day => ({ date: day.date, revenue: day.revenue })),
        conversionTrend: dailyTrends.map(day => ({
          date: day.date,
          conversionRate: day.conversionRate
        }))
      }
    };

    // Add unpaid requests if requested
    if (includeUnpaid) {
      const paidRequestIds = new Set(paidRequests?.map(req => req.request_id) || []);
      const unpaidRequests = allRequests?.filter(req => !paidRequestIds.has(req.id)) || [];
      
      response.unpaidRequests = unpaidRequests.map(req => ({
        requestId: req.id,
        designCode: req.design_code,
        email: req.email,
        createdAt: req.created_at,
        status: req.status,
        productId: req.product_id
      }));
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in enhanced payment analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
