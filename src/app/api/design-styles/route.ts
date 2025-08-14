import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: styles, error } = await supabase
      .from('design_styles')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching design styles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch design styles' },
        { status: 500 }
      );
    }

    return NextResponse.json(styles);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
