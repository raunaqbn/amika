import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/trips/join/[token] - Get trip info by join token (for preview)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const trip = await prisma.tripSession.findByJoinToken(token);

    if (!trip) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Error finding trip by join token:', error);
    return NextResponse.json(
      { error: 'Failed to find trip' },
      { status: 500 }
    );
  }
}

// POST /api/trips/join/[token] - Join a trip using the token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userName = session.user.name;

    const { token } = await params;
    const result = await prisma.tripSession.joinTripByToken(token, userId, userName);

    if (!result) {
      return NextResponse.json(
        { error: 'Invalid or expired invite link' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tripId: result.tripId });
  } catch (error) {
    console.error('Error joining trip:', error);
    return NextResponse.json(
      { error: 'Failed to join trip' },
      { status: 500 }
    );
  }
}
