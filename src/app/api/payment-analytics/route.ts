import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  // This endpoint is no longer in use
  return new NextResponse(
    JSON.stringify({ error: 'This endpoint is not implemented' }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}
