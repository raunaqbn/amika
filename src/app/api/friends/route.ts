import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Helper function to parse date strings from HTML date inputs
// Ensures dates are treated as local dates, not UTC
function parseLocalDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  // Parse the date string and create a Date object at noon to avoid timezone shifts
  // Using noon (12:00) ensures the date doesn't roll back when converted to UTC
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

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
    const { name, birthday, howWeMet, notes, lastContact } = body;

    const friend = await prisma.friend.create({
      data: {
        name,
        birthday: parseLocalDate(birthday),
        howWeMet: howWeMet || null,
        notes: notes || null,
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
    const body = await request.json();
    const { id, name, birthday, howWeMet, notes, lastContact, profileImage } = body;

    const friend = await prisma.friend.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(birthday !== undefined && { birthday: parseLocalDate(birthday) }),
        ...(howWeMet !== undefined && { howWeMet: howWeMet || null }),
        ...(notes !== undefined && { notes: notes || null }),
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
