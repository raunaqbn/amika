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

    return NextResponse.json(allFriends);
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
    const { name, birthday, howWeMet, notes, interests, lastContact } = body;

    const friend = await prisma.friend.create({
      data: {
        userId,
        name,
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
    const { id, name, birthday, howWeMet, notes, interests, lastContact, profileImage } = body;

    const friend = await prisma.friend.update({
      where: { id, userId },
      data: {
        ...(name !== undefined && { name }),
        ...(birthday !== undefined && { birthday: parseLocalDate(birthday) }),
        ...(howWeMet !== undefined && { howWeMet: howWeMet || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(interests !== undefined && { interests: interests || null }),
        ...(lastContact !== undefined && { lastContact: parseLocalDate(lastContact) }),
        ...(profileImage !== undefined && { profileImage }),
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

    await prisma.friend.delete({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return NextResponse.json({ error: 'Failed to delete friend' }, { status: 500 });
  }
}
