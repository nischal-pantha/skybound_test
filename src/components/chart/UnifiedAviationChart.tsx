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
  Map,
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

interface UnifiedAviationChartProps {
  waypoints?: Waypoint[];
  onWaypointAdd?: (waypoint: Waypoint) => void;
  onWaypointClick?: (waypoint: Waypoint) => void;
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
    icon: Map,
    category: 'VFR',
    tms: false,
    maxZoom: 12,
    attribution: 'Charts © FAA / ArcGIS'
  },
  terminal: {
    name: 'Terminal Area',
    description: 'Detailed terminal area charts',
    url: `${ARCGIS_BASE}/VFR_Terminal/MapServer/tile/{z}/{y}/{x}`,
    icon: Plane,
    category: 'VFR',
    tms: false,
    maxZoom: 14,
    attribution: 'Charts © FAA / ArcGIS'
  },
  enroute_low: {
    name: 'IFR Low Enroute',
    description: 'Low altitude IFR airways',
    url: `${ARCGIS_BASE}/IFR_AreaLow/MapServer/tile/{z}/{y}/{x}`,
    icon: Route,
    category: 'IFR',
    tms: false,
    maxZoom: 11,
    attribution: 'Charts © FAA / ArcGIS'
  },
  enroute_high: {
    name: 'IFR High Enroute',
    description: 'High altitude IFR airways',
    url: `${ARCGIS_BASE}/IFR_High/MapServer/tile/{z}/{y}/{x}`,
    icon: Mountain,
    category: 'IFR',
    tms: false,
    maxZoom: 11,
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
    attribution: 'Charts © Esri'
  }
} as const;

type ChartTypeKey = keyof typeof CHART_TYPES;

export const UnifiedAviationChart: React.FC<UnifiedAviationChartProps> = ({
  waypoints = [],
  onWaypointAdd,
  onWaypointClick,
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
  const [chartOpacity, setChartOpacity] = useState(0.85);
  const [locating, setLocating] = useState(false);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const currentChart = useMemo(() => CHART_TYPES[chartType], [chartType]);

  const getInitialView = useCallback((): { center: L.LatLngExpression; zoom: number } => {
    if (waypoints.length > 0) {
      const avgLat = waypoints.reduce((sum, w) => sum + w.lat, 0) / waypoints.length;
      const avgLng = waypoints.reduce((sum, w) => sum + w.lng, 0) / waypoints.length;
      return { center: [avgLat, avgLng], zoom: 8 };
    }
    return { center: [39.8283, -98.5795], zoom: 5 }; // Center of US
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
        marker.bindPopup(`
          <div style="padding: 8px; min-width: 120px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${wp.identifier}</div>
            <div style="font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 4px;">${wp.type}</div>
            <div style="font-size: 11px; color: #888;">
              ${wp.lat.toFixed(4)}°, ${wp.lng.toFixed(4)}°
            </div>
            ${wp.notes ? `<div style="font-size: 11px; margin-top: 4px; color: #555;">${wp.notes}</div>` : ''}
          </div>
        `);

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
      minZoom: 4,
      errorTileUrl: '', // Suppress error tiles
    }).addTo(mapRef.current);

    // Handle tile load errors gracefully
    chartLayerRef.current.on('tileerror', (error) => {
      console.warn('Chart tile load error:', error);
    });
  }, [currentChart, chartOpacity]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const { center, zoom } = getInitialView();

    try {
      mapRef.current = L.map(mapContainer.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(center, zoom);

      // Minimal dark base layer that blends with chart overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
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

    return () => {
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
