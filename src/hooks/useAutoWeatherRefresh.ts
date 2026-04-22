import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

export interface NearestAirportWeather {
  icao: string;
  distance: number; // nm
  rawMetar: string;
  rawTaf: string;
  fetchedAt: number;
}

// Major airports with coordinates for nearest-airport lookup
const AIRPORT_COORDS: Record<string, [number, number]> = {
  'KSFO': [37.6213, -122.3790], 'KLAX': [33.9425, -118.4081], 'KJFK': [40.6413, -73.7781],
  'KORD': [41.9742, -87.9073], 'KATL': [33.6407, -84.4277], 'KDEN': [39.8561, -104.6737],
  'KDFW': [32.8998, -97.0403], 'KMIA': [25.7959, -80.2870], 'KBOS': [42.3656, -71.0096],
  'KSEA': [47.4502, -122.3088], 'KPHX': [33.4373, -112.0078], 'KMSP': [44.8848, -93.2223],
  'KDTW': [42.2124, -83.3534], 'KLAS': [36.0840, -115.1537], 'KSAN': [32.7336, -117.1897],
  'KSNA': [33.6757, -117.8682], 'KSJC': [37.3639, -121.9289], 'KOAK': [37.7213, -122.2208],
  'KSMF': [38.6954, -121.5908], 'KPDX': [45.5898, -122.5951], 'KMCO': [28.4312, -81.3081],
  'KFLL': [26.0742, -80.1506], 'KTPA': [27.9755, -82.5332], 'KIAD': [38.9531, -77.4565],
  'KDCA': [38.8521, -77.0377], 'KBWI': [39.1754, -76.6684], 'KEWR': [40.6895, -74.1745],
  'KLGA': [40.7769, -73.8740], 'KPHL': [39.8721, -75.2408], 'KCLT': [35.2140, -80.9431],
  'KPAO': [37.4611, -122.1150], 'KSQL': [37.5112, -122.2499], 'KRHV': [37.3326, -121.8192],
  'KLVK': [37.6934, -121.8203], 'KCCR': [37.9897, -122.0569], 'KHAF': [37.5134, -122.5011],
  'KSLC': [40.7884, -111.9778], 'KABQ': [35.0402, -106.6093], 'KAUS': [30.1975, -97.6664],
  'KSAT': [29.5337, -98.4698], 'KIAH': [29.9844, -95.3414], 'KHOU': [29.6454, -95.2789],
  'KMSY': [29.9934, -90.2580], 'KBNA': [36.1263, -86.6774], 'KMEM': [35.0424, -89.9767],
  'KSTL': [38.7487, -90.3700], 'KMCI': [39.2976, -94.7139], 'KPIT': [40.4915, -80.2329],
  'KCLE': [41.4117, -81.8498], 'KIND': [39.7173, -86.2944], 'KCMH': [39.9980, -82.8919],
  'KRDU': [35.8776, -78.7875], 'KCOS': [38.8058, -104.7009], 'KONT': [34.0560, -117.6012],
  'KBUR': [34.2007, -118.3585], 'KVNY': [34.2098, -118.4899], 'KSMO': [34.0158, -118.4513],
};

const DISTANCE_THRESHOLD_NM = 5; // Re-fetch when position moves 5+ nm from last fetch
const MIN_REFRESH_INTERVAL_MS = 120_000; // At most once every 2 minutes

function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // earth radius in nm
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestAirports(lat: number, lon: number, count = 3): Array<{ icao: string; distance: number }> {
  const results: Array<{ icao: string; distance: number }> = [];
  for (const [icao, [aLat, aLon]] of Object.entries(AIRPORT_COORDS)) {
    results.push({ icao, distance: haversineNm(lat, lon, aLat, aLon) });
  }
  results.sort((a, b) => a.distance - b.distance);
  return results.slice(0, count);
}

export function useAutoWeatherRefresh() {
  const { gpsPosition, isGPSTracking } = useAppContext();
  const [nearestWeather, setNearestWeather] = useState<NearestAirportWeather[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const lastFetchPos = useRef<{ lat: number; lon: number } | null>(null);
  const lastFetchTime = useRef(0);

  const fetchWeatherForAirports = useCallback(async (airports: Array<{ icao: string; distance: number }>) => {
    setIsRefreshing(true);
    try {
      const ids = airports.map(a => a.icao).join(',');
      const { data, error } = await supabase.functions.invoke('aviation-weather', {
        body: { stations: ids, type: 'metar' },
      });

      let tafData: any = null;
      try {
        const res = await supabase.functions.invoke('aviation-weather', {
          body: { stations: ids, type: 'taf' },
        });
        tafData = res.data;
      } catch { /* TAF optional */ }

      const results: NearestAirportWeather[] = airports.map(a => ({
        icao: a.icao,
        distance: Math.round(a.distance * 10) / 10,
        rawMetar: data?.[a.icao]?.raw || data?.raw || '',
        rawTaf: tafData?.[a.icao]?.raw || tafData?.raw || '',
        fetchedAt: Date.now(),
      }));

      setNearestWeather(results);
      lastFetchTime.current = Date.now();
    } catch (err) {
      console.error('Auto weather refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isGPSTracking || !gpsPosition) return;

    const now = Date.now();
    if (now - lastFetchTime.current < MIN_REFRESH_INTERVAL_MS) return;

    const { latitude: lat, longitude: lon } = gpsPosition;

    // Check if we've moved enough
    if (lastFetchPos.current) {
      const moved = haversineNm(lat, lon, lastFetchPos.current.lat, lastFetchPos.current.lon);
      if (moved < DISTANCE_THRESHOLD_NM) return;
    }

    lastFetchPos.current = { lat, lon };
    const nearest = findNearestAirports(lat, lon, 3);
    fetchWeatherForAirports(nearest);
  }, [gpsPosition, isGPSTracking, enabled, fetchWeatherForAirports]);

  return { nearestWeather, isRefreshing, enabled, setEnabled };
}
