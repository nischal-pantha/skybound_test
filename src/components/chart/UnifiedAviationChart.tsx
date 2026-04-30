import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plane,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
  Target,
  RotateCcw,
  Layers,
  Map as MapIcon,
  Compass,
  Mountain,
  Route,
  LocateFixed
} from 'lucide-react';
import { toast } from 'sonner';

interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: 'airport' | 'vor' | 'fix' | 'gps' | 'custom';
  notes?: string;
}

interface TrafficAircraft {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  altitude: number;
  heading: number;
  speed: number;
  type: string;
}

interface UnifiedAviationChartProps {
  waypoints?: Waypoint[];
  onWaypointAdd?: (waypoint: Waypoint) => void;
  onWaypointClick?: (waypoint: Waypoint) => void;
  onWaypointRemove?: (waypoint: Waypoint, index: number) => void;
  className?: string;
  showControls?: boolean;
  minHeight?: string;
}

// ArcGIS FAA Chart tile services - official FAA charts
const ARCGIS_BASE = 'https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services';

const CHART_TYPES = {
  sectional: {
    name: 'VFR Sectional',
    description: 'Standard VFR navigation chart',
    url: `${ARCGIS_BASE}/VFR_Sectional/MapServer/tile/{z}/{y}/{x}`,
    icon: MapIcon,
    category: 'VFR',
    tms: false,
    maxZoom: 14, // Increased to allow more detail
    minNativeZoom: 10, // Force scaling from level 10 down to level 1
    attribution: 'Charts © FAA / ArcGIS'
  },
  terminal: {
    name: 'Terminal Area',
    description: 'Detailed terminal area charts',
    url: `${ARCGIS_BASE}/VFR_Terminal/MapServer/tile/{z}/{y}/{x}`,
    icon: Plane,
    category: 'VFR',
    tms: false,
    maxZoom: 16,
    minNativeZoom: 12, // Terminals are very detailed, start scaling from 12
    attribution: 'Charts © FAA / ArcGIS'
  },
  enroute_low: {
    name: 'IFR Low Enroute',
    description: 'Low altitude IFR airways',
    url: `${ARCGIS_BASE}/IFR_AreaLow/MapServer/tile/{z}/{y}/{x}`,
    icon: Route,
    category: 'IFR',
    tms: false,
    maxZoom: 12,
    minNativeZoom: 8,
    attribution: 'Charts © FAA / ArcGIS'
  },
  enroute_high: {
    name: 'IFR High Enroute',
    description: 'High altitude IFR airways',
    url: `${ARCGIS_BASE}/IFR_High/MapServer/tile/{z}/{y}/{x}`,
    icon: Mountain,
    category: 'IFR',
    tms: false,
    maxZoom: 12,
    minNativeZoom: 8,
    attribution: 'Charts © FAA / ArcGIS'
  },
  world_nav: {
    name: 'World Navigation',
    description: 'Esri World Navigation Charts',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Specialty/World_Navigation_Charts/MapServer/tile/{z}/{y}/{x}',
    icon: Compass,
    category: 'VFR',
    tms: false,
    maxZoom: 10,
    minNativeZoom: 1,
    attribution: 'Charts © Esri'
  }
} as const;

type ChartTypeKey = keyof typeof CHART_TYPES;

