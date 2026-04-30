import { useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { AIRSPACE_DATA, AIRSPACE_COLORS, nmToMeters } from '@/data/airspaceData';
import { TFR_DATA, TFR_COLORS } from '@/data/tfrData';
import { AIRPORT_DATA, getAirportIcon, type Airport } from '@/data/airportData';
import type { GPSPosition } from '@/hooks/useGPSLocation';

export type ChartType = 'sectional' | 'ifr-low' | 'ifr-high' | 'openaip' | 'openflightmaps';
export type BaseMapStyle = 'streets' | 'satellite' | 'terrain';

export interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: 'airport' | 'vor' | 'fix' | 'gps' | 'custom';
  notes?: string;
}

const ARCGIS_BASE = 'https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services';

export const CHART_URLS: Record<ChartType, string> = {
  sectional: `${ARCGIS_BASE}/VFR_Sectional/MapServer/tile/{z}/{y}/{x}`,
  'ifr-low': `${ARCGIS_BASE}/IFR_AreaLow/MapServer/tile/{z}/{y}/{x}`,
  'ifr-high': `${ARCGIS_BASE}/IFR_High/MapServer/tile/{z}/{y}/{x}`,
  'openaip': 'https://{s}.api.tiles.openaip.net/api/data/openaip/{z}/{x}/{y}.png?apiKey=',
  'openflightmaps': 'https://nwy-tiles-api.prod.newaydata.com/tiles/{z}/{x}/{y}.png?path=latest/aero/latest',
};

export const BASE_MAP_URLS: Record<BaseMapStyle, { url: string; attribution: string }> = {
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap',
  },
};

