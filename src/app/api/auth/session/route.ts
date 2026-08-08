import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactImageUrl, mediaImageUrl } from '@/lib/mobile-images';
import { parseStoredInterests } from '@/lib/profile';

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null });
    }

    const includeStats = new URL(request.url).searchParams.get('stats') === 'true';
    const stats = includeStats ? await prisma.getUserStats(session.user.id) : undefined;

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
        interests: parseStoredInterests(session.user.interests),
        statusText: session.user.statusText,
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
