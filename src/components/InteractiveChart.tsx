import React, { useState, useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  ZoomIn, 
  ZoomOut, 
  Crosshair,
  RotateCcw,
  Plane,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChartProps {
  waypoints: Array<{
    identifier: string;
    lat: number;
    lng: number;
    type: 'airport' | 'vor' | 'fix' | 'custom';
    notes?: string;
  }>;
  navPoints: Array<{
    identifier: string;
    name: string;
    lat: number;
    lng: number;
    type: 'airport' | 'vor' | 'fix';
    frequency?: string;
  }>;
  onWaypointClick?: (waypoint: any) => void;
  onChartClick?: (lat: number, lng: number) => void;
  isAddingWaypoint?: boolean;
  weatherOverlay?: boolean;
  showAirspace?: boolean;
}

// ArcGIS FAA Chart tile services (official FAA charts, no API key)
const ARCGIS_BASE = 'https://tiles.arcgis.com/tiles/ssFJjBXIUyZDrSYZ/arcgis/rest/services';

const CHART_SOURCES = {
  sectional: {
    name: 'VFR Sectional',
    url: `${ARCGIS_BASE}/VFR_Sectional/MapServer/tile/{z}/{y}/{x}`,
  },
  terminal: {
    name: 'VFR Terminal Area',
    url: `${ARCGIS_BASE}/VFR_Terminal/MapServer/tile/{z}/{y}/{x}`,
  },
  enroute_low: {
    name: 'IFR Low Enroute',
    url: `${ARCGIS_BASE}/IFR_AreaLow/MapServer/tile/{z}/{y}/{x}`,
  },
  enroute_high: {
    name: 'IFR High Enroute',
    url: `${ARCGIS_BASE}/IFR_High/MapServer/tile/{z}/{y}/{x}`,
  },
};

export default function InteractiveChart({
  waypoints,
  navPoints,
  onWaypointClick,
  onChartClick,
  isAddingWaypoint = false,
}: ChartProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const chartLayer = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  
  const [chartType, setChartType] = useState<keyof typeof CHART_SOURCES>('sectional');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const { toast } = useToast();

  // Create custom icons
  const createNavIcon = (type: string) => {
    let bgColor = '#006600';
    let size = 8;
    
    if (type === 'airport') {
      bgColor = '#0066cc';
      size = 12;
    } else if (type === 'vor') {
      bgColor = '#cc0066';
      size = 10;
    }
    
    return L.divIcon({
      className: 'nav-marker',
      html: `<div style="
        background-color: ${bgColor};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const createWaypointIcon = (index: number) => {
    return L.divIcon({
      className: 'waypoint-marker',
      html: `<div style="
        background-color: #ff0066;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
        color: white;
      ">${index + 1}</div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  // Add aviation chart layer
  const addChartLayer = useCallback(() => {
    if (!map.current) return;

    // Remove existing chart layer
    if (chartLayer.current) {
      map.current.removeLayer(chartLayer.current);
    }

    const chartSource = CHART_SOURCES[chartType];

    // ArcGIS uses standard XYZ tiles
    chartLayer.current = L.tileLayer(chartSource.url, {
      tms: false,
      opacity: 0.85,
      attribution: '© FAA / ArcGIS',
      maxZoom: 12,
      minZoom: 4,
    }).addTo(map.current);

    console.log('[Chart] Added aviation chart layer:', chartType);
  }, [chartType]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    if (routeLayerRef.current && map.current) {
      map.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
  }, []);

  // Add waypoint and nav point markers
  const addMarkers = useCallback(() => {
    if (!map.current) return;

    clearMarkers();

    // Add nav point markers
    navPoints.forEach((point) => {
      if (!map.current) return;

      const marker = L.marker([point.lat, point.lng], { 
        icon: createNavIcon(point.type) 
      })
        .bindPopup(`
          <div class="p-2">
            <div class="font-semibold text-sm">${point.identifier}</div>
            <div class="text-xs text-gray-600">${point.name}</div>
            ${point.frequency ? `<div class="text-xs text-blue-600">${point.frequency}</div>` : ''}
          </div>
        `)
        .addTo(map.current);

      marker.on('click', () => onWaypointClick?.(point));
      markersRef.current.push(marker);
    });

    // Add waypoint markers
    waypoints.forEach((waypoint, index) => {
      if (!map.current) return;

      const marker = L.marker([waypoint.lat, waypoint.lng], { 
        icon: createWaypointIcon(index) 
      })
        .bindPopup(`
          <div class="p-2">
            <div class="font-semibold text-sm">${waypoint.identifier}</div>
            <div class="text-xs text-gray-600">${waypoint.type}</div>
            ${waypoint.notes ? `<div class="text-xs mt-1">${waypoint.notes}</div>` : ''}
          </div>
        `)
        .addTo(map.current);

      marker.on('click', () => onWaypointClick?.(waypoint));
      markersRef.current.push(marker);
    });

    // Draw route line between waypoints
    if (waypoints.length > 1 && map.current) {
      const latlngs: L.LatLngExpression[] = waypoints.map(wp => [wp.lat, wp.lng]);
      
      routeLayerRef.current = L.polyline(latlngs, {
        color: '#ff0066',
        weight: 3,
        dashArray: '10, 5',
        opacity: 0.9,
      }).addTo(map.current);
    }
  }, [navPoints, waypoints, onWaypointClick, clearMarkers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Calculate center from waypoints or use default (center of US)
      let centerLng = -98.5795;
      let centerLat = 39.8283;
      let zoom = 5;

      if (waypoints.length > 0) {
        centerLng = waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length;
        centerLat = waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length;
        zoom = 7;
      } else if (navPoints.length > 0) {
        centerLng = navPoints.reduce((sum, np) => sum + np.lng, 0) / navPoints.length;
        centerLat = navPoints.reduce((sum, np) => sum + np.lat, 0) / navPoints.length;
        zoom = 7;
      }

      map.current = L.map(mapContainer.current).setView([centerLat, centerLng], zoom);

      // Add OpenStreetMap base layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add chart layer on top
      addChartLayer();
      addMarkers();

      // Handle click for adding waypoints
      map.current.on('click', (e) => {
        if (isAddingWaypoint && onChartClick) {
          onChartClick(e.latlng.lat, e.latlng.lng);
        }
      });

      setIsMapLoaded(true);

      toast({
        title: "Chart Loaded",
        description: "Aviation chart map initialized",
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      toast({
        title: "Map Error",
        description: "Failed to initialize map",
        variant: "destructive",
      });
    }

    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsMapLoaded(false);
    };
  }, []);

  // Update chart layer when chart type changes
  useEffect(() => {
    if (isMapLoaded && map.current) {
      addChartLayer();
    }
  }, [chartType, addChartLayer, isMapLoaded]);

  // Update markers when waypoints or navPoints change
  useEffect(() => {
    if (isMapLoaded && map.current) {
      addMarkers();
    }
  }, [waypoints, navPoints, addMarkers, isMapLoaded]);

  const handleZoomIn = () => {
    map.current?.zoomIn();
  };

  const handleZoomOut = () => {
    map.current?.zoomOut();
  };

  const handleResetView = () => {
    if (!map.current) return;
    
    let centerLng = -98.5795;
    let centerLat = 39.8283;

    if (waypoints.length > 0) {
      centerLng = waypoints.reduce((sum, wp) => sum + wp.lng, 0) / waypoints.length;
      centerLat = waypoints.reduce((sum, wp) => sum + wp.lat, 0) / waypoints.length;
    }

    map.current.flyTo([centerLat, centerLng], 7);
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Chart Type Selection */}
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <Label htmlFor="chartType" className="text-sm font-medium">Chart:</Label>
              <Select
                value={chartType}
                onValueChange={(value) => setChartType(value as keyof typeof CHART_SOURCES)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sectional">VFR Sectional</SelectItem>
                  <SelectItem value="terminal">VFR Terminal Area</SelectItem>
                  <SelectItem value="enroute_low">IFR Low Enroute</SelectItem>
                  <SelectItem value="enroute_high">IFR High Enroute</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetView}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-2">
              {isAddingWaypoint && (
                <Badge variant="secondary" className="animate-pulse">
                  <Crosshair className="h-3 w-3 mr-1" />
                  Click to Add Waypoint
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Plane className="h-3 w-3" />
                FAA Charts
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviation Chart Map */}
      <Card className="border-0 bg-card/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-0 relative overflow-hidden">
          <div className="relative w-full h-[600px]">
            <div 
              ref={mapContainer} 
              className="absolute inset-0 rounded-lg" 
              style={{ cursor: isAddingWaypoint ? 'crosshair' : 'grab' }}
            />
            
            {/* Chart Info Overlay */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 z-[1000]">
              <div className="text-sm font-medium">
                {CHART_SOURCES[chartType].name}
              </div>
              <div className="text-xs text-muted-foreground">
                Source: FAA / ArcGIS
              </div>
            </div>

            {/* Waypoints Summary */}
            {waypoints.length > 0 && (
              <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm border rounded-lg p-3 z-[1000]">
                <div className="text-xs font-semibold mb-1">Route ({waypoints.length} waypoints)</div>
                <div className="flex gap-1 flex-wrap max-w-xs">
                  {waypoints.map((wp, i) => (
                    <span key={i} className="text-xs bg-primary/10 px-1 rounded">
                      {wp.identifier}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