export const useAviationMap = () => {
  const mapRef = useRef<L.Map | null>(null);
  const baseLayerRef = useRef<L.TileLayer | null>(null);
  const chartLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const airspaceLayersRef = useRef<L.LayerGroup | null>(null);
  const tfrLayersRef = useRef<L.LayerGroup | null>(null);
  const airportLayersRef = useRef<L.LayerGroup | null>(null);
  const gpsMarkerRef = useRef<L.Marker | null>(null);
  const gpsAccuracyRef = useRef<L.Circle | null>(null);

  const initMap = useCallback((container: HTMLDivElement, center: L.LatLngExpression = [39.5, -98.35], zoom = 5) => {
    if (mapRef.current) return mapRef.current;

    const map = L.map(container, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    });

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    (map as any)._resizeObserver = resizeObserver;

    mapRef.current = map;
    return map;
  }, []);

  const setBaseLayer = useCallback((style: BaseMapStyle) => {
    if (!mapRef.current) return;

    if (baseLayerRef.current) {
      mapRef.current.removeLayer(baseLayerRef.current);
    }

    const config = BASE_MAP_URLS[style];
    baseLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(mapRef.current);
  }, []);

  const setChartLayer = useCallback((type: ChartType, opacity: number, apiKey?: string) => {
    if (!mapRef.current) return;

    if (chartLayerRef.current) {
      mapRef.current.removeLayer(chartLayerRef.current);
    }

    let url = CHART_URLS[type];
    if (type === 'openaip' && apiKey) {
      url += apiKey;
    }

    chartLayerRef.current = L.tileLayer(url, {
      opacity,
      attribution: type === 'openaip' ? '© OpenAIP' : type === 'openflightmaps' ? '© OpenFlightMaps' : 'Charts: FAA © ArcGIS',
      maxZoom: 12,
      minZoom: 4,
    }).addTo(mapRef.current);
  }, []);

  const setChartOpacity = useCallback((opacity: number) => {
    if (chartLayerRef.current) {
      chartLayerRef.current.setOpacity(opacity);
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  }, []);

  const createWaypointIcon = (index: number) => {
    return L.divIcon({
      className: 'waypoint-marker',
      html: `<div style="
        width: 24px; height: 24px; border-radius: 50%;
        background: hsl(var(--primary)); color: white;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      ">${index + 1}</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  const renderWaypoints = useCallback((waypoints: Waypoint[]) => {
    if (!mapRef.current) return;
    clearMarkers();

    waypoints.forEach((wp, i) => {
      const marker = L.marker([wp.lat, wp.lng], { icon: createWaypointIcon(i) })
        .bindPopup(`<div class="p-2"><strong>${wp.identifier}</strong><br/><small>${wp.type.toUpperCase()}</small></div>`)
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    if (waypoints.length > 1) {
      const latlngs: L.LatLngExpression[] = waypoints.map(w => [w.lat, w.lng]);
      routeLayerRef.current = L.polyline(latlngs, {
        color: 'hsl(var(--primary))',
        weight: 3,
        dashArray: '8, 6',
        opacity: 0.9,
      }).addTo(mapRef.current!);
    }
  }, [clearMarkers]);

  const renderAirspace = useCallback((show: boolean, showB: boolean, showC: boolean, showD: boolean) => {
    if (!mapRef.current) return;

    if (!airspaceLayersRef.current) {
      airspaceLayersRef.current = L.layerGroup().addTo(mapRef.current);
    }
    airspaceLayersRef.current.clearLayers();

    if (!show) return;

    AIRSPACE_DATA.forEach(zone => {
      if (zone.type === 'B' && !showB) return;
      if (zone.type === 'C' && !showC) return;
      if (zone.type === 'D' && !showD) return;

      const colors = AIRSPACE_COLORS[zone.type];

      zone.rings.forEach((ring, idx) => {
        const circle = L.circle(zone.center, {
          radius: nmToMeters(ring.radius),
          fillColor: colors.stroke,
          fillOpacity: 0.1,
          color: colors.stroke,
          weight: colors.strokeWidth,
          dashArray: colors.dashArray,
        });
        if (idx === 0) {
          circle.bindPopup(`<div class="p-2"><strong>${zone.name}</strong><br/>Class ${zone.type}<br/>Floor: ${zone.floor === 0 ? 'SFC' : zone.floor + ' ft'}<br/>Ceiling: ${zone.ceiling} ft</div>`);
        }
        circle.addTo(airspaceLayersRef.current!);
      });
    });
  }, []);

  const renderTFRs = useCallback((show: boolean) => {
    if (!mapRef.current) return;

    if (!tfrLayersRef.current) {
      tfrLayersRef.current = L.layerGroup().addTo(mapRef.current);
    }
    tfrLayersRef.current.clearLayers();

    if (!show) return;

    TFR_DATA.filter(t => t.isActive).forEach(tfr => {
      const colors = TFR_COLORS[tfr.type];
      const circle = L.circle(tfr.center, {
        radius: nmToMeters(tfr.radius),
        fillColor: colors.stroke,
        fillOpacity: 0.2,
        color: colors.stroke,
        weight: 3,
        dashArray: '6, 4',
      });
      circle.bindPopup(`<div class="p-2"><strong class="text-red-600">${tfr.name}</strong><br/>${tfr.description}<br/>NOTAM: ${tfr.notamNumber}</div>`);
      circle.addTo(tfrLayersRef.current!);
    });
  }, []);

  const renderAirports = useCallback((show: boolean) => {
    if (!mapRef.current) return;

    if (!airportLayersRef.current) {
      airportLayersRef.current = L.layerGroup().addTo(mapRef.current);
    }
    airportLayersRef.current.clearLayers();

    if (!show) return;

    AIRPORT_DATA.forEach(airport => {
      const size = airport.type === 'large' ? 26 : airport.type === 'medium' ? 22 : 18;
      const icon = L.divIcon({
        className: 'airport-marker',
        html: `<div style="
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${airport.type === 'large' ? 'hsl(var(--primary))' : airport.type === 'medium' ? '#3b82f6' : '#64748b'};
          color: white; display: flex; align-items: center; justify-content: center;
          font-size: ${size * 0.5}px; border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">${getAirportIcon(airport.type)}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker(airport.coordinates, { icon });
      marker.bindPopup(createAirportPopup(airport), { maxWidth: 320 });
      marker.addTo(airportLayersRef.current!);
    });
  }, []);

  const createAirportPopup = (airport: Airport): string => {
    const runways = airport.runways.map(r => `${r.designation}: ${r.length}'×${r.width}' ${r.surface}`).join('<br/>');
    const freqs = airport.frequencies.slice(0, 4).map(f => `${f.name}: ${f.frequency}`).join('<br/>');
    return `
      <div class="p-2 max-w-[300px]">
        <strong class="text-base">${airport.icao}</strong> ${airport.name}<br/>
        <small class="text-muted-foreground">${airport.city}, ${airport.state} • Elev: ${airport.elevation}' MSL</small>
        <hr class="my-2 border-border"/>
        <div class="text-xs"><strong>Runways:</strong><br/>${runways}</div>
        <hr class="my-2 border-border"/>
        <div class="text-xs"><strong>Frequencies:</strong><br/>${freqs}</div>
      </div>
    `;
  };

  const createGPSIcon = (heading: number | null) => {
    const rotation = heading ?? 0;
    return L.divIcon({
      className: 'gps-marker',
      html: `
        <div style="width: 44px; height: 44px; position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%;
            background: radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%);
            animation: gps-pulse 2s ease-out infinite;"></div>
          <div style="width: 32px; height: 32px; background: #22c55e; border-radius: 50%;
            border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            transform: rotate(${rotation}deg); transition: transform 0.3s;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
              <path d="M12 2L4 14h6v8l8-12h-6V2z"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  };

  const updateGPSMarker = useCallback((position: GPSPosition | null, follow: boolean) => {
    if (!mapRef.current) return;

    // Clear existing GPS markers
    if (gpsMarkerRef.current) {
      mapRef.current.removeLayer(gpsMarkerRef.current);
      gpsMarkerRef.current = null;
    }
    if (gpsAccuracyRef.current) {
      mapRef.current.removeLayer(gpsAccuracyRef.current);
      gpsAccuracyRef.current = null;
    }

    if (!position) return;

    // Accuracy circle
    gpsAccuracyRef.current = L.circle([position.latitude, position.longitude], {
      radius: position.accuracy,
      fillColor: '#22c55e',
      fillOpacity: 0.1,
      color: '#22c55e',
      weight: 1,
      dashArray: '4,4',
    }).addTo(mapRef.current);

    // Aircraft marker
    gpsMarkerRef.current = L.marker([position.latitude, position.longitude], {
      icon: createGPSIcon(position.heading),
      zIndexOffset: 1000,
    }).bindPopup(`
      <div class="p-2">
        <strong>Current Position</strong><br/>
        Lat: ${position.latitude.toFixed(5)}°<br/>
        Lng: ${position.longitude.toFixed(5)}°<br/>
        ${position.altitude ? `Alt: ${Math.round(position.altitude * 3.281)} ft<br/>` : ''}
        ${position.speed ? `GS: ${Math.round(position.speed * 1.944)} kts<br/>` : ''}
        Accuracy: ±${Math.round(position.accuracy)}m
      </div>
    `).addTo(mapRef.current);

    if (follow) {
      mapRef.current.setView([position.latitude, position.longitude], mapRef.current.getZoom());
    }
  }, []);

  const flyTo = useCallback((lat: number, lng: number, zoom?: number) => {
    mapRef.current?.flyTo([lat, lng], zoom ?? mapRef.current.getZoom());
  }, []);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  const cleanup = useCallback(() => {
    clearMarkers();
    if (mapRef.current) {
      if ((mapRef.current as any)._resizeObserver) {
        (mapRef.current as any)._resizeObserver.disconnect();
      }
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [clearMarkers]);

  return {
    mapRef,
    initMap,
    setBaseLayer,
    setChartLayer,
    setChartOpacity,
    renderWaypoints,
    renderAirspace,
    renderTFRs,
    renderAirports,
    updateGPSMarker,
    flyTo,
    zoomIn,
    zoomOut,
    cleanup,
  };
};
