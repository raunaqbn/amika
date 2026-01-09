import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/event-plans/[id]/polls - List polls
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const context = searchParams.get('context') || undefined;

    const polls = await prisma.eventPlanPoll.findMany(id, userId, context);
    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}

// POST /api/event-plans/[id]/polls - Create poll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { context, question, options } = body;

    if (!context || !question || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: 'Context, question, and at least 2 options are required' },
        { status: 400 }
      );
    }

    const poll = await prisma.eventPlanPoll.create(id, {
      context,
      question,
      options,
    }, userId);

    return NextResponse.json(poll, { status: 201 });
  } catch (error: any) {
    console.error('Error creating poll:', error);
    if (error.message === 'Event plan not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    );
  }
}

// PUT /api/event-plans/[id]/polls - Close poll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await request.json();
    const { pollId } = body;

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    const poll = await prisma.eventPlanPoll.close(pollId, userId);

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error('Error closing poll:', error);
    return NextResponse.json(
      { error: 'Failed to close poll' },
      { status: 500 }
    );
  }
}

// PATCH /api/event-plans/[id]/polls - Update poll (add/remove options)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const body = await request.json();
    const { pollId, question, addOptions, removeOptionIds } = body;

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    if (!question && (!addOptions || addOptions.length === 0) && (!removeOptionIds || removeOptionIds.length === 0)) {
      return NextResponse.json(
        { error: 'At least one change (question, addOptions, or removeOptionIds) is required' },
        { status: 400 }
      );
    }

    const poll = await prisma.eventPlanPoll.update(pollId, {
      question,
      addOptions,
      removeOptionIds,
    }, userId);

    return NextResponse.json(poll);
  } catch (error: any) {
    console.error('Error updating poll:', error);
    if (error.message === 'Poll not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update poll' },
      { status: 500 }
    );
  }
}

// DELETE /api/event-plans/[id]/polls - Delete poll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await params;
    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get('pollId');

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 }
      );
    }

    await prisma.eventPlanPoll.delete(pollId, userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting poll:', error);
    if (error.message === 'Poll not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 }
    );
  }
}
