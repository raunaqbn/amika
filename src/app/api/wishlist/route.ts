import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const items = await prisma.wishlist.findByUserId(userId);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, link, price, category, priority, imageUrl } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await prisma.wishlist.create({
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      link: link?.trim() || null,
      price: price?.trim() || null,
      category: category || null,
      priority: priority ?? 0,
      imageUrl: imageUrl || null,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating wishlist item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, link, price, category, priority, imageUrl, purchased } = body;

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const updated = await prisma.wishlist.update(id, userId, {
      title: title?.trim(),
      description: description !== undefined ? description?.trim() || null : undefined,
      link: link !== undefined ? link?.trim() || null : undefined,
      price: price !== undefined ? price?.trim() || null : undefined,
      category,
      priority,
      imageUrl,
      purchased,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    const deleted = await prisma.wishlist.delete(id, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Item not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
