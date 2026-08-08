import { NextRequest, NextResponse } from 'next/server';
import { getFriendContextCounts, prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { compactImageUrl, isMediaImageUrl, mediaImageUrl } from '@/lib/mobile-images';
import { persistImage } from '@/lib/media-storage';

// Helper function to parse date strings from HTML date inputs
function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function latestEngagement(...values: Array<Date | string | null | undefined>) {
  const timestamps = values
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    if (searchParams.get('view') === 'compact') {
      const friends = await prisma.friend.findCompact({ userId });
      return NextResponse.json(friends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        profileImage: friend.hasCustomProfileImage || friend.hasProfileImage
          ? mediaImageUrl(request, 'friend', friend.id)
          : null,
        customProfileImage: friend.hasCustomProfileImage ? mediaImageUrl(request, 'friend', friend.id) : null,
        linkedUserId: friend.linkedUserId,
      })));
    }

    // Get all friends from friends table
    const friends = await prisma.friend.findMany({ userId, orderBy: { createdAt: 'desc' } });

    // Get all accepted connections (Amika friends)
    const acceptedConnections = await prisma.userConnection.findAcceptedConnections(userId);

    // Find accepted connections that don't have corresponding friend records
    const existingLinkedUserIds = new Set(
      friends.filter((f: any) => f.linkedUserId).map((f: any) => f.linkedUserId)
    );

    // Create friend records for any accepted connections missing from friends table
    const newFriends = [];
    for (const connection of acceptedConnections) {
      if (!existingLinkedUserIds.has(connection.id)) {
        // Create the missing friend record
        const newFriend = await prisma.friend.create({
          data: {
            userId,
            name: connection.name,
            birthday: connection.birthday,
            profileImage: connection.profileImage,
            interests: connection.interests,
            linkedUserId: connection.id,
          },
        });
        newFriends.push(newFriend);
      }
    }

    // Combine lists
    const allFriends = [...friends, ...newFriends];

    // Sync profile data for Amika friends (linked users)
    // Update their profile image and birthday from the linked user's data
    for (const friend of allFriends as any[]) {
      if (friend.linkedUserId) {
        const linkedConnection = acceptedConnections.find(c => c.id === friend.linkedUserId);
        if (linkedConnection) {
          const needsUpdate =
            friend.profileImage !== linkedConnection.profileImage ||
            (friend.birthday?.toISOString?.() || friend.birthday) !== (linkedConnection.birthday?.toISOString?.() || linkedConnection.birthday) ||
            friend.name !== linkedConnection.name ||
            friend.interests !== linkedConnection.interests;

          if (needsUpdate) {
            // Update the friend record with latest data from linked user
            await prisma.friend.update({
              where: { id: friend.id },
              data: {
                name: linkedConnection.name,
                profileImage: linkedConnection.profileImage,
                birthday: linkedConnection.birthday,
                interests: linkedConnection.interests,
              } as any,
            });
            // Update the in-memory object as well
            friend.name = linkedConnection.name;
            friend.profileImage = linkedConnection.profileImage;
            friend.birthday = linkedConnection.birthday;
            friend.interests = linkedConnection.interests;
          }
        }
      }
    }

    const contextCounts = await getFriendContextCounts(userId);

    // Add the memory and journal context used by the friend-circle UI.
    const friendsWithContext = allFriends.map((friend: any) => {
      const linkedConnection = friend.linkedUserId
        ? acceptedConnections.find((connection) => connection.id === friend.linkedUserId)
        : undefined;
      const compactProfile = compactImageUrl(request, 'friend', friend.id, friend.customProfileImage || friend.profileImage);
      const lastEngagedAt = latestEngagement(
        friend.lastContact,
        contextCounts.latestMemory.get(friend.id),
        contextCounts.latestNote.get(friend.id),
        friend.linkedUserId ? contextCounts.latestMessage.get(friend.linkedUserId) : null,
      );
      return {
        ...friend,
        interests: linkedConnection?.interests ?? friend.interests,
        statusText: linkedConnection?.statusText ?? null,
        profileImage: compactProfile,
        customProfileImage: friend.customProfileImage ? compactProfile : null,
        memoriesCount: contextCounts.memories.get(friend.id) || 0,
        notesCount: contextCounts.notes.get(friend.id) || 0,
        lastEngagedAt,
      };
    });

    friendsWithContext.sort((a: any, b: any) => {
      const engagementDifference = new Date(b.lastEngagedAt || 0).getTime() - new Date(a.lastEngagedAt || 0).getTime();
      if (engagementDifference) return engagementDifference;
      const createdDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return createdDifference || a.name.localeCompare(b.name);
    });

    return NextResponse.json(friendsWithContext);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Failed to fetch friends' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, birthday, howWeMet, notes, interests, lastContact } = body;

    const friend = await prisma.friend.create({
      data: {
        userId,
        name,
        email: email || null,
        birthday: parseLocalDate(birthday),
        howWeMet: howWeMet || null,
        notes: notes || null,
        interests: interests || null,
        lastContact: parseLocalDate(lastContact),
      } as any,
    });

    return NextResponse.json(friend);
  } catch (error) {
    console.error('Error creating friend:', error);
    return NextResponse.json({ error: 'Failed to create friend' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email, birthday, howWeMet, notes, interests, lastContact, profileImage, customProfileImage, resetToDefault } = body;

    // If resetToDefault is true, clear the customProfileImage
    // For regular friends (no linkedUserId), also clear profileImage
    if (resetToDefault) {
      // First, get the friend to check if it's an Amika friend
      const friends = await prisma.friend.findMany({ userId });
      const existingFriend = friends.find((f: { id: string }) => f.id === id);

      if (existingFriend) {
        const updateData: { customProfileImage: null; profileImage?: null } = { customProfileImage: null };
        // For regular friends, reset profileImage to null as well
        if (!existingFriend.linkedUserId) {
          updateData.profileImage = null;
        }

        const friend = await prisma.friend.update({
          where: { id, userId },
          data: updateData,
        });
        const compactProfile = compactImageUrl(request, 'friend', friend.id, friend.customProfileImage || friend.profileImage);
        return NextResponse.json({
          ...friend,
          profileImage: compactProfile,
          customProfileImage: friend.customProfileImage ? compactProfile : null,
        });
      }
    }

    const friend = await prisma.friend.update({
      where: { id, userId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(birthday !== undefined && { birthday: parseLocalDate(birthday) }),
        ...(howWeMet !== undefined && { howWeMet: howWeMet || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(interests !== undefined && { interests: interests || null }),
        ...(lastContact !== undefined && { lastContact: parseLocalDate(lastContact) }),
        ...(profileImage !== undefined && {
          profileImage: isMediaImageUrl(request, 'friend', id, profileImage)
            ? undefined
            : await persistImage(profileImage, { ownerId: userId, kind: 'friend' }),
        }),
        ...(customProfileImage !== undefined && {
          customProfileImage: isMediaImageUrl(request, 'friend', id, customProfileImage)
            ? undefined
            : await persistImage(customProfileImage, { ownerId: userId, kind: 'friend' }),
        }),
      } as any,
    });

    const compactProfile = compactImageUrl(request, 'friend', friend.id, friend.customProfileImage || friend.profileImage);
    return NextResponse.json({
      ...friend,
      profileImage: compactProfile,
      customProfileImage: friend.customProfileImage ? compactProfile : null,
    });
  } catch (error) {
    console.error('Error updating friend:', error);
    return NextResponse.json({ error: 'Failed to update friend' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
    }

    // Get the friend to check if it's an Amika friend (linked to another user)
    const friends = await prisma.friend.findMany({ userId });
    const friendToDelete = friends.find((f: { id: string }) => f.id === id);

    if (friendToDelete && friendToDelete.linkedUserId) {
      // Also delete the UserConnection so the friend won't be auto-recreated
      await prisma.userConnection.deleteConnection(userId, friendToDelete.linkedUserId);
    }

    await prisma.friend.delete({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return NextResponse.json({ error: 'Failed to delete friend' }, { status: 500 });
  }
}
