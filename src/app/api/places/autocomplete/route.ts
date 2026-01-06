import { NextResponse } from 'next/server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');

  if (!input) {
    return NextResponse.json({ predictions: [] });
  }

  if (!GOOGLE_PLACES_API_KEY) {
    return NextResponse.json(
      { error: 'Google Places API key not configured', predictions: [] },
      { status: 200 }
    );
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input
      )}&key=${GOOGLE_PLACES_API_KEY}&types=establishment|geocode`
    );

    if (!response.ok) {
      console.error('Google Places API error:', response.status);
      return NextResponse.json(
        { error: 'Failed to fetch predictions', predictions: [] },
        { status: 200 }
      );
    }

    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied:', data.error_message);
      return NextResponse.json(
        { error: 'API key issue', predictions: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({
      predictions: data.predictions || [],
    });
  } catch (error) {
    console.error('Error fetching place predictions:', error);
    return NextResponse.json(
      { error: 'Internal server error', predictions: [] },
      { status: 500 }
    );
  }
}
