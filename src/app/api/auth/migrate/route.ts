import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionCookieName } from '@/lib/auth';
import { compactImageUrl } from '@/lib/mobile-images';

// This endpoint creates the default user and migrates existing data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, birthday, migrateData } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Parse birthday if provided
    let birthdayDate: Date | null = null;
    if (birthday) {
      const [month, day, year] = birthday.split('/').map(Number);
      birthdayDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    // Check if user already exists
    let user = await prisma.user.findByEmail(email);

    if (user) {
      // User exists, just migrate data if requested
      if (migrateData) {
        await prisma.migrateDataToUser(user.id);
      }
    } else {
      // Create user
      user = await prisma.user.create({
        email,
        password,
        name,
        birthday: birthdayDate,
      });

      // Migrate existing data to this user
      if (migrateData) {
        await prisma.migrateDataToUser(user.id);
      }
    }

    // Create session
    const session = await prisma.session.create(user.id);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        birthday: user.birthday,
        profileImage: compactImageUrl(request, 'user', user.id, user.profileImage),
        createdAt: user.createdAt,
      },
      migrated: migrateData ?? false,
    });
  } catch (error: any) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete migration' },
      { status: 500 }
    );
  }
}
