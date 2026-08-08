import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { compactImageUrl } from '@/lib/mobile-images';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!code || code.length > 256) {
      return NextResponse.json({ error: 'The Google sign-in code is invalid.' }, { status: 400 });
    }

    const handoff = await prisma.oauthHandoff.consume(code);
    if (!handoff) {
      return NextResponse.json({ error: 'This Google sign-in link expired. Please try again.' }, { status: 401 });
    }
    const user = await prisma.user.findById(handoff.userId);
    if (!user) {
      return NextResponse.json({ error: 'Your Amika account could not be found.' }, { status: 404 });
    }

    return NextResponse.json({
      sessionToken: handoff.sessionToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        birthday: user.birthday,
        profileImage: compactImageUrl(request, 'user', user.id, user.profileImage),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Mobile Google exchange error:', error);
    return NextResponse.json({ error: 'Google sign-in could not be completed.' }, { status: 500 });
  }
}
