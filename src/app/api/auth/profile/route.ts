import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthday, profileImage } = body;

    // Parse birthday if provided
    let birthdayDate: Date | null | undefined = undefined;
    if (birthday !== undefined) {
      if (birthday === null || birthday === '') {
        birthdayDate = null;
      } else {
        const [year, month, day] = birthday.split('-').map(Number);
        birthdayDate = new Date(year, month - 1, day, 12, 0, 0);
      }
    }

    const updatedUser = await prisma.user.update(session.user.id, {
      ...(name !== undefined && { name }),
      ...(birthdayDate !== undefined && { birthday: birthdayDate }),
      ...(profileImage !== undefined && { profileImage }),
    });

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        birthday: updatedUser.birthday,
        profileImage: updatedUser.profileImage,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