export const UnifiedAviationChart: React.FC<UnifiedAviationChartProps> = ({
  waypoints = [],
  onWaypointAdd,
  onWaypointClick,
  onWaypointRemove,
  className = '',
  showControls = true,
  minHeight = '500px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const chartLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [chartType, setChartType] = useState<ChartTypeKey>('sectional');
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [pendingWaypoint, setPendingWaypoint] = useState<{ lat: number; lng: number } | null>(null);
  const [waypointIdentifier, setWaypointIdentifier] = useState('');
  const [showLabels, setShowLabels] = useState(true);
  const [showRoute, setShowRoute] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [chartOpacity, setChartOpacity] = useState(0.85);
  const [locating, setLocating] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [traffic, setTraffic] = useState<TrafficAircraft[]>([]);
  const trafficMarkersRef = useRef<Map<string, L.Marker>>(new Map());

  const currentChart = useMemo(() => CHART_TYPES[chartType], [chartType]);

  const getInitialView = useCallback((): { center: L.LatLngExpression; zoom: number } => {
    if (waypoints.length > 0) {
      const avgLat = waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length;
      const avgLng = waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length;
      return { center: [avgLat, avgLng], zoom: 8 };
    }
    return { center: [37.7749, -122.4194], zoom: 8 }; // Start in Bay Area at zoom 8
  }, [waypoints]);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    
    if (routeLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  }, []);

  const createWaypointIcon = useCallback((index: number, type: Waypoint['type']) => {
    const colors: Record<Waypoint['type'], string> = {
      airport: 'hsl(214, 100%, 50%)',
      vor: 'hsl(280, 70%, 50%)',
      fix: 'hsl(142, 76%, 40%)',
      gps: 'hsl(25, 95%, 53%)',
      custom: 'hsl(0, 84%, 55%)'
    };

    const color = colors[type] || colors.custom;

    return L.divIcon({
      className: 'unified-waypoint-marker',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 3px solid white;
          background: ${color};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: transform 0.2s ease;
        ">${index + 1}</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, []);

  const renderMarkers = useCallback(() => {
    if (!mapRef.current) return;

    clearMarkers();

    waypoints.forEach((wp, index) => {
      if (!mapRef.current) return;

      const marker = L.marker([wp.lat, wp.lng], { 
        icon: createWaypointIcon(index, wp.type) 
      });

      if (showLabels) {
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = `
          <div style="padding: 8px; min-width: 120px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${wp.identifier}</div>
            <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">${wp.type}</div>
            <div style="font-size: 11px; color: #888;">
              ${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°
            </div>
            ${wp.notes ? `<div style="font-size: 11px; margin-top: 4px; color: #555;">${wp.notes}</div>` : ''}
            ${onWaypointRemove ? `<button class="remove-wp-btn" style="margin-top: 8px; background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; width: 100%;">Remove from Route</button>` : ''}
          </div>
        `;
        
        const btn = popupDiv.querySelector('.remove-wp-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            if (onWaypointRemove) onWaypointRemove(wp, index);
            marker.closePopup();
          });
        }
        
        marker.bindPopup(popupDiv);

        marker.bindTooltip(wp.identifier, {
          permanent: false,
          direction: 'top',
          offset: [0, -14],
          className: 'waypoint-tooltip'
        });
      }

      marker.on('click', () => onWaypointClick?.(wp));
      marker.addTo(mapRef.current);
      markersRef.current.push(marker);
    });

    // Draw route line between waypoints
    if (showRoute && waypoints.length > 1 && mapRef.current) {
      const latlngs: L.LatLngExpression[] = waypoints.map((w) => [w.lat, w.lng]);
      
      routeLayerRef.current = L.polyline(latlngs, {
        color: 'hsl(214, 100%, 50%)',
        weight: 3,
        dashArray: '8, 6',
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(mapRef.current);
    }
  }, [clearMarkers, waypoints, showLabels, showRoute, createWaypointIcon, onWaypointClick]);

  const addChartLayer = useCallback(() => {
    if (!mapRef.current) return;

    if (chartLayerRef.current) {
      mapRef.current.removeLayer(chartLayerRef.current);
    }

    chartLayerRef.current = L.tileLayer(currentChart.url, {
      tms: currentChart.tms,
      opacity: chartOpacity,
      attribution: currentChart.attribution,
      maxZoom: currentChart.maxZoom,
      minZoom: 1, // Allow extreme zoom out
      minNativeZoom: (currentChart as any).minNativeZoom || 1, // Use the per-layer minNativeZoom
      errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      zIndex: 10,
      bounds: [[20, -130], [55, -60]], // Roughly cover USA to prevent unnecessary requests
    }).addTo(mapRef.current);

    // Handle tile load errors gracefully
    chartLayerRef.current.on('tileerror', () => {
      // Silently ignore 404s for tiles outside the coverage area
    });
  }, [currentChart, chartOpacity, chartType]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const { center, zoom } = getInitialView();

    try {
      mapRef.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 2,
        maxZoom: 18,
      }).setView(center, zoom);

      // Minimal dark base layer that blends with chart overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        minZoom: 2,
      }).addTo(mapRef.current);

      addChartLayer();
      renderMarkers();

      // Custom attribution
      L.control.attribution({
        position: 'bottomright',
        prefix: false
      }).addAttribution('FAA Charts © ArcGIS | © OpenStreetMap').addTo(mapRef.current);

    } catch (e) {
      console.error('Chart map initialization failed:', e);
      toast.error('Failed to initialize chart');
    }

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainer.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      clearMarkers();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update chart layer when chartType or opacity changes
  useEffect(() => {
    if (mapRef.current) {
      addChartLayer();
    }
  }, [addChartLayer]);

  // Update markers when waypoints change
  useEffect(() => {
    if (mapRef.current) {
      renderMarkers();
    }
  }, [renderMarkers]);

  // Handle click for adding waypoints
  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.off('click');
    mapRef.current.on('click', (e) => {
      if (isAddingWaypoint && onWaypointAdd) {
        setPendingWaypoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
  }, [isAddingWaypoint, onWaypointAdd]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetView = () => {
    const { center, zoom } = getInitialView();
    mapRef.current?.flyTo(center, zoom);
  };

  // Real-time Traffic from OpenSky Network API
  useEffect(() => {
    if (!showTraffic || !mapRef.current) {
      trafficMarkersRef.current.forEach(m => m.remove());
      trafficMarkersRef.current.clear();
      return;
    }

    const fetchTraffic = async () => {
      try {
        // San Francisco Bay Area bounding box
        const lamin = 36.5;
        const lomin = -123.5;
        const lamax = 38.5;
        const lomax = -121.0;
        
        const response = await fetch(
          `https://opensky-network.org/api/states/all?lamin=${lamin}&lomin=${lomin}&lamax=${lamax}&lomax=${lomax}`
        );
        
        if (!response.ok) throw new Error('OpenSky API error');
        
        const data = await response.json();
        if (!data.states) return;

        const liveTraffic: TrafficAircraft[] = data.states.map((s: any) => ({
          id: s[0], // icao24
          callsign: (s[1] || 'UNK').trim(),
          lng: s[5],
          lat: s[6],
          altitude: s[7] ? s[7] * 3.281 : 0, // meters to feet
          speed: s[9] ? s[9] * 1.944 : 0, // m/s to knots
          heading: s[10] || 0, // true track
          type: 'Live', // OpenSky doesn't provide type in the states call
        })).filter((ac: TrafficAircraft) => ac.lat && ac.lng);

        setTraffic(liveTraffic);
      } catch (err) {
        console.error('Failed to fetch live traffic:', err);
        // Fallback to simulated traffic if API fails (rate limited or down)
        if (traffic.length === 0) {
          const fallbackTraffic: TrafficAircraft[] = [
            { id: 'sim-1', callsign: 'N12345', lat: 37.52, lng: -122.15, altitude: 4500, heading: 45, speed: 110, type: 'Sim' },
            { id: 'sim-2', callsign: 'UAL456', lat: 37.65, lng: -122.35, altitude: 12000, heading: 270, speed: 380, type: 'Sim' },
          ];
          setTraffic(fallbackTraffic);
        }
      }
    };

    fetchTraffic();
    const interval = setInterval(fetchTraffic, 10000); // Fetch every 10 seconds

    return () => clearInterval(interval);
  }, [showTraffic]);

  // Update Traffic Markers
  useEffect(() => {
    if (!mapRef.current || !showTraffic) return;

    traffic.forEach(ac => {
      let marker = trafficMarkersRef.current.get(ac.id);
      
      const trafficIcon = L.divIcon({
        className: 'traffic-marker',
        html: `
          <div style="position: relative; width: 40px; height: 40px; transform: rotate(${ac.heading}deg);">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="hsl(var(--primary))" stroke="white" stroke-width="1.5">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3-.5-4.5.5L13 7 4.8 5.2c-.3-.1-.6 0-.8.3l-.6.6c-.2.2-.2.5-.1.7l7.4 3.5-2.8 2.8-2.2-.6c-.3-.1-.6 0-.8.2l-.5.5c-.2.2-.2.5 0 .7l2.1 2.1.2 3.1c0 .3.2.5.5.5h.5c.2 0 .5-.1.6-.3l2.8-2.8 3.5 7.4c.1.2.4.3.7.1l.6-.6c.3-.2.4-.5.3-.8z"/>
            </svg>
          </div>
          <div style="position: absolute; top: 24px; left: 50%; transform: translateX(-50%); 
            background: rgba(0,0,0,0.7); color: white; padding: 1px 4px; border-radius: 3px; 
            font-size: 9px; font-weight: bold; white-space: nowrap; pointer-events: none; z-index: 1000;">
            ${ac.callsign}<br/>${Math.round(ac.altitude / 100)}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      if (marker) {
        marker.setLatLng([ac.lat, ac.lng]);
        marker.setIcon(trafficIcon);
      } else {
        marker = L.marker([ac.lat, ac.lng], { icon: trafficIcon, zIndexOffset: 500 })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="p-2">
              <div class="font-bold">${ac.callsign} (${ac.type})</div>
              <div class="text-xs text-muted-foreground">
                Altitude: ${Math.round(ac.altitude)} ft<br/>
                Speed: ${Math.round(ac.speed)} kts<br/>
                Heading: ${Math.round(ac.heading)}°
              </div>
            </div>
          `);
        trafficMarkersRef.current.set(ac.id, marker);
      }
    });

    // Cleanup old traffic
    const activeIds = new Set(traffic.map(ac => ac.id));
    trafficMarkersRef.current.forEach((m, id) => {
      if (!activeIds.has(id)) {
        m.remove();
        trafficMarkersRef.current.delete(id);
      }
    });
  }, [traffic, showTraffic]);

  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current) {
          mapRef.current.flyTo([latitude, longitude], 11, { duration: 1.8 });

          if (userMarkerRef.current) userMarkerRef.current.remove();

          const icon = L.divIcon({
            className: 'user-loc-marker',
            html: `<div style="
              width:16px; height:16px;
              background:#3b82f6;
              border:3px solid white;
              border-radius:50%;
              box-shadow:0 0 0 5px rgba(59,130,246,0.3);
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon, zIndexOffset: 1000 })
            .bindPopup(`<b>Your Location</b><br>${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`)
            .addTo(mapRef.current)
            .openPopup();
        }
        setLocating(false);
        toast.success('Centered on your location');
      },
      err => {
        toast.error(`Location error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleChartTypeChange = (value: string) => {
    setChartType(value as ChartTypeKey);
    toast.success(`Switched to ${CHART_TYPES[value as ChartTypeKey].name}`);
  };

  const panToWaypoint = (waypoint: Waypoint) => {
    mapRef.current?.flyTo([waypoint.lat, waypoint.lng], 10);
  };

  const confirmAddWaypoint = () => {
    if (!pendingWaypoint || !onWaypointAdd || !waypointIdentifier.trim()) {
      toast.error('Please enter a waypoint identifier');
      return;
    }

    onWaypointAdd({
      identifier: waypointIdentifier.toUpperCase(),
      lat: pendingWaypoint.lat,
      lng: pendingWaypoint.lng,
      type: 'custom',
    });

    setPendingWaypoint(null);
    setWaypointIdentifier('');
    setIsAddingWaypoint(false);
    toast.success(`Added waypoint ${waypointIdentifier.toUpperCase()}`);
  };

  const vfrCharts = Object.entries(CHART_TYPES).filter(([, v]) => v.category === 'VFR');
  const ifrCharts = Object.entries(CHART_TYPES).filter(([, v]) => v.category === 'IFR');

  return (
    <div className={`relative flex flex-col bg-card rounded-xl border shadow-lg overflow-hidden ${className}`}>
      {/* Integrated Header Controls */}
      {showControls && (
        <div className="p-3 border-b bg-muted/30 backdrop-blur-sm space-y-3">
          {/* Chart Type Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Layers className="h-4 w-4" />
              Chart Type
            </div>
            
            <Tabs value={chartType} onValueChange={handleChartTypeChange} className="flex-1">
              <TabsList className="h-8 bg-background/80">
                {vfrCharts.map(([key, chart]) => {
                  const Icon = chart.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="text-xs px-2 py-1 gap-1">
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{chart.name}</span>
                    </TabsTrigger>
                  );
                })}
                <Separator orientation="vertical" className="h-4 mx-1" />
                {ifrCharts.map(([key, chart]) => {
                  const Icon = chart.icon;
                  return (
                    <TabsTrigger key={key} value={key} className="text-xs px-2 py-1 gap-1">
                      <Icon className="h-3 w-3" />
                      <span className="hidden sm:inline">{chart.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <Badge variant="outline" className="text-xs">
              {currentChart.category}
            </Badge>
          </div>

          {/* Secondary Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-labels"
                  checked={showLabels}
                  onCheckedChange={setShowLabels}
                  className="scale-75"
                />
                <Label htmlFor="show-labels" className="text-xs cursor-pointer">Labels</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="show-route"
                  checked={showRoute}
                  onCheckedChange={setShowRoute}
                  className="scale-75"
                />
                <Label htmlFor="show-route" className="text-xs cursor-pointer">Route</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="show-traffic"
                  checked={showTraffic}
                  onCheckedChange={setShowTraffic}
                  className="scale-75"
                />
                <Label htmlFor="show-traffic" className="text-xs cursor-pointer">Traffic</Label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onWaypointAdd && (
                <Button
                  variant={isAddingWaypoint ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setIsAddingWaypoint(!isAddingWaypoint);
                    if (!isAddingWaypoint) toast.info('Click on chart to add waypoint');
                  }}
                  className="h-7 text-xs"
                >
                  <Target className="h-3 w-3 mr-1" />
                  {isAddingWaypoint ? 'Cancel' : 'Add Point'}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={goToMyLocation}
                disabled={locating}
                className="h-7 text-xs gap-1"
                title="Fly to your current GPS location"
              >
                <LocateFixed className={`h-3 w-3 ${locating ? 'animate-pulse text-blue-400' : ''}`} />
                {locating ? 'Locating…' : 'My Location'}
              </Button>

              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={handleZoomOut} className="h-7 w-7 p-0">
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleResetView} className="h-7 w-7 p-0">
                  <RotateCcw className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} className="h-7 w-7 p-0">
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adding waypoint indicator */}
      {isAddingWaypoint && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
          <Navigation className="h-4 w-4" />
          <span className="text-sm font-medium">Click on chart to place waypoint</span>
        </div>
      )}

      {/* Map Container - Seamless integration */}
      <div 
        ref={mapContainer} 
        className="flex-1 bg-muted"
        style={{ 
          minHeight,
          cursor: isAddingWaypoint ? 'crosshair' : 'grab'
        }}
      />

      {/* Chart Info Overlay */}
      <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 z-[1000]">
        <div className="flex items-center gap-2">
          {React.createElement(currentChart.icon, { className: 'h-4 w-4 text-primary' })}
          <div>
            <div className="text-xs font-medium">{currentChart.name}</div>
            <div className="text-[10px] text-muted-foreground">{currentChart.description}</div>
          </div>
        </div>
      </div>

      {/* Waypoints Summary */}
      {waypoints.length > 0 && (
        <div className="absolute bottom-3 right-3 bg-background/90 backdrop-blur-sm border rounded-lg p-2 z-[1000] max-w-[200px]">
          <div className="text-xs font-medium mb-1 flex items-center gap-1">
            <Route className="h-3 w-3" />
            Route ({waypoints.length} pts)
          </div>
          <ScrollArea className="max-h-24">
            <div className="flex flex-wrap gap-1">
              {waypoints.map((wp, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => panToWaypoint(wp)}
                >
                  {i + 1}. {wp.identifier}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Add Waypoint Dialog */}
      <Dialog
        open={!!pendingWaypoint}
        onOpenChange={() => {
          setPendingWaypoint(null);
          setWaypointIdentifier('');
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Add Waypoint
            </DialogTitle>
            <DialogDescription>
              Enter an identifier for this waypoint location.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="waypoint-id">Waypoint Identifier</Label>
              <Input
                id="waypoint-id"
                placeholder="e.g., FIX01, WP1, CUSTOM"
                value={waypointIdentifier}
                onChange={(e) => setWaypointIdentifier(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAddWaypoint();
                }}
                autoFocus
                className="font-mono uppercase"
              />
            </div>
            {pendingWaypoint && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <div className="flex justify-between">
                  <span>Latitude:</span>
                  <span className="font-mono">{pendingWaypoint.lat.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between">
                  <span>Longitude:</span>
                  <span className="font-mono">{pendingWaypoint.lng.toFixed(6)}°</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingWaypoint(null);
                setWaypointIdentifier('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmAddWaypoint}>
              <MapPin className="h-4 w-4 mr-2" />
              Add Waypoint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom styles for tooltips */}
      <style>{`
        .waypoint-tooltip {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 500;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .waypoint-tooltip::before {
          border-top-color: hsl(var(--border));
        }
        .unified-waypoint-marker:hover > div {
          transform: scale(1.1);
        }
        .user-loc-marker {
          background: none !important;
          border: none !important;
        }
        @keyframes pulse-loc {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.35); }
          50%       { box-shadow: 0 0 0 10px rgba(59,130,246,0.1); }
        }
        .user-loc-marker > div {
          animation: pulse-loc 2s ease-in-out infinite;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-control-attribution {
          background: hsl(var(--background) / 0.9) !important;
          font-size: 10px !important;
          padding: 2px 6px !important;
          border-radius: 4px 0 0 0 !important;
        }
      `}</style>
    </div>
  );
};

export default UnifiedAviationChart;
