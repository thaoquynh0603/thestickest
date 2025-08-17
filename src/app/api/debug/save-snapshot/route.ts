import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Lightweight server-side logging for debugging; avoid persisting in production
    console.log('[DEBUG SNAPSHOT]', JSON.stringify(body));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Failed to save debug snapshot', e);
    return NextResponse.json({ error: 'Failed to save debug snapshot' }, { status: 500 });
  }
}
