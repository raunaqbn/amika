import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/trips/[id]/tickets - List all tickets
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
    const trip = await prisma.tripSession.findById(id, userId);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trip.tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/trips/[id]/tickets - Add ticket
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
    const { type, title, description, collaboratorId, confirmationNum, departureTime, arrivalTime, location, cost, currency, url, passengerName, flightDirection, departureLocation, arrivalLocation } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    const ticket = await prisma.tripTicket.create(id, {
      type,
      title,
      description,
      collaboratorId,
      confirmationNum,
      departureTime: departureTime ? new Date(departureTime) : undefined,
      arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
      location,
      cost,
      currency,
      url,
      passengerName,
      flightDirection,
      departureLocation,
      arrivalLocation,
    }, userId);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    if (error.message === 'Trip not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// PUT /api/trips/[id]/tickets - Update ticket
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
    const { ticketId, type, title, description, collaboratorId, confirmationNum, departureTime, arrivalTime, location, cost, currency, url, passengerName, flightDirection, departureLocation, arrivalLocation } = body;

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const ticket = await prisma.tripTicket.update(ticketId, {
      type,
      title,
      description,
      collaboratorId,
      confirmationNum,
      departureTime: departureTime ? new Date(departureTime) : undefined,
      arrivalTime: arrivalTime ? new Date(arrivalTime) : undefined,
      location,
      cost,
      currency,
      url,
      passengerName,
      flightDirection,
      departureLocation,
      arrivalLocation,
    }, userId);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

// DELETE /api/trips/[id]/tickets - Remove ticket
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
    const ticketId = searchParams.get('ticketId');

    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }

    const deleted = await prisma.tripTicket.delete(ticketId, userId);

    if (!deleted) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}
