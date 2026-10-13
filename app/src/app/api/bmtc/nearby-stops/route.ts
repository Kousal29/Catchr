import { NextResponse } from 'next/server';

const BMTC_BASE = process.env.NEXT_PUBLIC_BMTC_API_BASE || 'https://bmtcmobileapistaging.amnex.com/WebAPI';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BMTC_BASE}/FindNearByBusStop_v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat: body.lat, lng: body.lng }), // The actual BMTC API expects these fields
    });
    const data = await res.json();
    return NextResponse.json({ data: data?.data || data || [] });
  } catch (error) {
    return NextResponse.json({ data: [], error: 'BMTC API unavailable' }, { status: 502 });
  }
}
