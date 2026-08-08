import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactImageUrl, isMediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthday, profileImage, phone, location, interests } = body;

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

    // Handle interests - convert array to JSON string
    let interestsJson: string | null | undefined = undefined;
    if (interests !== undefined) {
      if (interests === null || (Array.isArray(interests) && interests.length === 0)) {
        interestsJson = null;
      } else if (Array.isArray(interests)) {
        interestsJson = JSON.stringify(interests);
      }
    }

    const updatedUser = await prisma.user.update(session.user.id, {
      ...(name !== undefined && { name }),
      ...(birthdayDate !== undefined && { birthday: birthdayDate }),
      ...(profileImage !== undefined && {
        profileImage: isMediaImageUrl(request, 'user', session.user.id, profileImage)
          ? undefined
          : await persistImage(profileImage, { ownerId: session.user.id, kind: 'profile' }),
      }),
      ...(phone !== undefined && { phone }),
      ...(location !== undefined && { location }),
      ...(interestsJson !== undefined && { interests: interestsJson }),
    });

    // Parse interests back to array for response
    let parsedInterests: string[] = [];
    if (updatedUser.interests) {
      try {
        parsedInterests = JSON.parse(updatedUser.interests);
      } catch {
        parsedInterests = [];
      }
    }

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        birthday: updatedUser.birthday,
        profileImage: compactImageUrl(request, 'user', updatedUser.id, updatedUser.profileImage),
        phone: updatedUser.phone,
        location: updatedUser.location,
        isTemporary: updatedUser.isTemporary,
        interests: parsedInterests,
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
