import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, birthday } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Parse birthday if provided
    let birthdayDate: Date | null = null;
    if (birthday) {
      const [year, month, day] = birthday.split('-').map(Number);
      birthdayDate = new Date(year, month - 1, day, 12, 0, 0);
    }

    // Create user
    const user = await prisma.user.create({
      email,
      password,
      name,
      birthday: birthdayDate,
    });

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
      sessionToken: session.token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        birthday: user.birthday,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.message === 'User with this email already exists') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
