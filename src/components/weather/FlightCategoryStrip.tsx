import { useEffect, useRef, useCallback, useState } from 'react';
import L from 'leaflet';
import { parseTaf, formatTafTime, type ParsedTaf, type TafForecastGroup } from '@/utils/tafParser';
import { getRunwayHeadings, findBestRunway, calculateWindComponents, headingToRunway } from '@/utils/windComponents';

interface Waypoint {
  id: string;
  identifier: string;
  coordinates: [number, number];
}

interface WaypointWeather {
  waypointId: string;
  identifier: string;
  coordinates: [number, number];
  weather: {
    condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    visibility: number;
    ceiling: number | null;
    rawMetar?: string;
    observationTime?: string;
  };
}

interface FlightCategoryStripProps {
  map: L.Map | null;
  waypoints: Waypoint[];
  waypointWeather: WaypointWeather[];
  show: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  VFR: '#22c55e',
  MVFR: '#3b82f6',
  IFR: '#ef4444',
  LIFR: '#a855f7',
};

const CATEGORY_RANK: Record<string, number> = {
  VFR: 0,
  MVFR: 1,
  IFR: 2,
  LIFR: 3,
};

function categorize(visSM: number, ceilingFt: number | null): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  const ceil = ceilingFt ?? 99999;
  if (visSM < 1 || ceil < 500) return 'LIFR';
  if (visSM < 3 || ceil < 1000) return 'IFR';
  if (visSM <= 5 || ceil <= 3000) return 'MVFR';
  return 'VFR';
}

interface ParsedMetar {
  visibility: number;
  ceiling: number | null;
  windDir: number;
  windSpeed: number;
  windGust: number | null;
  temperature: number | null;
  dewpoint: number | null;
  altimeter: number | null;
  clouds: string;
  wx: string;
}

function parseMetarFull(raw: string): ParsedMetar {
  let visibility = 10;
  let ceiling: number | null = null;
  let windDir = 0;
  let windSpeed = 0;
  let windGust: number | null = null;
  let temperature: number | null = null;
  let dewpoint: number | null = null;
  let altimeter: number | null = null;
  let clouds = 'CLR';
  let wx = '';

  const visMatch = raw.match(/\b(\d+)\s*SM\b/);
  const visFrac = raw.match(/\b(\d+\/\d+)\s*SM\b/);
  if (visMatch) visibility = parseInt(visMatch[1]);
  else if (visFrac) {
    const parts = visFrac[1].split('/');
    visibility = parseInt(parts[0]) / parseInt(parts[1]);
  }

  const ceilMatch = raw.match(/\b(?:BKN|OVC)(\d{3})\b/);
  if (ceilMatch) ceiling = parseInt(ceilMatch[1]) * 100;

  const windMatch = raw.match(/\b(\d{3})(\d{2,3})(?:G(\d{2,3}))?KT\b/);
  if (windMatch) {
    windDir = parseInt(windMatch[1]);
    windSpeed = parseInt(windMatch[2]);
    windGust = windMatch[3] ? parseInt(windMatch[3]) : null;
  }

  const tempMatch = raw.match(/\b(M?\d{2})\/(M?\d{2})\b/);
  if (tempMatch) {
    temperature = parseInt(tempMatch[1].replace('M', '-'));
    dewpoint = parseInt(tempMatch[2].replace('M', '-'));
  }

  const altMatch = raw.match(/\bA(\d{4})\b/);
  if (altMatch) altimeter = parseInt(altMatch[1]) / 100;

  const cloudMatch = raw.match(/\b(CLR|FEW\d{3}|SCT\d{3}|BKN\d{3}|OVC\d{3})\b/);
  if (cloudMatch) clouds = cloudMatch[1];

  const wxPatterns = raw.match(/\b(\+?-?(?:RA|SN|TS|FG|BR|HZ|DZ|SH|GR|PL|SQ|FC|VA|SA|DU|FU|SS|DS|PE|GS|UP|TSRA|TSSN|FZRA|FZDZ|FZFG|BLSN|BLSA|BLDU|BLPY)+)\b/g);
  if (wxPatterns) wx = wxPatterns.join(' ');

  return { visibility, ceiling, windDir, windSpeed, windGust, temperature, dewpoint, altimeter, clouds, wx };
}

