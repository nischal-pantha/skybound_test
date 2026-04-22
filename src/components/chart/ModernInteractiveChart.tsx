import React, { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { 
  Plane, 
  Navigation, 
  MapPin, 
  Compass, 
  Target, 
  Zap,
  Info,
  Move,
  ZoomIn,
  ZoomOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps";
  altitude?: number;
  notes?: string;
}

interface NavPoint {
  identifier: string;
  name: string;
  lat: number;
  lng: number;
  type: 'airport' | 'vor' | 'fix';
}

interface ModernInteractiveChartProps {
  isAddingWaypoint: boolean;
  zoomLevel: number;
  selectedWaypoints: Waypoint[];
  navDatabase: NavPoint[];
  onChartClick: (lat: number, lng: number) => void;
  onNavPointClick: (point: NavPoint) => void;
  onWaypointRemove: (index: number) => void;
  onZoomChange?: (zoom: number) => void;
}

const ModernInteractiveChart: React.FC<ModernInteractiveChartProps> = ({
  isAddingWaypoint,
  zoomLevel,
  selectedWaypoints,
  navDatabase,
  onChartClick,
  onNavPointClick,
  onWaypointRemove,
  onZoomChange
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [chartOffset, setChartOffset] = useState({ x: 0, y: 0 });
  const [isRealTime, setIsRealTime] = useState(true);

  // Enhanced coordinate system for professional accuracy
  const CHART_BOUNDS = {
    north: 38.5,
    south: 36.5,
    east: -121.0,
    west: -123.5
  };

  // Optimized coordinate conversion with caching
  const coordsToChart = useCallback((lat: number, lng: number) => {
    if (!chartRef.current) return { x: 0, y: 0 };
    
    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width;
    const chartHeight = rect.height;
    
    const x = ((lng - CHART_BOUNDS.west) / (CHART_BOUNDS.east - CHART_BOUNDS.west)) * chartWidth * zoomLevel + chartOffset.x;
    const y = ((CHART_BOUNDS.north - lat) / (CHART_BOUNDS.north - CHART_BOUNDS.south)) * chartHeight * zoomLevel + chartOffset.y;
    
    return { x, y };
  }, [zoomLevel, chartOffset]);

  const chartToCoords = useCallback((x: number, y: number) => {
    if (!chartRef.current) return { lat: 0, lng: 0 };
    
    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width;
    const chartHeight = rect.height;
    
    const lng = CHART_BOUNDS.west + ((x - chartOffset.x) / (chartWidth * zoomLevel)) * (CHART_BOUNDS.east - CHART_BOUNDS.west);
    const lat = CHART_BOUNDS.north - ((y - chartOffset.y) / (chartHeight * zoomLevel)) * (CHART_BOUNDS.north - CHART_BOUNDS.south);
    
    return { lat, lng };
  }, [zoomLevel, chartOffset]);

  // Advanced flight calculations
  const calculateDistance = useCallback((point1: Waypoint, point2: Waypoint) => {
    const R = 3440.065;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const calculateBearing = useCallback((point1: Waypoint, point2: Waypoint) => {
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let brng = Math.atan2(y, x) * 180 / Math.PI;
    brng = (brng + 360) % 360;
    
    const magneticBearing = (brng + 14) % 360;
    return magneticBearing;
  }, []);

  // Optimized route calculations
  const routeStats = useMemo(() => {
    if (selectedWaypoints.length < 2) return null;
    
    let totalDistance = 0;
    const legs = [];
    
    for (let i = 1; i < selectedWaypoints.length; i++) {
      const prev = selectedWaypoints[i - 1];
      const curr = selectedWaypoints[i];
      const distance = calculateDistance(prev, curr);
      const bearing = calculateBearing(prev, curr);
      
      totalDistance += distance;
      legs.push({ distance, bearing, from: prev, to: curr });
    }
    
    const estimatedTime = (totalDistance / 120) * 60; // 120 kts groundspeed
    
    return { totalDistance, estimatedTime, legs };
  }, [selectedWaypoints, calculateDistance, calculateBearing]);

  // Enhanced interaction handlers
  const handleChartClick = useCallback((event: React.MouseEvent) => {
    if (isPanning || !isAddingWaypoint || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const coords = chartToCoords(x, y);
    
    if (coords.lat >= CHART_BOUNDS.south && coords.lat <= CHART_BOUNDS.north &&
        coords.lng >= CHART_BOUNDS.west && coords.lng <= CHART_BOUNDS.east) {
      onChartClick(coords.lat, coords.lng);
    }
  }, [isAddingWaypoint, isPanning, chartToCoords, onChartClick]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosition({ x, y });
    setShowCoordinates(true);

    if (isPanning) {
      const deltaX = x - panStart.x;
      const deltaY = y - panStart.y;
      setChartOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setPanStart({ x, y });
    }
  }, [isPanning, panStart]);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isAddingWaypoint) return;
    
    setIsPanning(true);
    setPanStart({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
  }, [isAddingWaypoint]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setShowCoordinates(false);
    setIsPanning(false);
  }, []);

  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(0.5, Math.min(3.0, zoomLevel + delta));
    onZoomChange?.(newZoom);
  }, [zoomLevel, onZoomChange]);

  return (
    <Card className="shadow-lg border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Chart Header */}
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Navigation className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">San Francisco Bay Area VFR Sectional</h3>
                <p className="text-sm text-muted-foreground">Professional Training Environment</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Real-time Indicator */}
              <Badge variant={isRealTime ? "default" : "secondary"} className="gap-1">
                <Zap className="w-3 h-3" />
                {isRealTime ? 'Live' : 'Static'}
              </Badge>
              
              {/* Route Stats */}
              {routeStats && (
                <div className="text-xs text-muted-foreground font-mono">
                  {routeStats.totalDistance.toFixed(1)} NM • {Math.round(routeStats.estimatedTime)} min
                </div>
              )}
              
              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleZoom(-0.2)}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-3 h-3" />
                </Button>
                <div className="text-xs font-mono min-w-[3rem] text-center">
                  {(zoomLevel * 100).toFixed(0)}%
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleZoom(0.2)}
                  disabled={zoomLevel >= 3.0}
                >
                  <ZoomIn className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Chart */}
        <div 
          ref={chartRef}
          className="relative overflow-hidden bg-gradient-to-br from-blue-50/30 via-green-50/20 to-yellow-50/30 dark:from-blue-950/30 dark:via-green-950/20 dark:to-yellow-950/30"
          style={{ 
            height: 'min(75vh, 800px)', 
            minHeight: '500px',
            width: '100%',
            cursor: isAddingWaypoint ? 'crosshair' : isPanning ? 'grabbing' : 'grab'
          }}
          onClick={handleChartClick}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          {/* Professional Chart Background */}
          <div className="absolute inset-0">
            <svg width="100%" height="100%" className="opacity-20">
              <defs>
                <pattern id="professionalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect width="50" height="50" fill="transparent" />
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="hsl(var(--chart-grid))" strokeWidth="0.5"/>
                  <circle cx="12.5" cy="12.5" r="0.5" fill="hsl(var(--chart-grid))" opacity="0.5" />
                  <circle cx="37.5" cy="25" r="0.3" fill="hsl(var(--chart-grid))" opacity="0.3" />
                </pattern>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
                  <stop offset="50%" stopColor="hsl(var(--success))" stopOpacity="0.03" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="url(#professionalGrid)" />
              <rect width="100%" height="100%" fill="url(#chartGradient)" />
            </svg>
          </div>

          {/* Navigation Points - Enhanced */}
          {navDatabase.map((point) => {
            const pos = coordsToChart(point.lat, point.lng);
            const isVisible = pos.x >= -50 && pos.x <= (chartRef.current?.clientWidth || 800) + 50 &&
                             pos.y >= -50 && pos.y <= (chartRef.current?.clientHeight || 600) + 50;
            
            if (!isVisible) return null;

            const iconSize = point.type === 'airport' ? 14 : point.type === 'vor' ? 12 : 10;
            const containerSize = point.type === 'airport' ? 28 : point.type === 'vor' ? 24 : 20;

            return (
              <div key={point.identifier}>
                <div
                  className={`absolute rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-125 shadow-lg border-2 border-background ${
                    point.type === 'airport' 
                      ? 'bg-chart-airport hover:bg-chart-airport/80' 
                      : point.type === 'vor'
                      ? 'bg-chart-vor hover:bg-chart-vor/80'
                      : 'bg-chart-fix hover:bg-chart-fix/80'
                  }`}
                  style={{
                    left: Math.max(-containerSize/2, Math.min(pos.x - containerSize/2, (chartRef.current?.clientWidth || 800) - containerSize/2)),
                    top: Math.max(-containerSize/2, Math.min(pos.y - containerSize/2, (chartRef.current?.clientHeight || 600) - containerSize/2)),
                    width: containerSize,
                    height: containerSize,
                    transform: `scale(${Math.min(zoomLevel * 0.8 + 0.4, 1.8)})`,
                    zIndex: 10
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavPointClick(point);
                  }}
                  title={`${point.identifier} - ${point.name} (${point.type.toUpperCase()})`}
                >
                  {point.type === 'airport' ? (
                    <Plane className="w-4 h-4 text-white" />
                  ) : point.type === 'vor' ? (
                    <Navigation className="w-3 h-3 text-white" />
                  ) : (
                    <MapPin className="w-3 h-3 text-white" />
                  )}
                </div>
                
                {/* Enhanced Labels */}
                <div
                  className="absolute bg-background/90 backdrop-blur-sm text-foreground px-2 py-1 rounded text-xs font-medium shadow-sm pointer-events-none border border-border/50"
                  style={{
                    left: pos.x + containerSize/2 + 5,
                    top: pos.y - containerSize/2 - 5,
                    zIndex: 11,
                    transform: `scale(${Math.min(zoomLevel * 0.7 + 0.5, 1.2)})`
                  }}
                >
                  <div className="font-bold">{point.identifier}</div>
                  <div className="text-muted-foreground text-[10px]">{point.type.toUpperCase()}</div>
                </div>
              </div>
            );
          })}

          {/* Route Waypoints - Enhanced */}
          {selectedWaypoints.map((waypoint, index) => {
            const pos = coordsToChart(waypoint.lat, waypoint.lng);
            return (
              <div key={`${waypoint.identifier}-${index}`}>
                <div
                  className="absolute w-10 h-10 bg-chart-route rounded-full flex items-center justify-center cursor-pointer hover:bg-chart-route/80 transition-all duration-200 shadow-lg border-2 border-background hover:scale-110"
                  style={{
                    left: Math.max(-20, Math.min(pos.x - 20, (chartRef.current?.clientWidth || 800) - 20)),
                    top: Math.max(-20, Math.min(pos.y - 20, (chartRef.current?.clientHeight || 600) - 20)),
                    transform: `scale(${Math.min(zoomLevel * 0.8 + 0.4, 1.6)})`,
                    zIndex: 20
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onWaypointRemove(index);
                  }}
                  title={`Waypoint ${index + 1}: ${waypoint.identifier} - Click to remove`}
                >
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>

                <div
                  className="absolute bg-chart-route/90 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium shadow-sm pointer-events-none"
                  style={{
                    left: pos.x + 25,
                    top: pos.y - 15,
                    zIndex: 21
                  }}
                >
                  {waypoint.identifier}
                </div>
              </div>
            );
          })}

          {/* Enhanced Flight Path */}
          {routeStats && routeStats.legs.length > 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {routeStats.legs.map((leg, index) => {
                const pos1 = coordsToChart(leg.from.lat, leg.from.lng);
                const pos2 = coordsToChart(leg.to.lat, leg.to.lng);
                
                const midX = (pos1.x + pos2.x) / 2;
                const midY = (pos1.y + pos2.y) / 2;
                
                return (
                  <g key={index}>
                    <line
                      x1={pos1.x}
                      y1={pos1.y}
                      x2={pos2.x}
                      y2={pos2.y}
                      stroke="hsl(var(--chart-route))"
                      strokeWidth="4"
                      strokeDasharray="15,8"
                      opacity="0.9"
                      markerEnd="url(#arrowhead)"
                    />
                    
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-35"
                        y="-18"
                        width="70"
                        height="36"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--border))"
                        strokeWidth="1"
                        rx="8"
                        opacity="0.95"
                        className="shadow-sm"
                      />
                      <text
                        textAnchor="middle"
                        dy="-3"
                        className="text-xs font-bold fill-current"
                      >
                        {leg.distance.toFixed(1)} NM
                      </text>
                      <text
                        textAnchor="middle"
                        dy="12"
                        className="text-xs fill-current opacity-80"
                      >
                        {leg.bearing.toFixed(0)}°M
                      </text>
                    </g>
                  </g>
                );
              })}
              
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="12"
                  markerHeight="8"
                  refX="10"
                  refY="4"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 12 4, 0 8"
                    fill="hsl(var(--chart-route))"
                  />
                </marker>
              </defs>
            </svg>
          )}

          {/* Enhanced Mouse Coordinates */}
          {showCoordinates && !isPanning && (
            <div
              className="absolute bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg px-3 py-2 text-xs font-mono pointer-events-none z-30 shadow-lg"
              style={{
                left: Math.min(mousePosition.x + 15, (chartRef.current?.clientWidth || 800) - 140),
                top: Math.max(mousePosition.y - 50, 10)
              }}
            >
              {(() => {
                const coords = chartToCoords(mousePosition.x, mousePosition.y);
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Lat:</span>
                      <span>{coords.lat.toFixed(4)}°N</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Lng:</span>
                      <span>{Math.abs(coords.lng).toFixed(4)}°W</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Professional Compass Rose */}
          <div className="absolute top-4 right-4 w-24 h-24 opacity-80">
            <div className="relative w-full h-full bg-background/90 backdrop-blur-sm rounded-full border-2 border-primary/20 shadow-lg p-2">
              <Compass className="w-full h-full text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-primary mt-1">N</span>
              </div>
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                <span className="text-xs text-muted-foreground">14°E</span>
              </div>
            </div>
          </div>

          {/* Add Waypoint Instructions */}
          {isAddingWaypoint && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-warning/90 backdrop-blur-sm border-2 border-warning rounded-xl p-6 shadow-xl z-40 animate-fade-in">
              <div className="text-center space-y-3">
                <Target className="w-12 h-12 mx-auto text-warning-foreground" />
                <h3 className="text-warning-foreground font-bold text-lg">Add Waypoint</h3>
                <p className="text-warning-foreground/90 text-sm max-w-xs">
                  Click anywhere on the chart to add a waypoint to your flight plan
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-warning-foreground/80">
                  <Move className="w-3 h-3" />
                  <span>Pan disabled while adding waypoints</span>
                </div>
              </div>
            </div>
          )}

          {/* No Route Message */}
          {selectedWaypoints.length === 0 && !isAddingWaypoint && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center space-y-3 opacity-60">
              <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-muted-foreground font-medium">No flight plan active</p>
                <p className="text-sm text-muted-foreground/70">Start planning your route</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModernInteractiveChart;