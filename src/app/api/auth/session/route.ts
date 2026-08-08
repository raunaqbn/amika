import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactImageUrl, mediaImageUrl } from '@/lib/mobile-images';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const includeStats = new URL(request.url).searchParams.get('stats') === 'true';
    const stats = includeStats ? await prisma.getUserStats(session.user.id) : undefined;

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
        profileImage: session.user.hasProfileImage
          ? mediaImageUrl(request, 'user', session.user.id)
          : compactImageUrl(request, 'user', session.user.id, session.user.profileImage),
        phone: session.user.phone,
        location: session.user.location,
        isTemporary: session.user.isTemporary,
        interests,
        createdAt: session.user.createdAt,
      },
      ...(includeStats && { stats }),
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json(
      { error: 'Failed to get session' },
      { status: 500 }
    );
  }
}
