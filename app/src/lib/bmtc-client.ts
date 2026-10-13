import type { BMTCRoute, BMTCRouteDetails, BMTCStop } from '@/types';

const API_BASE = '/api/bmtc';

async function bmtcFetch<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`BMTC API error: ${res.status}`);
  return res.json();
}

export async function searchRoutes(keyword: string): Promise<BMTCRoute[]> {
  const data = await bmtcFetch<{ data: BMTCRoute[] }>('/search-route', { keyword });
  return data.data || [];
}

export async function getRouteDetails(routeId: string, routeno?: string): Promise<BMTCRouteDetails | null> {
  try {
    const data = await bmtcFetch<{ data: BMTCRouteDetails }>('/route-details', { routeId, routeno });
    return data.data || null;
  } catch {
    return getMockRouteDetails(routeId);
  }
}

export async function getNearbyStops(lat: number, lng: number): Promise<BMTCStop[]> {
  try {
    const data = await bmtcFetch<{ data: BMTCStop[] }>('/nearby-stops', { lat, lng });
    return data.data || [];
  } catch {
    return [];
  }
}

// ============================================
// MOCK DATA (fallback when BMTC API is unavailable)
// ============================================
function getMockRoutes(keyword: string): BMTCRoute[] {
  const allRoutes: BMTCRoute[] = [
    { routeid: 'R001', routeno: '500D', routename: 'Kempegowda Bus Station to Banashankari', fromstation: 'Kempegowda Bus Station', tostation: 'Banashankari TTMC', distance: '12.5', routeorder: '1' },
    { routeid: 'R002', routeno: '500NA', routename: 'Kempegowda Bus Station to Nagasandra', fromstation: 'Kempegowda Bus Station', tostation: 'Nagasandra', distance: '18.2', routeorder: '1' },
    { routeid: 'R003', routeno: '401K', routename: 'Kengeri to Kadugodi', fromstation: 'Kengeri', tostation: 'Kadugodi', distance: '35.0', routeorder: '1' },
    { routeid: 'R004', routeno: '335E', routename: 'Electronic City to Hebbal', fromstation: 'Electronic City', tostation: 'Hebbal', distance: '28.5', routeorder: '1' },
    { routeid: 'R005', routeno: '356T', routename: 'Silk Board to Thanisandra', fromstation: 'Silk Board', tostation: 'Thanisandra', distance: '22.0', routeorder: '1' },
    { routeid: 'R006', routeno: '201R', routename: 'Majestic to Yelahanka', fromstation: 'Kempegowda Bus Station', tostation: 'Yelahanka', distance: '15.8', routeorder: '1' },
    { routeid: 'R007', routeno: '600AB', routename: 'Airport to Banashankari', fromstation: 'Kempegowda Airport', tostation: 'Banashankari TTMC', distance: '42.0', routeorder: '1' },
    { routeid: 'R008', routeno: 'V500CA', routename: 'Volvp Central to Airport', fromstation: 'Shantinagar TTMC', tostation: 'Kempegowda Airport', distance: '38.5', routeorder: '1' },
  ];
  const kw = keyword.toLowerCase();
  return allRoutes.filter(r => r.routeno.toLowerCase().includes(kw) || r.routename.toLowerCase().includes(kw));
}

function getMockRouteDetails(routeId: string): BMTCRouteDetails {
  const stopSets: Record<string, string[]> = {
    'R001': ['Kempegowda Bus Station', 'City Market', 'Lalbagh West Gate', 'Jayanagar 4th Block', 'South End Circle', 'Banashankari 1st Stage', 'Banashankari TTMC'],
    'R004': ['Electronic City Phase 1', 'Infosys Gate', 'Bommanahalli', 'Silk Board Junction', 'BTM Layout', 'Dairy Circle', 'Lalbagh', 'Majestic', 'Mekhri Circle', 'Sadashivanagar', 'Hebbal'],
    'default': ['Stop A', 'Stop B', 'Stop C', 'Stop D', 'Stop E', 'Stop F', 'Stop G', 'Stop H'],
  };
  const stops = (stopSets[routeId] || stopSets['default']).map((name, i) => ({
    stationid: `S${routeId}_${i}`,
    stationname: name,
    centerlat: (12.9716 + (i * 0.005)).toString(),
    centerlong: (77.5946 + (i * 0.003)).toString(),
  }));

  return {
    routeid: routeId,
    routeno: routeId === 'R001' ? '500D' : routeId === 'R004' ? '335E' : 'ROUTE',
    fromstation: stops[0].stationname,
    tostation: stops[stops.length - 1].stationname,
    upstops: stops,
    downstops: [...stops].reverse(),
    vehicles: [
      { vehicleid: 'V101', vehicleno: 'KA-57-F-1234', currentstop: stops[1]?.stationname || '', nextstop: stops[2]?.stationname || '', laststop: stops[stops.length - 1]?.stationname || '', lat: '12.975', lng: '77.598', speed: '22', heading: 'N', eta: '5 mins', lastUpdatedAt: new Date().toISOString() },
      { vehicleid: 'V102', vehicleno: 'KA-57-F-5678', currentstop: stops[3]?.stationname || '', nextstop: stops[4]?.stationname || '', laststop: stops[stops.length - 1]?.stationname || '', lat: '12.955', lng: '77.585', speed: '18', heading: 'N', eta: '12 mins', lastUpdatedAt: new Date().toISOString() },
    ],
  };
}
