import { NextResponse } from 'next/server';

const SERPAPI_KEY = process.env.SERPAPI_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const engine = searchParams.get('engine') || 'google_local';
  const query = searchParams.get('q') || 'restaurants';
  const location = searchParams.get('location') || 'Campbell, CA';

  if (!SERPAPI_KEY) {
    return NextResponse.json({
      error: 'SERPAPI_API_KEY not configured',
      envCheck: {
        hasKey: false,
        keyPrefix: null,
      },
    });
  }

  try {
    const params = new URLSearchParams({
      engine,
      q: query,
      location,
      api_key: SERPAPI_KEY,
      hl: 'en',
    });

    // For yelp engine, use different params
    if (engine === 'yelp') {
      params.delete('q');
      params.delete('location');
      params.set('find_desc', query);
      params.set('find_loc', location);
    }

    const url = `https://serpapi.com/search?${params.toString()}`;
    console.log('[test-serpapi] Fetching:', url.replace(SERPAPI_KEY, 'REDACTED'));

    const response = await fetch(url);
    const data = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      engine,
      query,
      location,
      dataKeys: Object.keys(data),
      hasResults: engine === 'google_local'
        ? (data.local_results?.length || 0) > 0
        : engine === 'google_showtimes'
        ? (data.showtimes?.length || 0) > 0
        : engine === 'google_events'
        ? (data.events_results?.length || 0) > 0
        : engine === 'yelp'
        ? (data.organic_results?.length || 0) > 0
        : false,
      resultCount: engine === 'google_local'
        ? data.local_results?.length || 0
        : engine === 'google_showtimes'
        ? data.showtimes?.length || 0
        : engine === 'google_events'
        ? data.events_results?.length || 0
        : engine === 'yelp'
        ? data.organic_results?.length || 0
        : 0,
      error: data.error || null,
      sampleResult: engine === 'google_local'
        ? data.local_results?.[0]
        : engine === 'google_showtimes'
        ? data.showtimes?.[0]
        : engine === 'google_events'
        ? data.events_results?.[0]
        : engine === 'yelp'
        ? data.organic_results?.[0]
        : null,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