function windDirToCardinal(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const useFlightCategoryStrip = ({ map, waypoints, waypointWeather, show }: FlightCategoryStripProps) => {
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [liveWeather, setLiveWeather] = useState<Map<string, { raw: string; parsed: ParsedMetar; cat: string; obsTime: string }>>(new Map());
  const [liveTafs, setLiveTafs] = useState<Map<string, ParsedTaf>>(new Map());

  const fetchLiveData = useCallback(async () => {
    if (waypoints.length === 0) return;
    const ids = waypoints.map(w => w.identifier).join(',');
    const baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aviation-weather`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };

    // Fetch METAR and TAF in parallel
    try {
      const [metarRes, tafRes] = await Promise.all([
        fetch(`${baseUrl}?type=metar&ids=${ids}`, { headers }),
        fetch(`${baseUrl}?type=taf&ids=${ids}`, { headers }),
      ]);

      // Process METARs
      if (metarRes.ok) {
        const metars: any[] = await metarRes.json();
        if (Array.isArray(metars)) {
          const newMap = new Map<string, any>();
          metars.forEach((m: any) => {
            const icao = (m.icaoId || m.stationId || '').toUpperCase();
            const rawOb = m.rawOb || m.rawMetar || '';
            if (!icao || !rawOb) return;
            const parsed = parseMetarFull(rawOb);
            const cat = categorize(parsed.visibility, parsed.ceiling);
            const obsTime = m.reportTime || m.obsTime || new Date().toISOString();
            newMap.set(icao, { raw: rawOb, parsed, cat, obsTime });
          });
          setLiveWeather(newMap);
          console.log(`[FlightCatStrip] Live METAR refresh: ${newMap.size} stations`);
        }
      }

      // Process TAFs
      if (tafRes.ok) {
        const tafs: any[] = await tafRes.json();
        if (Array.isArray(tafs)) {
          const tafMap = new Map<string, ParsedTaf>();
          tafs.forEach((t: any) => {
            const rawTaf = t.rawTAF || t.rawTaf || '';
            if (!rawTaf) return;
            const parsed = parseTaf(rawTaf);
            if (parsed) tafMap.set(parsed.icao.toUpperCase(), parsed);
          });
          setLiveTafs(tafMap);
          console.log(`[FlightCatStrip] Live TAF refresh: ${tafMap.size} stations`);
        }
      }
    } catch (err) {
      console.warn('[FlightCatStrip] Data fetch error:', err);
    }
  }, [waypoints]);

  useEffect(() => {
    if (!show || waypoints.length === 0) return;
    fetchLiveData();
    refreshTimerRef.current = setInterval(fetchLiveData, AUTO_REFRESH_INTERVAL_MS);
    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [show, waypoints.length, fetchLiveData]);

  const render = useCallback(() => {
    if (!map) return;
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    layerGroupRef.current.clearLayers();
    if (!show || waypoints.length < 2) return;

    const getWeather = (wp: Waypoint) => {
      const live = liveWeather.get(wp.identifier.toUpperCase());
      if (live) return {
        condition: live.cat as any,
        parsed: live.parsed,
        rawMetar: live.raw,
        obsTime: live.obsTime,
        isLive: true,
      };
      const passed = waypointWeather.find(w => w.waypointId === wp.id);
      if (passed) {
        const parsed = passed.weather.rawMetar ? parseMetarFull(passed.weather.rawMetar) : {
          visibility: passed.weather.visibility,
          ceiling: passed.weather.ceiling,
          windDir: 0, windSpeed: 0, windGust: null,
          temperature: null, dewpoint: null, altimeter: null,
          clouds: 'CLR', wx: '',
        };
        return {
          condition: passed.weather.condition,
          parsed,
          rawMetar: passed.weather.rawMetar,
          obsTime: passed.weather.observationTime,
          isLive: false,
        };
      }
      return {
        condition: 'VFR' as const,
        parsed: { visibility: 10, ceiling: null, windDir: 0, windSpeed: 0, windGust: null, temperature: null, dewpoint: null, altimeter: null, clouds: 'CLR', wx: '' } as ParsedMetar,
        rawMetar: undefined as string | undefined,
        obsTime: undefined as string | undefined,
        isLive: false,
      };
    };

    // Draw color-coded segments
    for (let i = 0; i < waypoints.length - 1; i++) {
      const startWp = waypoints[i];
      const endWp = waypoints[i + 1];
      const startW = getWeather(startWp);
      const endW = getWeather(endWp);
      const worstCat = CATEGORY_RANK[startW.condition] >= CATEGORY_RANK[endW.condition] ? startW.condition : endW.condition;
      const color = CATEGORY_COLORS[worstCat];

      const strip = L.polyline(
        [L.latLng(startWp.coordinates[1], startWp.coordinates[0]), L.latLng(endWp.coordinates[1], endWp.coordinates[0])],
        { color, weight: 10, opacity: 0.5, lineCap: 'round', lineJoin: 'round' }
      );
      layerGroupRef.current?.addLayer(strip);
    }

    // Add category marker badges with popup
    waypoints.forEach((wp) => {
      const w = getWeather(wp);
      const cat = w.condition;
      const color = CATEGORY_COLORS[cat];
      const p = w.parsed;
      const obsTimeStr = w.obsTime ? new Date(w.obsTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

      const icon = L.divIcon({
        className: 'flight-category-badge',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-36px);">
            <div style="background:${color};color:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;font-family:ui-monospace,monospace;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(0,0,0,0.35);border:2px solid ${w.isLive ? '#fff' : 'rgba(255,255,255,0.5)'};white-space:nowrap;position:relative;">
              ${cat}
              ${w.isLive ? '<span style="position:absolute;top:-3px;right:-3px;width:6px;height:6px;background:#22c55e;border-radius:50%;border:1px solid white;"></span>' : ''}
            </div>
            <div style="font-size:9px;color:white;background:rgba(0,0,0,0.6);padding:1px 5px;border-radius:3px;margin-top:2px;white-space:nowrap;">
              ${p.visibility}SM ${p.ceiling ? p.ceiling + 'ft' : 'CLR'}${obsTimeStr ? ' · ' + obsTimeStr : ''}
            </div>
            <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid ${color};margin-top:1px;"></div>
          </div>
        `,
        iconSize: [80, 55],
        iconAnchor: [40, 55],
      });

      // Build METAR decode section
      const windStr = p.windSpeed > 0
        ? `${p.windDir.toString().padStart(3, '0')}° (${windDirToCardinal(p.windDir)}) at ${p.windSpeed}kt${p.windGust ? ' G' + p.windGust + 'kt' : ''}`
        : 'Calm';
      const tempStr = p.temperature !== null ? `${p.temperature}°C / ${p.dewpoint}°C` : 'N/A';
      const altStr = p.altimeter !== null ? `${p.altimeter.toFixed(2)}"` : 'N/A';
      const wxStr = p.wx || 'None';

      // Wind component calculations
      const runways = getRunwayHeadings(wp.identifier);
      let windCompHtml = '';
      if (p.windSpeed > 0 && runways.length > 0) {
        const best = findBestRunway(p.windDir, p.windSpeed, runways);
        if (best) {
          const hwColor = best.components.headwind >= 0 ? '#22c55e' : '#ef4444';
          const xwColor = best.components.crosswindAbs > 15 ? '#ef4444' : best.components.crosswindAbs > 10 ? '#f59e0b' : '#22c55e';
          windCompHtml = `
            <tr><td colspan="2" style="padding-top:4px;border-top:1px solid rgba(128,128,128,0.2);"></td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Best RWY</td><td style="font-weight:700;">${best.runway}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Headwind</td><td style="font-weight:600;color:${hwColor};">${best.components.headwindLabel}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Crosswind</td><td style="font-weight:600;color:${xwColor};">${best.components.crosswindLabel}</td></tr>
          `;
          // Show all runway options
          const otherRwys = runways.filter(r => r !== best.heading).slice(0, 3);
          if (otherRwys.length > 0) {
            const others = otherRwys.map(r => {
              const comp = calculateWindComponents(p.windDir, p.windSpeed, r);
              return `RWY ${headingToRunway(r)}: ${comp.headwindLabel}, ${comp.crosswindLabel}`;
            }).join('<br/>');
            windCompHtml += `<tr><td style="color:#888;padding:1px 4px 1px 0;">Others</td><td style="font-size:9px;color:#999;">${others}</td></tr>`;
          }
        }
      } else if (p.windSpeed > 0) {
        windCompHtml = `<tr><td style="color:#888;padding:1px 4px 1px 0;font-size:9px;" colspan="2">Runway data not available for wind calc</td></tr>`;
      }

      // TAF decode section
      const taf = liveTafs.get(wp.identifier.toUpperCase());
      let tafHtml = '';
      if (taf) {
        const now = new Date();
        // Find current and upcoming groups
        const upcomingGroups = taf.groups.filter(g => new Date(g.toTime) > now).slice(0, 4);

        tafHtml = `
          <div style="margin-top:8px;padding-top:6px;border-top:2px solid rgba(128,128,128,0.3);">
            <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;">
              <span style="font-weight:700;font-size:11px;color:#60a5fa;">TAF FORECAST</span>
              ${taf.amendment ? '<span style="background:#f59e0b;color:white;padding:0 4px;border-radius:3px;font-size:8px;font-weight:700;">AMD</span>' : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">
              ${upcomingGroups.map(g => {
                const gColor = CATEGORY_COLORS[g.condition];
                const timeFrom = formatTafTime(g.fromTime);
                const timeTo = formatTafTime(g.toTime);
                const typeLabel = g.type === 'BASE' ? '' : g.type === 'PROB' ? `PROB${g.probability || ''}` : g.type;
                const gWind = g.windSpeed > 0
                  ? `${g.windDir.toString().padStart(3, '0')}/${g.windSpeed}${g.windGust ? 'G' + g.windGust : ''}kt`
                  : 'Calm';
                return `
                  <div style="background:rgba(0,0,0,0.15);border-radius:4px;padding:3px 5px;border-left:3px solid ${gColor};">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                      <span style="font-size:9px;color:#aaa;">${typeLabel ? typeLabel + ' ' : ''}${timeFrom} → ${timeTo}</span>
                      <span style="background:${gColor};color:white;padding:0 4px;border-radius:3px;font-size:9px;font-weight:700;">${g.condition}</span>
                    </div>
                    <div style="font-size:10px;margin-top:1px;">
                      ${gWind} · ${g.visibility}SM · ${g.ceiling ? g.ceiling + 'ft' : 'CLR'}
                      ${g.wx ? ' · <span style="color:#f59e0b;">' + g.wx + '</span>' : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
        // Show raw TAF at bottom
        tafHtml += `<div style="margin-top:4px;font-size:8px;color:#666;word-break:break-all;max-height:40px;overflow-y:auto;">${taf.rawTaf}</div>`;
      }

      const popupContent = `
        <div style="font-family:ui-monospace,monospace;font-size:11px;min-width:240px;max-width:320px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(128,128,128,0.3);">
            <span style="background:${color};color:white;padding:1px 6px;border-radius:4px;font-weight:700;font-size:12px;">${cat}</span>
            <span style="font-weight:700;font-size:13px;">${wp.identifier}</span>
            ${w.isLive ? '<span style="color:#22c55e;font-size:9px;font-weight:600;">● LIVE</span>' : ''}
          </div>
          <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:3px;">METAR</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Wind</td><td style="font-weight:600;">${windStr}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Visibility</td><td style="font-weight:600;">${p.visibility} SM</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Ceiling</td><td style="font-weight:600;">${p.ceiling ? p.ceiling + ' ft AGL' : 'Clear'}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Clouds</td><td style="font-weight:600;">${p.clouds}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Temp/Dew</td><td style="font-weight:600;">${tempStr}</td></tr>
            <tr><td style="color:#888;padding:1px 4px 1px 0;">Altimeter</td><td style="font-weight:600;">${altStr}</td></tr>
            ${wxStr !== 'None' ? `<tr><td style="color:#888;padding:1px 4px 1px 0;">Weather</td><td style="font-weight:600;color:#f59e0b;">${wxStr}</td></tr>` : ''}
            ${windCompHtml}
          </table>
          ${w.rawMetar ? `<div style="margin-top:4px;padding-top:3px;border-top:1px solid rgba(128,128,128,0.3);font-size:9px;color:#888;word-break:break-all;">${w.rawMetar}</div>` : ''}
          ${obsTimeStr ? `<div style="margin-top:2px;font-size:9px;color:#666;">Observed: ${obsTimeStr}</div>` : ''}
          ${tafHtml}
        </div>
      `;

      const marker = L.marker([wp.coordinates[1], wp.coordinates[0]], { icon, interactive: true });
      marker.bindPopup(popupContent, { className: 'metar-decode-popup', maxWidth: 340 });
      layerGroupRef.current?.addLayer(marker);
    });
  }, [map, waypoints, waypointWeather, show, liveWeather, liveTafs]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current && map) {
        map.removeLayer(layerGroupRef.current);
        layerGroupRef.current = null;
      }
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
  }, [map]);
};
