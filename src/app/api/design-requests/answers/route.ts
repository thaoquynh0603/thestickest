import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('design_request_answers_history')
      .select('question_id, answer_text, answer_file_url, answer_options, created_at, is_current')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch answers history', error);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    // Keep only the latest entry per question (prefer rows marked is_current=true)
    const latest: Record<string, typeof data[number]> = {};
    for (const row of data || []) {
      const existing = latest[row.question_id];
      if (!existing || (existing.is_current === false && row.is_current === true) || new Date(row.created_at) > new Date(existing.created_at)) {
        latest[row.question_id] = row;
      }
    }

    return NextResponse.json(Object.values(latest));
  } catch (e) {
    console.error('Unexpected error fetching answers', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


