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

    const friends = await prisma.friend.findMany({
      userId,
      include: {
        memories: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(friends);
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
      },
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
      },
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
