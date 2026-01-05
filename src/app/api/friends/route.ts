import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const friends = await prisma.friend.findMany({
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
    const body = await request.json();
    const { name, birthday, howWeMet, notes, lastContact, avatarUrl } = body;

    const friend = await prisma.friend.create({
      data: {
        name,
        birthday: birthday ? new Date(`${birthday}T12:00:00Z`) : null,
        howWeMet: howWeMet || null,
        notes: notes || null,
        lastContact: lastContact ? new Date(`${lastContact}T12:00:00Z`) : null,
        avatarUrl: avatarUrl || null,
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
    const body = await request.json();
    const { id, name, birthday, howWeMet, notes, lastContact, avatarUrl } = body;

    const friend = await prisma.friend.update({
      where: { id },
      data: {
        name,
        birthday: birthday ? new Date(`${birthday}T12:00:00Z`) : null,
        howWeMet: howWeMet || null,
        notes: notes || null,
        lastContact: lastContact ? new Date(`${lastContact}T12:00:00Z`) : null,
        avatarUrl: avatarUrl || null,
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Friend ID required' }, { status: 400 });
    }

    await prisma.friend.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friend:', error);
    return NextResponse.json({ error: 'Failed to delete friend' }, { status: 500 });
  }
}
