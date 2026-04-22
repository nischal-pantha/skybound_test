import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getRateLimitKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now };
  }
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, resetIn: entry.resetTime - now };
}

const ICAO_REGEX = /^[A-Z]{4}$/;
function validateICAO(code: string): boolean {
  return !!code && ICAO_REGEX.test(code.toUpperCase().trim());
}
function validateBbox(bbox: string): boolean {
  if (!bbox) return false;
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [west, south, east, north] = parts;
  return south >= -90 && south <= 90 && north >= -90 && north <= 90 &&
    west >= -180 && west <= 180 && east >= -180 && east <= 180 && south <= north;
}

const VALID_TYPES = ['metar', 'taf', 'pirep', 'airsigmet', 'isigmet', 'sigmet', 'airmet'];

let requestCount = 0;
function cleanupRateLimitStore() {
  requestCount++;
  if (requestCount % 100 === 0) {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) rateLimitStore.delete(key);
    }
  }
}

async function fetchAndParse(apiUrl: string, type: string): Promise<any[]> {
  console.log(`[proxy] Fetching: ${apiUrl}`);
  const response = await fetch(apiUrl, {
    headers: { 'Accept': 'application/json', 'User-Agent': 'FlightPlanningApp/1.0' },
  });

  const responseText = await response.text();
  const contentType = response.headers.get('content-type') || '';
  console.log(`[proxy] Status: ${response.status}, CT: ${contentType}, len: ${responseText.length}`);

  if (!response.ok || !responseText || responseText.trim() === '') {
    return [];
  }

  const trimmed = responseText.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed);
      return Array.isArray(data) ? data : data ? [data] : [];
    } catch {
      return [];
    }
  }

  // Plain text fallback for metar/taf
  if (type === 'metar' || type === 'taf') {
    const lines = trimmed.split('\n').filter((l: string) => l.trim());
    return lines.map((line: string) => {
      const clean = line.trim();
      if (type === 'metar') {
        const m = clean.replace(/^METAR\s+/i, '').match(/^([A-Z]{4})/);
        return { icaoId: m?.[1] || 'UNKN', rawOb: clean };
      } else {
        const m = clean.replace(/^TAF\s+(AMD\s+)?/i, '').match(/^([A-Z]{4})/);
        return { icaoId: m?.[1] || 'UNKN', rawTAF: clean };
      }
    });
  }

  return [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const clientKey = getRateLimitKey(req);
  const rateLimit = checkRateLimit(clientKey);
  cleanupRateLimitStore();

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const jsonResp = (data: any, status = 200) => new Response(
    JSON.stringify(data),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-RateLimit-Remaining': rateLimit.remaining.toString() } }
  );

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type')?.toLowerCase() || '';
    const ids = url.searchParams.get('ids');
    const bbox = url.searchParams.get('bbox');

    if (!type) return jsonResp({ error: 'Missing type parameter' }, 400);
    if (!VALID_TYPES.includes(type)) return jsonResp({ error: `Invalid type: ${type}` }, 400);

    // --- METAR / TAF ---
    if (type === 'metar' || type === 'taf') {
      if (!ids && !bbox) return jsonResp({ error: 'Need ids or bbox' }, 400);
      if (ids) {
        for (const code of ids.split(',')) {
          if (!validateICAO(code.trim().toUpperCase())) return jsonResp({ error: `Invalid ICAO: ${code}` }, 400);
        }
      }
      if (bbox && !validateBbox(bbox)) return jsonResp({ error: 'Invalid bbox' }, 400);

      let apiUrl = `https://aviationweather.gov/api/data/${type}?format=json`;
      if (ids) apiUrl += `&ids=${encodeURIComponent(ids.toUpperCase())}`;
      if (bbox) apiUrl += `&bbox=${encodeURIComponent(bbox)}`;

      const data = await fetchAndParse(apiUrl, type);
      console.log(`[proxy] Returning ${data.length} ${type} results`);
      return jsonResp(data);
    }

    // --- PIREPs ---
    if (type === 'pirep') {
      let apiUrl = 'https://aviationweather.gov/api/data/pirep?format=json';
      if (ids) apiUrl += `&id=${encodeURIComponent(ids.toUpperCase())}`;
      if (bbox) apiUrl += `&bbox=${encodeURIComponent(bbox)}`;
      // Default: last 2 hours
      const age = url.searchParams.get('age') || '2';
      apiUrl += `&age=${age}`;

      const data = await fetchAndParse(apiUrl, type);
      console.log(`[proxy] Returning ${data.length} PIREPs`);
      return jsonResp(data);
    }

    // --- AIRMETs / SIGMETs / ISIGMETs ---
    if (type === 'airsigmet' || type === 'isigmet' || type === 'sigmet' || type === 'airmet') {
      // Fetch both airsigmet and isigmet for comprehensive coverage
      const endpoints = type === 'isigmet' 
        ? ['https://aviationweather.gov/api/data/isigmet?format=json']
        : ['https://aviationweather.gov/api/data/airsigmet?format=json'];
      
      let allData: any[] = [];
      for (const ep of endpoints) {
        let epUrl = ep;
        if (bbox) epUrl += `&bbox=${encodeURIComponent(bbox)}`;
        const data = await fetchAndParse(epUrl, type);
        allData = allData.concat(data);
      }

      // Also fetch international SIGMETs
      if (type === 'airsigmet' || type === 'sigmet') {
        try {
          const intl = await fetchAndParse('https://aviationweather.gov/api/data/isigmet?format=json', 'isigmet');
          allData = allData.concat(intl);
        } catch { /* optional */ }
      }

      console.log(`[proxy] Returning ${allData.length} advisories`);
      return jsonResp(allData);
    }

    return jsonResp({ error: 'Unhandled type' }, 400);

  } catch (error) {
    console.error('[proxy] Error:', error);
    return jsonResp([]);
  }
});
