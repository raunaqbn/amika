import { after, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendPushNotification } from '@/lib/push-notifications';
import { compactImageUrl } from '@/lib/mobile-images';

// GET - Fetch connections for the authenticated user
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'sent' | 'received' | 'all' | null;
    const status = searchParams.get('status') || undefined;
    const accepted = searchParams.get('accepted') === 'true';

    if (accepted) {
      // Return only accepted connections (actual friends)
      const friends = await prisma.userConnection.findAcceptedConnections(session.user.id);
      return NextResponse.json(friends.map((friend: any) => ({
        ...friend,
        profileImage: compactImageUrl(request, 'user', friend.id, friend.profileImage),
      })));
    }

    const connections = await prisma.userConnection.findMany({
      userId: session.user.id,
      type: type || 'all',
      status,
    });

    return NextResponse.json(connections.map((connection: any) => ({
      ...connection,
      otherUser: connection.otherUser ? {
        ...connection.otherUser,
        profileImage: compactImageUrl(request, 'user', connection.otherUser.id, connection.otherUser.profileImage),
      } : connection.otherUser,
      requester: connection.requester ? {
        ...connection.requester,
        profileImage: compactImageUrl(request, 'user', connection.requester.id, connection.requester.profileImage),
      } : connection.requester,
      addressee: connection.addressee ? {
        ...connection.addressee,
        profileImage: compactImageUrl(request, 'user', connection.addressee.id, connection.addressee.profileImage),
      } : connection.addressee,
    })));
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST - Send a friend request
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { addresseeId } = await request.json();

    if (!addresseeId) {
      return NextResponse.json({ error: 'addresseeId is required' }, { status: 400 });
    }

    const connection = await prisma.userConnection.create({
      requesterId: session.user.id,
      addresseeId,
    });

    after(async () => {
      try {
        await sendPushNotification(
          addresseeId,
          `${session.user.name || 'A friend'} wants to connect`,
          'Open Amika to respond.',
          { type: 'friend_request', connectionId: connection.id },
        );
      } catch (pushError) {
        console.error('Error sending friend-request push notification:', pushError);
      }
    });

    return NextResponse.json(connection);
  } catch (error: any) {
    console.error('Error creating connection:', error);
    return NextResponse.json({ error: error.message || 'Failed to create connection' }, { status: 400 });
  }
}

// PUT - Accept or reject a connection request
export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const connection = await prisma.userConnection.update({
      id,
      userId: session.user.id,
      status,
    });

    return NextResponse.json(connection);
  } catch (error: any) {
    console.error('Error updating connection:', error);
    return NextResponse.json({ error: error.message || 'Failed to update connection' }, { status: 400 });
  }
}

// DELETE - Remove a connection
export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.userConnection.delete({
      id,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting connection:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete connection' }, { status: 400 });
  }
}
