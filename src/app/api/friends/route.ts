import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

// Helper function to parse date strings from HTML date inputs
function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all friends from friends table
    const friends = await prisma.friend.findMany({
      userId,
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

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
            linkedUserId: connection.id,
          },
        });
        newFriends.push({
          ...newFriend,
          memories: [],
        });
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
            friend.name !== linkedConnection.name;

          if (needsUpdate) {
            // Update the friend record with latest data from linked user
            await prisma.friend.update({
              where: { id: friend.id },
              data: {
                name: linkedConnection.name,
                profileImage: linkedConnection.profileImage,
                birthday: linkedConnection.birthday,
              } as any,
            });
            // Update the in-memory object as well
            friend.name = linkedConnection.name;
            friend.profileImage = linkedConnection.profileImage;
            friend.birthday = linkedConnection.birthday;
          }
        }
      }
    }

    // Sort by createdAt desc
    allFriends.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Count memories per friend
    const friendMemoriesMap = new Map<string, number>();
    for (const friend of allFriends as any[]) {
      if (friend.memories && Array.isArray(friend.memories)) {
        friendMemoriesMap.set(friend.id, friend.memories.length);
      }
    }

    // Count diary notes per friend (via diary notes with friends tags)
    const diaryNotes = await prisma.diaryNote.findMany({ userId });
    const friendNotesMap = new Map<string, number>();
    for (const note of diaryNotes) {
      if (note.friends && Array.isArray(note.friends)) {
        for (const friend of note.friends) {
          friendNotesMap.set(
            friend.id,
            (friendNotesMap.get(friend.id) || 0) + 1
          );
        }
      }
    }

    // Add the memory and journal context used by the friend-circle UI.
    const friendsWithContext = allFriends.map((friend: any) => ({
      ...friend,
      memoriesCount: friendMemoriesMap.get(friend.id) || 0,
      notesCount: friendNotesMap.get(friend.id) || 0,
    }));

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
        return NextResponse.json(friend);
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
        ...(profileImage !== undefined && { profileImage }),
        ...(customProfileImage !== undefined && { customProfileImage }),
      } as any,
    });

    return NextResponse.json(friend);
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
