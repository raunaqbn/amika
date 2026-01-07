import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    // Get user stats
    const stats = await prisma.getUserStats(session.user.id);

    // Parse interests from JSON string
    let interests: string[] = [];
    if (session.user.interests) {
      try {
        interests = JSON.parse(session.user.interests);
      } catch {
        interests = [];
      }
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        birthday: session.user.birthday,
        profileImage: session.user.profileImage,
        interests,
        createdAt: session.user.createdAt,
      },
      stats,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
