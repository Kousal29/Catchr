import { NextResponse } from 'next/server';

const BMTC_BASE = process.env.NEXT_PUBLIC_BMTC_API_BASE || 'https://bmtcmobileapistaging.amnex.com/WebAPI';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let parentRouteId = body.routeId;

    // Resolve the true parent route ID using SearchRoute_v2
    if (body.routeno) {
      // e.g. "V-500CA UP" -> "V-500CA"
      const baseRouteNo = body.routeno.replace(/\s+(UP|DOWN)$/i, '').trim();
      
      try {
        let searchTexts = [baseRouteNo];
        if (baseRouteNo.includes('-')) {
          searchTexts.push(baseRouteNo.substring(0, baseRouteNo.lastIndexOf('-')).trim());
        }
        if (baseRouteNo.includes(' ')) {
          searchTexts.push(baseRouteNo.substring(0, baseRouteNo.lastIndexOf(' ')).trim());
        }

        for (const text of searchTexts) {
          if (!text) continue;
          
          const searchRes = await fetch(`${BMTC_BASE}/SearchRoute_v2`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'lan': 'en',
              'deviceType': 'WEB',
              'Origin': 'https://nammabmtcapp.karnataka.gov.in',
              'Referer': 'https://nammabmtcapp.karnataka.gov.in/',
              'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({ routetext: text }),
          });
          
          if (searchRes.ok) {
            const searchData = await searchRes.json();
            const match = searchData?.data?.find((r: any) => 
              r.routeno?.toLowerCase() === baseRouteNo.toLowerCase()
            );
            if (match?.routeparentid) {
              parentRouteId = match.routeparentid;
              break; // Found it, stop searching
            }
          }
        }
      } catch (err) {
        console.warn("Failed to resolve parentRouteId:", err);
      }
    }

    const res = await fetch(`${BMTC_BASE}/SearchByRouteDetails_v4`, {
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
      body: JSON.stringify({ routeid: parentRouteId, servicetypeid: 0 }),
    });
    
    if (!res.ok) {
      throw new Error(`BMTC API error: ${res.status}`);
    }
    
    const data = await res.json();
    const bmtcData = data?.data || data || {};
    
    // Map the BMTC format to the BMTCRouteDetails format expected by the frontend
    const mappedDetails = {
      routeid: body.routeId,
      upstops: bmtcData.up?.data || [],
      downstops: bmtcData.down?.data || [],
    };
    
    return NextResponse.json({ data: mappedDetails });
  } catch (error) {
    console.error("BMTC API Error:", error);
    return NextResponse.json({ data: null, error: 'BMTC API unavailable' }, { status: 502 });
  }
}
