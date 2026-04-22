import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Plane, MapPin, Navigation, Layers, Shield, AlertTriangle, Map, Locate, LocateFixed, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { useGPSLocation } from '@/hooks/useGPSLocation';
import { useAviationMap, type ChartType, type BaseMapStyle, type Waypoint } from '@/hooks/useAviationMap';

interface AviationChartMapProps {
  waypoints?: Waypoint[];
  onWaypointAdd?: (waypoint: Waypoint) => void;
  showWeather?: boolean;
}

export default function AviationChartMap({ 
  waypoints = [], 
  onWaypointAdd,
}: AviationChartMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const {
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
  } = useAviationMap();

  // GPS
  const { position: gpsPosition, isTracking, isAvailable, startTracking, stopTracking, getCurrentPosition } = useGPSLocation();
  const [showGPS, setShowGPS] = useState(false);
  const [followGPS, setFollowGPS] = useState(false);

  // Chart state
  const [chartType, setChartType] = useState<ChartType>('sectional');
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('streets');
  const [chartOpacity, setChartOpacityState] = useState(0.8);

  // Overlays
  const [showAirspace, setShowAirspace] = useState(true);
  const [showClassB, setShowClassB] = useState(true);
  const [showClassC, setShowClassC] = useState(true);
  const [showClassD, setShowClassD] = useState(true);
  const [showTFRs, setShowTFRs] = useState(true);
  const [showAirports, setShowAirports] = useState(true);

  // Waypoint mode
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    try {
      const map = initMap(mapContainer.current, [39.5, -98.35], 4);
      setBaseLayer(baseMapStyle);
      setChartLayer(chartType, chartOpacity);
      renderAirspace(showAirspace, showClassB, showClassC, showClassD);
      renderTFRs(showTFRs);
      renderAirports(showAirports);

      map.on('click', (e) => {
        if (isAddingWaypoint && onWaypointAdd) {
          const newWaypoint: Waypoint = {
            identifier: `WP${waypoints.length + 1}`,
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            type: 'custom',
            notes: 'Custom waypoint',
          };
          onWaypointAdd(newWaypoint);
          setIsAddingWaypoint(false);
          toast.success('Waypoint added');
        }
      });
    } catch (e) {
      console.error('Map init failed:', e);
      toast.error('Failed to load map');
    }

    return cleanup;
  }, []);

  // Update layers
  useEffect(() => { setBaseLayer(baseMapStyle); }, [baseMapStyle, setBaseLayer]);
  useEffect(() => { setChartLayer(chartType, chartOpacity); }, [chartType, chartOpacity, setChartLayer]);
  useEffect(() => { setChartOpacity(chartOpacity); }, [chartOpacity, setChartOpacity]);
  useEffect(() => { renderAirspace(showAirspace, showClassB, showClassC, showClassD); }, [showAirspace, showClassB, showClassC, showClassD, renderAirspace]);
  useEffect(() => { renderTFRs(showTFRs); }, [showTFRs, renderTFRs]);
  useEffect(() => { renderAirports(showAirports); }, [showAirports, renderAirports]);
  useEffect(() => { renderWaypoints(waypoints); }, [waypoints, renderWaypoints]);

  // GPS
  useEffect(() => {
    if (showGPS && isAvailable) startTracking();
    else stopTracking();
  }, [showGPS, isAvailable, startTracking, stopTracking]);

  useEffect(() => {
    updateGPSMarker(showGPS ? gpsPosition : null, followGPS);
  }, [showGPS, gpsPosition, followGPS, updateGPSMarker]);

  // Click handler update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off('click');
    map.on('click', (e) => {
      if (isAddingWaypoint && onWaypointAdd) {
        onWaypointAdd({
          identifier: `WP${waypoints.length + 1}`,
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          type: 'custom',
        });
        setIsAddingWaypoint(false);
        toast.success('Waypoint added');
      }
    });
  }, [isAddingWaypoint, onWaypointAdd, waypoints.length, mapRef]);

  const handleLocateMe = async () => {
    if (!isAvailable) { toast.error('GPS not available'); return; }
    try {
      const pos = await getCurrentPosition();
      flyTo(pos.latitude, pos.longitude, 11);
      setShowGPS(true);
      toast.success('Located');
    } catch { toast.error('Could not get location'); }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Plane className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="hidden xs:inline">Aviation Charts</span>
            <span className="xs:hidden">Charts</span>
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] sm:text-xs">Live</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 px-3 sm:px-6">
        {/* Controls - Responsive Grid */}
        <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 items-end">
          <div className="col-span-1 sm:flex-1 sm:min-w-[130px]">
            <Label className="text-[10px] sm:text-xs mb-1 block">Chart Type</Label>
            <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sectional">VFR Sectional</SelectItem>
                <SelectItem value="ifr-low">IFR Low</SelectItem>
                <SelectItem value="ifr-high">IFR High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 sm:flex-1 sm:min-w-[100px]">
            <Label className="text-[10px] sm:text-xs mb-1 flex items-center gap-1"><Map className="h-3 w-3" />Base</Label>
            <Select value={baseMapStyle} onValueChange={(v) => setBaseMapStyle(v as BaseMapStyle)}>
              <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="streets">Streets</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:flex-1 sm:min-w-[120px] sm:max-w-[160px]">
            <Label className="text-[10px] sm:text-xs mb-1"><Layers className="h-3 w-3 inline mr-1" />Opacity: {Math.round(chartOpacity * 100)}%</Label>
            <Slider value={[chartOpacity]} onValueChange={([v]) => setChartOpacityState(v)} min={0} max={1} step={0.05} className="mt-1" />
          </div>

          <div className="flex gap-1 col-span-2 sm:col-span-1 justify-center sm:justify-start">
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={zoomOut}><ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={zoomIn}><ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
            <Button variant={isAddingWaypoint ? 'default' : 'outline'} size="sm" onClick={() => setIsAddingWaypoint(!isAddingWaypoint)} className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3">
              <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">{isAddingWaypoint ? 'Cancel' : 'Add WP'}</span>
            </Button>
          </div>
        </div>

        {/* Overlay toggles - Scrollable on mobile */}
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg border text-xs sm:text-sm min-w-max">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
              <span className="hidden sm:inline">Airspace</span>
              <Switch checked={showAirspace} onCheckedChange={setShowAirspace} className="scale-90 sm:scale-100" />
            </div>
            {showAirspace && (
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
                <label className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-blue-500" />B<Switch checked={showClassB} onCheckedChange={setShowClassB} className="scale-[0.65] sm:scale-75" /></label>
                <label className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-purple-500" />C<Switch checked={showClassC} onCheckedChange={setShowClassC} className="scale-[0.65] sm:scale-75" /></label>
                <label className="flex items-center gap-0.5"><div className="w-2 h-2 rounded-full bg-cyan-500" />D<Switch checked={showClassD} onCheckedChange={setShowClassD} className="scale-[0.65] sm:scale-75" /></label>
              </div>
            )}

            <div className="w-px h-3 sm:h-4 bg-border" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              <span className="hidden sm:inline">TFRs</span>
              <Switch checked={showTFRs} onCheckedChange={setShowTFRs} className="scale-90 sm:scale-100" />
            </div>

            <div className="w-px h-3 sm:h-4 bg-border" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              <Plane className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Airports</span>
              <Switch checked={showAirports} onCheckedChange={setShowAirports} className="scale-90 sm:scale-100" />
            </div>

            <div className="w-px h-3 sm:h-4 bg-border" />

            <div className="flex items-center gap-1.5 sm:gap-2">
              {isTracking ? <LocateFixed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 animate-pulse" /> : <Locate className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">GPS</span>
              <Switch checked={showGPS} onCheckedChange={setShowGPS} disabled={!isAvailable} className="scale-90 sm:scale-100" />
            </div>
            {showGPS && (
              <>
                <label className="flex items-center gap-1 text-[10px] sm:text-xs"><span className="text-muted-foreground hidden sm:inline">Follow</span><Switch checked={followGPS} onCheckedChange={setFollowGPS} className="scale-[0.65] sm:scale-75" /></label>
                <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={handleLocateMe}><Locate className="h-3 w-3 sm:h-3.5 sm:w-3.5" /></Button>
              </>
            )}
          </div>
        </div>

        {isAddingWaypoint && (
          <div className="bg-primary/10 p-2 sm:p-3 rounded-lg border border-primary/20 flex items-center gap-2 text-xs sm:text-sm">
            <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Tap map to add waypoint
          </div>
        )}

        {/* Map - Responsive height */}
        <div className="relative w-full h-[300px] sm:h-[400px] md:h-[450px] lg:h-[550px] rounded-lg sm:rounded-xl border shadow-lg overflow-hidden bg-muted/30">
          <div ref={mapContainer} className="absolute inset-0" style={{ cursor: isAddingWaypoint ? 'crosshair' : 'grab' }} />

          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-background/90 backdrop-blur px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs border z-[1000] flex items-center gap-1.5 sm:gap-2">
            <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
            <span className="font-medium">{chartType === 'sectional' ? 'VFR' : chartType === 'ifr-low' ? 'IFR-L' : 'IFR-H'}</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground capitalize hidden sm:inline">{baseMapStyle}</span>
          </div>

          {showGPS && gpsPosition && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-background/90 backdrop-blur px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs border z-[1000]">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 font-medium">
                <LocateFixed className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 animate-pulse" />
                <span className="hidden sm:inline">GPS Active</span>
                <span className="sm:hidden">GPS</span>
              </div>
              <div className="space-y-0.5 text-muted-foreground font-mono text-[9px] sm:text-xs">
                <div>{gpsPosition.latitude.toFixed(4)}°N</div>
                <div>{gpsPosition.longitude.toFixed(4)}°W</div>
                {gpsPosition.altitude && <div className="hidden sm:block">{Math.round(gpsPosition.altitude * 3.281)} ft</div>}
                {gpsPosition.speed && <div className="hidden sm:block">{Math.round(gpsPosition.speed * 1.944)} kts</div>}
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-background/90 backdrop-blur px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg text-[10px] sm:text-xs border z-[1000]">
            <div className="flex items-center gap-2 sm:gap-3">
              {showAirspace && <div className="flex items-center gap-1"><Shield className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span className="hidden sm:inline">Airspace</span></div>}
              {showTFRs && <div className="flex items-center gap-1 text-red-500"><AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span className="hidden sm:inline">TFRs</span></div>}
              {showAirports && <div className="flex items-center gap-1"><Plane className="h-2.5 w-2.5 sm:h-3 sm:w-3" /><span className="hidden sm:inline">Airports</span></div>}
            </div>
          </div>
        </div>

        {waypoints.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[10px] sm:text-xs">Route ({waypoints.length} waypoints)</Label>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {waypoints.map((wp, i) => (
                <Button key={`${wp.identifier}-${i}`} variant="outline" size="sm" onClick={() => flyTo(wp.lat, wp.lng, 10)} className="h-6 sm:h-7 text-[10px] sm:text-xs px-2">
                  {i + 1}. {wp.identifier}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
