import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { compactImageUrl, isMediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';
import {
  normalizeProfileInterests,
  normalizeProfileStatus,
  parseStoredInterests,
  ProfileInputError,
} from '@/lib/profile';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, birthday, profileImage, phone, location, interests, statusText } = body;

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

    const normalizedInterests = normalizeProfileInterests(interests);
    const interestsJson = normalizedInterests === undefined
      ? undefined
      : normalizedInterests === null ? null : JSON.stringify(normalizedInterests);
    const normalizedStatus = normalizeProfileStatus(statusText);

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
      ...(normalizedStatus !== undefined && { statusText: normalizedStatus }),
    });

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
        interests: parseStoredInterests(updatedUser.interests),
        statusText: updatedUser.statusText,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof ProfileInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
