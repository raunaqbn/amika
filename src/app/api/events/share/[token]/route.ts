import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/events/share/[token] - Get event info by share token (public, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const event = await prisma.event.findByShareToken(token);

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error finding event by share token:', error);
    return NextResponse.json(
      { error: 'Failed to find event' },
      { status: 500 }
    );
  }
}
