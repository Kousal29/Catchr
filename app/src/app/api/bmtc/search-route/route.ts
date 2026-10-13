import { NextResponse } from 'next/server';

const BMTC_BASE = process.env.NEXT_PUBLIC_BMTC_API_BASE || 'https://bmtcmobileapistaging.amnex.com/WebAPI';

let cachedRoutes: any[] = [];
let cacheTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const keyword = body.keyword?.toLowerCase() || '';

    if (!keyword) {
      return NextResponse.json({ data: [] });
    }

    // Refresh cache if needed
    if (Date.now() - cacheTime > CACHE_DURATION || cachedRoutes.length === 0) {
      const res = await fetch(`${BMTC_BASE}/GetAllRouteList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'lan': 'en',
          'deviceType': 'WEB',
          'Origin': 'https://nammabmtcapp.karnataka.gov.in',
          'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify({}),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data?.data && Array.isArray(data.data)) {
          cachedRoutes = data.data;
          cacheTime = Date.now();
        }
      } else {
        console.warn(`BMTC API returned ${res.status}. Using stale cache if available.`);
        // If we have no cache and the API failed, throw so we return empty data
        if (cachedRoutes.length === 0) {
          throw new Error(`BMTC API error: ${res.status}`);
        }
      }
    }

    // Filter routes locally by routeno
    const filtered = cachedRoutes
      .filter((r) => r.routeno?.toLowerCase().includes(keyword))
      .slice(0, 50); // Limit to top 50 results for performance

    return NextResponse.json({ data: filtered });
  } catch (error) {
    console.error("BMTC API Error:", error);
    // Return 200 with empty array to prevent frontend crash if API is unavailable
    return NextResponse.json({ data: [] });
  }
}
