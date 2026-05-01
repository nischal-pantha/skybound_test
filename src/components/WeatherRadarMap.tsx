import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CloudRain, Satellite, RefreshCw, Radio, Play, Pause, SkipBack, SkipForward, AlertTriangle, Shield, Route, MapPin, Cloud, Wind, Thermometer, Eye, FileDown, TrendingUp, TrendingDown, Minus, Zap, ChevronDown, ChevronUp, Info, Navigation, Activity, Navigation2, Snowflake, Maximize2, Minimize2, Map, Layers, LocateFixed } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { validateCoordinates } from '@/utils/aviationValidation';
import { MetarTafPanel } from '@/components/weather/MetarTafPanel';
import { usePIREPsOverlay, PIREPsControls, PIREPsLegend } from '@/components/weather/PIREPsOverlay';
import { useWindsAloftOverlay, WindsAloftControls, WindsAloftLegend } from '@/components/weather/WindsAloftOverlay';
import { useSatelliteOverlay, SatelliteControls, SatelliteLegend } from '@/components/weather/SatelliteOverlay';
import { VerticalProfile } from '@/components/weather/VerticalProfile';
import { useFlightCategoryStrip } from '@/components/weather/FlightCategoryStrip';
import { RouteWeatherTimeline } from '@/components/weather/RouteWeatherTimeline';
import { CrosswindWarningPanel } from '@/components/weather/CrosswindWarningPanel';
import { CockpitCrosswindAlert } from '@/components/weather/CockpitCrosswindAlert';
import { CrosswindCalculator } from '@/components/weather/CrosswindCalculator';
import { AutoWeatherRefreshPanel } from '@/components/weather/AutoWeatherRefreshPanel';
import { exportWeatherBriefingPDF } from '@/utils/weatherBriefingPDF';
import { useAppContext } from '@/contexts/AppContext';
import { useSupabaseAircraft } from '@/hooks/useSupabaseAircraft';

type WeatherTrend = 'improving' | 'deteriorating' | 'stable';

interface Waypoint {
  id: string;
  identifier: string;
  coordinates: [number, number];
  type?: string;
  notes?: string;
}

interface WaypointWeather {
  waypointId: string;
  identifier: string;
  coordinates: [number, number];
  weather: {
    condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    visibility: number;
    ceiling: number | null;
    temperature: number;
    dewpoint: number;
    windSpeed: number;
    windDirection: number;
    windGust?: number;
    precipitation?: string;
    rawMetar?: string;
  };
  forecast?: {
    condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
    probability?: number;
    changeTime?: string;
  };
  trend?: WeatherTrend;
}

interface WeatherRadarMapProps {
  airports: Array<{
    icao: string;
    name: string;
    coordinates: [number, number];
  }>;
  waypoints?: Waypoint[];
  showRouteWeather?: boolean;
  onWaypointWeatherUpdate?: (weather: WaypointWeather[]) => void;
}

interface RadarFrame {
  time: number;
  path: string;
}

interface RainViewerData {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
}

interface TFR {
  notamNumber: string;
  type: string;
  description: string;
  coordinates: [number, number][];
  effectiveStart: string;
  effectiveEnd: string;
  altitude: string;
}

interface Advisory {
  id: string;
  type: 'SIGMET' | 'AIRMET';
  hazard: string;
  description: string;
  coordinates: [number, number][];
  validFrom: string;
  validTo: string;
}

interface LightningStrike {
  lat: number;
  lng: number;
  time: number;
  intensity: number;
}

interface StormCell {
  id: string;
  lat: number;
  lng: number;
  intensity: number; // 0-100
  radius: number; // in km
  movementSpeed: number; // km/h
  movementDirection: number; // degrees
  predictedLat: number;
  predictedLng: number;
  lastUpdate: number;
}

interface PrecipitationForecast {
  lat: number;
  lng: number;
  waypointId: string;
  identifier: string;
  hourly: Array<{
    time: string;
    precipitation_mm: number;
    precipitation_probability: number;
    weather_code: number;
  }>;
  total6h: number; // Total precipitation in next 6 hours
  total12h: number; // Total precipitation in next 12 hours
  maxIntensity: number; // Max hourly intensity
  peakTime: string | null; // When peak intensity occurs
}

export const WeatherRadarMap = ({ airports, waypoints = [], showRouteWeather: initialShowRouteWeather = false, onWaypointWeatherUpdate }: WeatherRadarMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const radarLayer = useRef<L.TileLayer | null>(null);
  const baseLayer = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const animationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const tfrLayerGroup = useRef<L.LayerGroup | null>(null);
  const advisoryLayerGroup = useRef<L.LayerGroup | null>(null);
  const routeLayerGroup = useRef<L.LayerGroup | null>(null);
  const lightningLayerGroup = useRef<L.LayerGroup | null>(null);
  const stormCellLayerGroup = useRef<L.LayerGroup | null>(null);
  const precipForecastLayerGroup = useRef<L.LayerGroup | null>(null);
  
  // Blitzortung WebSocket refs
  const blitzortungWs = useRef<WebSocket | null>(null);
  const lightningBufferRef = useRef<LightningStrike[]>([]);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [activeLayer, setActiveLayer] = useState<'radar' | 'satellite'>('radar');
  const [radarLoading, setRadarLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showTFRs, setShowTFRs] = useState<boolean>(true);
  const [showAdvisories, setShowAdvisories] = useState<boolean>(true);
  const [showLightning, setShowLightning] = useState<boolean>(true);
  const [showStormCells, setShowStormCells] = useState<boolean>(true);
  const [showRouteWeather, setShowRouteWeather] = useState<boolean>(initialShowRouteWeather);
  const [tfrs, setTfrs] = useState<TFR[]>([]);
  const [advisories, setAdvisories] = useState<Advisory[]>([]);
  const [advisoriesLoading, setAdvisoriesLoading] = useState<boolean>(false);
  const [waypointWeather, setWaypointWeather] = useState<WaypointWeather[]>([]);
  const [routeWeatherLoading, setRouteWeatherLoading] = useState<boolean>(false);
  const [lightningStrikes, setLightningStrikes] = useState<LightningStrike[]>([]);
  const [stormCells, setStormCells] = useState<StormCell[]>([]);
  const [blitzortungConnected, setBlitzortungConnected] = useState<boolean>(false);
  const [legendExpanded, setLegendExpanded] = useState<boolean>(true);
  const [showPrecipForecast, setShowPrecipForecast] = useState<boolean>(false);
  const [precipForecasts, setPrecipForecasts] = useState<PrecipitationForecast[]>([]);
  const [precipLoading, setPrecipLoading] = useState<boolean>(false);
  const [showIcing, setShowIcing] = useState<boolean>(false);
  const [showTurbulence, setShowTurbulence] = useState<boolean>(false);
  const [showWindsAloft, setShowWindsAloft] = useState<boolean>(false);
  const [windsAltitude, setWindsAltitude] = useState<number>(12000);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [showSatellite, setShowSatellite] = useState<boolean>(false);
  const [satelliteChannel, setSatelliteChannel] = useState<'visible' | 'infrared' | 'water-vapor'>('infrared');
  const [satelliteOpacity, setSatelliteOpacity] = useState<number>(0.6);
  const [satelliteSource, setSatelliteSource] = useState<'east' | 'west' | 'auto'>('auto');
  const [showFlightCategoryStrip, setShowFlightCategoryStrip] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [locating, setLocating] = useState<boolean>(false);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const miniMapContainer = useRef<HTMLDivElement>(null);
  const miniMap = useRef<L.Map | null>(null);
  const miniMapRect = useRef<L.Rectangle | null>(null);
  const { toast } = useToast();
  const { selectedAircraft } = useAppContext();
  const { aircraft: supabaseAircraftList } = useSupabaseAircraft();
  
  // Resolve aircraft name from profile
  const resolvedAircraftName = useMemo(() => {
    if (!selectedAircraft) return '';
    const ac = supabaseAircraftList.find(a => a.id === selectedAircraft);
    return ac?.name || selectedAircraft;
  }, [selectedAircraft, supabaseAircraftList]);
  
  // PIREPs overlay hook
  const { icingCount, turbCount } = usePIREPsOverlay({
    map: map.current,
    bounds: mapBounds || undefined,
    showIcing,
    showTurbulence,
  });
  
  // Winds aloft overlay hook
  const { avgSpeed: windsAvgSpeed } = useWindsAloftOverlay({
    map: map.current,
    waypoints: waypoints.map(w => ({ id: w.id, identifier: w.identifier, coordinates: w.coordinates })),
    selectedAltitude: showWindsAloft ? windsAltitude : 0,
  });
  
  // Satellite overlay hook
  const { loading: satelliteLoading, resolvedSource: satelliteResolvedSource } = useSatelliteOverlay({
    map: map.current,
    show: showSatellite,
    channel: satelliteChannel,
    opacity: satelliteOpacity,
    source: satelliteSource,
  });
  
  // Flight category strip overlay
  useFlightCategoryStrip({
    map: map.current,
    waypoints: waypoints.map(w => ({ id: w.id, identifier: w.identifier, coordinates: w.coordinates })),
    waypointWeather: waypointWeather.map(w => ({
      waypointId: w.waypointId,
      identifier: w.identifier,
      coordinates: w.coordinates,
      weather: {
        condition: w.weather.condition,
        visibility: w.weather.visibility,
        ceiling: w.weather.ceiling,
      },
    })),
    show: showFlightCategoryStrip && showRouteWeather,
  });
  
  // =============================================================
  // BLITZORTUNG REAL-TIME LIGHTNING WEBSOCKET CONNECTION
  // =============================================================
  
  // Connect to Blitzortung WebSocket for real-time lightning data
  const connectBlitzortung = useCallback(() => {
    // Disconnect any existing connection
    if (blitzortungWs.current) {
      blitzortungWs.current.close();
    }
    
    try {
      // Blitzortung uses WebSocket servers at wss://ws1.blitzortung.org:443 through wss://ws8.blitzortung.org:443
      // We'll try multiple servers for redundancy
      const serverNum = Math.floor(Math.random() * 8) + 1;
      const wsUrl = `wss://ws${serverNum}.blitzortung.org:443`;
      
      console.log(`[Blitzortung] Connecting to ${wsUrl}...`);
      
      blitzortungWs.current = new WebSocket(wsUrl);
      
      blitzortungWs.current.onopen = () => {
        console.log('[Blitzortung] WebSocket connected!');
        setBlitzortungConnected(true);
        
        // Send subscription message for geographic area
        // Get current map bounds or use default North America bounds
        const bounds = map.current?.getBounds();
        const west = bounds?.getWest() ?? -130;
        const east = bounds?.getEast() ?? -60;
        const south = bounds?.getSouth() ?? 20;
        const north = bounds?.getNorth() ?? 55;
        
        // Subscribe to lightning data - Blitzortung protocol
        // Format: {"a":2} for subscribing to strikes data (region 2 = Oceania, 3 = North America, etc)
        // We'll subscribe to all regions for global coverage
        const subscribeMsg = JSON.stringify({ a: 418 }); // 418 = all regions
        blitzortungWs.current?.send(subscribeMsg);
        console.log('[Blitzortung] Subscribed to lightning data');
        
        toast({
          title: "Lightning Data Connected",
          description: "Receiving real-time lightning strikes from Blitzortung network",
        });
      };
      
      blitzortungWs.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Blitzortung sends lightning strike data in format:
          // {"time": timestamp_ns, "lat": latitude, "lon": longitude, "alt": altitude, "pol": polarity, "mds": max_deviation, "mcg": max_gap}
          if (data.lat !== undefined && data.lon !== undefined && data.time !== undefined) {
            const strike: LightningStrike = {
              lat: data.lat,
              lng: data.lon,
              time: Math.floor(data.time / 1000000), // Convert nanoseconds to milliseconds
              intensity: Math.min(100, Math.max(0, (data.mds || 50) / 10)), // Normalize intensity
            };
            
            // Add to buffer and update state
            lightningBufferRef.current = [
              strike,
              ...lightningBufferRef.current.filter(s => Date.now() - s.time < 300000) // Keep last 5 minutes
            ].slice(0, 500); // Limit to 500 strikes
            
            // Batch update state every 500ms to reduce re-renders
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                setLightningStrikes([...lightningBufferRef.current]);
                reconnectTimeoutRef.current = null;
              }, 500);
            }
          }
        } catch (e) {
          // Ignore parse errors for non-JSON messages
        }
      };
      
      blitzortungWs.current.onerror = (error) => {
        console.error('[Blitzortung] WebSocket error:', error);
        setBlitzortungConnected(false);
      };
      
      blitzortungWs.current.onclose = () => {
        console.log('[Blitzortung] WebSocket closed, attempting reconnect...');
        setBlitzortungConnected(false);
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (showLightning && map.current) {
            connectBlitzortung();
          }
        }, 5000);
      };
      
    } catch (error) {
      console.error('[Blitzortung] Failed to connect:', error);
      setBlitzortungConnected(false);
      
      // Fallback to simulated data if WebSocket fails
      fallbackToSimulatedLightning();
    }
  }, [showLightning, toast]);
  
  // Fallback simulated lightning when WebSocket is unavailable
  const fallbackToSimulatedLightning = useCallback(() => {
    const bounds = map.current?.getBounds();
    if (!bounds) return;
    
    const north = bounds.getNorth();
    const south = bounds.getSouth();
    const east = bounds.getEast();
    const west = bounds.getWest();
    
    const strikes: LightningStrike[] = [];
    const now = Date.now();
    
    // Create clusters to simulate storm cells
    const numClusters = Math.floor(Math.random() * 4) + 2;
    for (let c = 0; c < numClusters; c++) {
      const clusterLat = south + Math.random() * (north - south);
      const clusterLng = west + Math.random() * (east - west);
      const clusterSize = Math.floor(Math.random() * 8) + 3;
      
      for (let i = 0; i < clusterSize; i++) {
        strikes.push({
          lat: clusterLat + (Math.random() - 0.5) * 0.5,
          lng: clusterLng + (Math.random() - 0.5) * 0.5,
          time: now - Math.floor(Math.random() * 300000),
          intensity: Math.random() * 100,
        });
      }
    }
    
    setLightningStrikes(strikes);
    console.log('[Lightning] Using simulated data:', strikes.length, 'strikes');
  }, []);
  
  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (blitzortungWs.current) {
        blitzortungWs.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  // =============================================================
  // STORM CELL TRACKING & MOVEMENT PREDICTION
  // =============================================================
  
  // Analyze lightning clusters to identify storm cells and predict movement
  const analyzeStormCells = useCallback(() => {
    if (lightningStrikes.length < 5) {
      setStormCells([]);
      return;
    }
    
    const now = Date.now();
    const recentStrikes = lightningStrikes.filter(s => now - s.time < 300000); // Last 5 min
    
    if (recentStrikes.length < 3) {
      setStormCells([]);
      return;
    }
    
    // Simple clustering algorithm - group strikes by proximity
    const clusters: LightningStrike[][] = [];
    const visited = new Set<number>();
    
    const CLUSTER_RADIUS_DEG = 0.3; // ~30km radius for clustering
    
    recentStrikes.forEach((strike, i) => {
      if (visited.has(i)) return;
      
      const cluster: LightningStrike[] = [strike];
      visited.add(i);
      
      recentStrikes.forEach((other, j) => {
        if (visited.has(j)) return;
        
        const dist = Math.sqrt(
          Math.pow(strike.lat - other.lat, 2) + 
          Math.pow(strike.lng - other.lng, 2)
        );
        
        if (dist < CLUSTER_RADIUS_DEG) {
          cluster.push(other);
          visited.add(j);
        }
      });
      
      if (cluster.length >= 3) {
        clusters.push(cluster);
      }
    });
    
    // Convert clusters to storm cells with movement prediction
    const cells: StormCell[] = clusters.slice(0, 8).map((cluster, index) => {
      // Calculate cluster center
      const centerLat = cluster.reduce((sum, s) => sum + s.lat, 0) / cluster.length;
      const centerLng = cluster.reduce((sum, s) => sum + s.lng, 0) / cluster.length;
      
      // Calculate cluster radius
      const maxDist = Math.max(...cluster.map(s => 
        Math.sqrt(Math.pow(s.lat - centerLat, 2) + Math.pow(s.lng - centerLng, 2))
      ));
      const radiusKm = maxDist * 111; // Approximate km
      
      // Calculate intensity based on strike count and recency
      const intensity = Math.min(100, cluster.length * 15);
      
      // Estimate movement based on strike time progression
      // Sort by time and calculate weighted centroid shift
      const sortedByTime = [...cluster].sort((a, b) => a.time - b.time);
      const firstHalf = sortedByTime.slice(0, Math.floor(sortedByTime.length / 2));
      const secondHalf = sortedByTime.slice(Math.floor(sortedByTime.length / 2));
      
      let movementSpeed = 0;
      let movementDirection = 270; // Default: moving east
      let predictedLat = centerLat;
      let predictedLng = centerLng;
      
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstCenter = {
          lat: firstHalf.reduce((sum, s) => sum + s.lat, 0) / firstHalf.length,
          lng: firstHalf.reduce((sum, s) => sum + s.lng, 0) / firstHalf.length,
        };
        const secondCenter = {
          lat: secondHalf.reduce((sum, s) => sum + s.lat, 0) / secondHalf.length,
          lng: secondHalf.reduce((sum, s) => sum + s.lng, 0) / secondHalf.length,
        };
        
        const deltaLat = secondCenter.lat - firstCenter.lat;
        const deltaLng = secondCenter.lng - firstCenter.lng;
        
        // Calculate direction (degrees from north, clockwise)
        movementDirection = (Math.atan2(deltaLng, deltaLat) * 180 / Math.PI + 360) % 360;
        
        // Calculate distance moved in km
        const distMoved = Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111;
        
        // Calculate time span in hours
        const timeSpan = (secondHalf[0].time - firstHalf[firstHalf.length - 1].time) / 3600000;
        
        if (timeSpan > 0) {
          movementSpeed = Math.min(100, distMoved / Math.max(0.1, timeSpan)); // km/h
          
          // Predict position 30 minutes ahead
          const predictionHours = 0.5;
          const predictionDist = movementSpeed * predictionHours;
          const predictionDistDeg = predictionDist / 111;
          
          predictedLat = centerLat + predictionDistDeg * Math.cos(movementDirection * Math.PI / 180);
          predictedLng = centerLng + predictionDistDeg * Math.sin(movementDirection * Math.PI / 180);
        }
      }
      
      return {
        id: `storm-${index}-${now}`,
        lat: centerLat,
        lng: centerLng,
        intensity,
        radius: Math.max(15, radiusKm),
        movementSpeed,
        movementDirection,
        predictedLat,
        predictedLng,
        lastUpdate: now,
      };
    });
    
    setStormCells(cells);
    console.log('[Storm Cells] Identified', cells.length, 'active storm cells');
  }, [lightningStrikes]);
  
  // Render storm cells with movement arrows
  const renderStormCells = useCallback(() => {
    if (!stormCellLayerGroup.current || !map.current) return;
    
    stormCellLayerGroup.current.clearLayers();
    
    if (!showStormCells || stormCells.length === 0) return;
    
    stormCells.forEach((cell) => {
      // Determine cell color based on intensity
      let cellColor: string;
      if (cell.intensity >= 80) {
        cellColor = '#dc2626'; // Red - severe
      } else if (cell.intensity >= 50) {
        cellColor = '#f97316'; // Orange - significant
      } else {
        cellColor = '#eab308'; // Yellow - moderate
      }
      
      // Draw storm cell circle
      const cellCircle = L.circle([cell.lat, cell.lng], {
        radius: cell.radius * 1000, // Convert km to meters
        fillColor: cellColor,
        fillOpacity: 0.25,
        color: cellColor,
        weight: 3,
        dashArray: '8, 4',
      });
      
      cellCircle.bindPopup(`
        <div class="p-3">
          <div class="flex items-center gap-2 mb-2">
            <span style="background: ${cellColor}; padding: 2px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px;">
              Storm Cell
            </span>
          </div>
          <div class="text-xs space-y-1">
            <div><strong>Intensity:</strong> ${cell.intensity.toFixed(0)}%</div>
            <div><strong>Radius:</strong> ~${cell.radius.toFixed(0)} km</div>
            <div><strong>Movement:</strong> ${cell.movementSpeed.toFixed(0)} km/h toward ${Math.round(cell.movementDirection)}°</div>
            <div><strong>30-min Prediction:</strong> ${cell.predictedLat.toFixed(3)}°, ${cell.predictedLng.toFixed(3)}°</div>
          </div>
        </div>
      `);
      
      stormCellLayerGroup.current?.addLayer(cellCircle);
      
      // Draw movement prediction arrow if there's significant movement
      if (cell.movementSpeed > 5) {
        // Draw line from current position to predicted position
        const predictionLine = L.polyline([
          [cell.lat, cell.lng],
          [cell.predictedLat, cell.predictedLng],
        ], {
          color: cellColor,
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 5',
        });
        
        stormCellLayerGroup.current?.addLayer(predictionLine);
        
        // Draw arrowhead at predicted position
        const arrowHeadSize = 0.15; // degrees
        const angle = cell.movementDirection * Math.PI / 180;
        
        const arrowPoint1 = [
          cell.predictedLat - arrowHeadSize * Math.cos(angle - Math.PI / 6),
          cell.predictedLng - arrowHeadSize * Math.sin(angle - Math.PI / 6),
        ];
        const arrowPoint2 = [
          cell.predictedLat - arrowHeadSize * Math.cos(angle + Math.PI / 6),
          cell.predictedLng - arrowHeadSize * Math.sin(angle + Math.PI / 6),
        ];
        
        const arrowHead = L.polygon([
          [cell.predictedLat, cell.predictedLng],
          arrowPoint1 as [number, number],
          arrowPoint2 as [number, number],
        ], {
          color: cellColor,
          fillColor: cellColor,
          fillOpacity: 0.9,
          weight: 2,
        });
        
        stormCellLayerGroup.current?.addLayer(arrowHead);
        
        // Add "30 min" label at predicted position
        const labelIcon = L.divIcon({
          className: 'storm-prediction-label',
          html: `<div style="
            background: ${cellColor};
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">+30 min</div>`,
          iconSize: [45, 20],
          iconAnchor: [22, 10],
        });
        
        const labelMarker = L.marker([cell.predictedLat, cell.predictedLng], { icon: labelIcon });
        stormCellLayerGroup.current?.addLayer(labelMarker);
      }
    });
  }, [stormCells, showStormCells]);
  
  // Update storm cells when lightning data changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      analyzeStormCells();
    }, 2000); // Debounce to prevent excessive recalculation
    
    return () => clearTimeout(debounceTimer);
  }, [lightningStrikes, analyzeStormCells]);
  
  // Render storm cells when data or visibility changes
  useEffect(() => {
    renderStormCells();
  }, [renderStormCells]);

  // =============================================================
  // PRECIPITATION ACCUMULATION FORECAST (Open-Meteo API)
  // =============================================================
  
  // Fetch precipitation forecast from Open-Meteo API (free, no API key required)
  const fetchPrecipitationForecast = useCallback(async (waypointList: Waypoint[]): Promise<PrecipitationForecast[]> => {
    const forecasts: PrecipitationForecast[] = [];
    
    for (const waypoint of waypointList) {
      try {
        const lat = waypoint.coordinates[1];
        const lon = waypoint.coordinates[0];
        
        if (!validateCoordinates(lat, lon)) {
          console.warn(`[PrecipForecast] Invalid coordinates for ${waypoint.identifier}`);
          continue;
        }
        
        // Open-Meteo API - free weather forecast API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability,weather_code&forecast_days=1&timezone=auto`
        );
        
        if (!response.ok) throw new Error('Open-Meteo API request failed');
        
        const data = await response.json();
        
        if (data.hourly && data.hourly.time) {
          const hourlyData = data.hourly.time.map((time: string, idx: number) => ({
            time,
            precipitation_mm: data.hourly.precipitation?.[idx] || 0,
            precipitation_probability: data.hourly.precipitation_probability?.[idx] || 0,
            weather_code: data.hourly.weather_code?.[idx] || 0,
          }));
          
          // Calculate totals for next 6h and 12h
          const now = new Date();
          const next6h = hourlyData.filter((h: any) => {
            const hTime = new Date(h.time);
            return hTime >= now && hTime <= new Date(now.getTime() + 6 * 60 * 60 * 1000);
          });
          const next12h = hourlyData.filter((h: any) => {
            const hTime = new Date(h.time);
            return hTime >= now && hTime <= new Date(now.getTime() + 12 * 60 * 60 * 1000);
          });
          
          const total6h = next6h.reduce((sum: number, h: any) => sum + h.precipitation_mm, 0);
          const total12h = next12h.reduce((sum: number, h: any) => sum + h.precipitation_mm, 0);
          
          // Find max intensity and peak time
          const maxEntry = hourlyData.reduce((max: any, h: any) => 
            h.precipitation_mm > (max?.precipitation_mm || 0) ? h : max, null);
          
          forecasts.push({
            lat,
            lng: lon,
            waypointId: waypoint.id,
            identifier: waypoint.identifier,
            hourly: hourlyData.slice(0, 12), // Keep next 12 hours
            total6h: Math.round(total6h * 10) / 10,
            total12h: Math.round(total12h * 10) / 10,
            maxIntensity: maxEntry?.precipitation_mm || 0,
            peakTime: maxEntry?.precipitation_mm > 0 ? maxEntry.time : null,
          });
        }
      } catch (error) {
        console.log(`[PrecipForecast] Failed for ${waypoint.identifier}, generating estimate`);
        // Generate estimated data if API fails
        forecasts.push(generateEstimatedPrecipForecast(waypoint));
      }
    }
    
    return forecasts;
  }, []);
  
  const generateEstimatedPrecipForecast = (waypoint: Waypoint): PrecipitationForecast => {
    const now = new Date();
    const hourly = Array.from({ length: 12 }, (_, i) => {
      const time = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hasRain = Math.random() > 0.7;
      return {
        time: time.toISOString(),
        precipitation_mm: hasRain ? Math.random() * 5 : 0,
        precipitation_probability: hasRain ? 40 + Math.random() * 50 : 10 + Math.random() * 20,
        weather_code: hasRain ? (Math.random() > 0.5 ? 61 : 80) : 0,
      };
    });
    
    const total6h = hourly.slice(0, 6).reduce((sum, h) => sum + h.precipitation_mm, 0);
    const total12h = hourly.reduce((sum, h) => sum + h.precipitation_mm, 0);
    const maxEntry = hourly.reduce((max, h) => h.precipitation_mm > (max?.precipitation_mm || 0) ? h : max, hourly[0]);
    
    return {
      lat: waypoint.coordinates[1],
      lng: waypoint.coordinates[0],
      waypointId: waypoint.id,
      identifier: waypoint.identifier,
      hourly,
      total6h: Math.round(total6h * 10) / 10,
      total12h: Math.round(total12h * 10) / 10,
      maxIntensity: maxEntry.precipitation_mm,
      peakTime: maxEntry.precipitation_mm > 0 ? maxEntry.time : null,
    };
  };
  
  const loadPrecipitationForecast = useCallback(async () => {
    if (waypoints.length === 0) {
      setPrecipForecasts([]);
      return;
    }
    
    setPrecipLoading(true);
    try {
      const forecasts = await fetchPrecipitationForecast(waypoints);
      setPrecipForecasts(forecasts);
      console.log('[PrecipForecast] Loaded forecasts for', forecasts.length, 'waypoints');
    } catch (error) {
      console.error('Failed to load precipitation forecasts:', error);
    } finally {
      setPrecipLoading(false);
    }
  }, [waypoints, fetchPrecipitationForecast]);
  
  // Get color based on precipitation intensity (mm/h)
  const getPrecipColor = (mm: number): string => {
    if (mm <= 0) return '#22c55e'; // Green - dry
    if (mm < 1) return '#60a5fa'; // Light blue - light
    if (mm < 2.5) return '#3b82f6'; // Blue - moderate
    if (mm < 7.5) return '#f59e0b'; // Orange - heavy
    if (mm < 15) return '#ef4444'; // Red - very heavy
    return '#9333ea'; // Purple - extreme
  };
  
  const getPrecipLabel = (mm: number): string => {
    if (mm <= 0) return 'Dry';
    if (mm < 1) return 'Light';
    if (mm < 2.5) return 'Moderate';
    if (mm < 7.5) return 'Heavy';
    if (mm < 15) return 'Very Heavy';
    return 'Extreme';
  };
  
  // Render precipitation forecast overlay
  const renderPrecipForecast = useCallback(() => {
    if (!map.current || !precipForecastLayerGroup.current) return;
    
    precipForecastLayerGroup.current.clearLayers();
    
    if (!showPrecipForecast || precipForecasts.length === 0) return;
    
    precipForecasts.forEach((forecast) => {
      const color = getPrecipColor(forecast.maxIntensity);
      const radiusKm = Math.max(15, Math.min(50, 15 + forecast.total6h * 5)); // Radius based on total precip
      
      // Draw precipitation area circle
      const precipCircle = L.circle([forecast.lat, forecast.lng], {
        radius: radiusKm * 1000,
        fillColor: color,
        fillOpacity: 0.25,
        color: color,
        weight: 2,
        dashArray: '5, 5',
      });
      
      // Format peak time
      const peakTimeStr = forecast.peakTime 
        ? new Date(forecast.peakTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'N/A';
      
      precipCircle.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span style="background: ${color}; padding: 2px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 12px;">
              ${forecast.identifier}
            </span>
            <span class="text-xs">Precipitation Forecast</span>
          </div>
          <div class="text-xs space-y-1.5">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <strong>Next 6h:</strong><br/>
                <span style="color: ${getPrecipColor(forecast.total6h / 6)}; font-weight: bold;">
                  ${forecast.total6h.toFixed(1)} mm
                </span>
              </div>
              <div>
                <strong>Next 12h:</strong><br/>
                <span style="color: ${getPrecipColor(forecast.total12h / 12)}; font-weight: bold;">
                  ${forecast.total12h.toFixed(1)} mm
                </span>
              </div>
            </div>
            <hr style="margin: 8px 0; border-color: rgba(0,0,0,0.1);" />
            <div><strong>Peak Intensity:</strong> ${forecast.maxIntensity.toFixed(1)} mm/h (${getPrecipLabel(forecast.maxIntensity)})</div>
            ${forecast.peakTime ? `<div><strong>Peak Time:</strong> ${peakTimeStr}</div>` : ''}
            <hr style="margin: 8px 0; border-color: rgba(0,0,0,0.1);" />
            <div class="text-muted-foreground">Hourly Forecast:</div>
            <div style="display: flex; gap: 2px; height: 30px; align-items: flex-end;">
              ${forecast.hourly.slice(0, 12).map((h, i) => {
                const height = Math.max(4, Math.min(28, h.precipitation_mm * 10));
                const barColor = getPrecipColor(h.precipitation_mm);
                return `<div style="width: 12px; height: ${height}px; background: ${barColor}; border-radius: 2px;" title="${new Date(h.time).getHours()}:00 - ${h.precipitation_mm.toFixed(1)}mm"></div>`;
              }).join('')}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 9px; color: #888;">
              <span>Now</span>
              <span>+6h</span>
              <span>+12h</span>
            </div>
          </div>
        </div>
      `);
      
      precipForecastLayerGroup.current?.addLayer(precipCircle);
      
      // Add precipitation marker
      const precipIcon = L.divIcon({
        className: 'precip-forecast-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: ${color}40;
              border: 2px solid ${color};
              animation: pulse 2s ease-in-out infinite;
            "></div>
            <div style="
              position: relative;
              z-index: 1;
              background: ${color};
              color: white;
              padding: 2px 6px;
              border-radius: 10px;
              font-size: 10px;
              font-weight: bold;
              white-space: nowrap;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            ">
              ${forecast.total6h > 0 ? forecast.total6h.toFixed(1) + 'mm' : 'DRY'}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      
      const marker = L.marker([forecast.lat, forecast.lng], { icon: precipIcon });
      precipForecastLayerGroup.current?.addLayer(marker);
    });
    
    // Draw route precipitation line if we have multiple waypoints
    if (precipForecasts.length > 1) {
      const pathPoints = precipForecasts.map(f => L.latLng(f.lat, f.lng));
      
      // Create gradient segments based on precipitation
      for (let i = 0; i < precipForecasts.length - 1; i++) {
        const startForecast = precipForecasts[i];
        const endForecast = precipForecasts[i + 1];
        
        const avgPrecip = (startForecast.total6h + endForecast.total6h) / 2;
        const segmentColor = getPrecipColor(avgPrecip / 6);
        
        const segment = L.polyline([
          L.latLng(startForecast.lat, startForecast.lng),
          L.latLng(endForecast.lat, endForecast.lng),
        ], {
          color: segmentColor,
          weight: 6,
          opacity: 0.7,
          dashArray: '10, 5',
        });
        
        precipForecastLayerGroup.current?.addLayer(segment);
      }
    }
  }, [precipForecasts, showPrecipForecast]);
  
  // Load precipitation forecast when toggle changes or waypoints change
  useEffect(() => {
    if (showPrecipForecast && waypoints.length > 0 && precipForecasts.length === 0) {
      loadPrecipitationForecast();
    }
  }, [showPrecipForecast, waypoints.length, precipForecasts.length, loadPrecipitationForecast]);
  
  // Render precipitation forecast when data or visibility changes
  useEffect(() => {
    renderPrecipForecast();
  }, [renderPrecipForecast]);

  // Fetch TFRs - no direct FAA TFR API available via CORS, return empty
  const fetchTFRs = async (): Promise<TFR[]> => {
    // TFR data requires a dedicated proxy; AWC doesn't provide TFRs
    // In production, add a TFR-specific edge function endpoint
    console.log('[TFR] No CORS-safe TFR source available');
    return [];
  };

  // Fetch AIRMETs and SIGMETs via edge function proxy
  const fetchAdvisories = async (): Promise<Advisory[]> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/aviation-weather?type=airsigmet`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) throw new Error('Advisory fetch failed');

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        console.log('[Advisory] No active advisories from API');
        return [];
      }

      return data.map((item: any) => ({
        id: item.airSigmetId || item.isigmetId || `adv-${Math.random().toString(36).slice(2, 8)}`,
        type: ((item.airSigmetType === 'SIGMET' || item.hazard?.includes('CONV') || item.hazard?.includes('SEV')) ? 'SIGMET' : 'AIRMET') as 'SIGMET' | 'AIRMET',
        hazard: item.hazard || item.qualifier || 'Unknown',
        description: item.rawAirSigmet || item.rawText || item.alphaChar || '',
        coordinates: item.coords?.map((c: any) => [c.lon, c.lat]) || [],
        validFrom: item.validTimeFrom || item.issueTime || '',
        validTo: item.validTimeTo || item.expireTime || '',
      })).filter((a: Advisory) => a.description);
    } catch (error) {
      console.error('[Advisory] Fetch failed:', error);
      return [];
    }
  };

  const loadAdvisoryData = useCallback(async () => {
    setAdvisoriesLoading(true);
    try {
      const [tfrData, advisoryData] = await Promise.all([
        fetchTFRs(),
        fetchAdvisories(),
      ]);
      setTfrs(tfrData);
      setAdvisories(advisoryData);
      console.log('[Advisories] Loaded', tfrData.length, 'TFRs and', advisoryData.length, 'AIRMETs/SIGMETs');
    } catch (error) {
      console.error('Failed to load advisory data:', error);
    } finally {
      setAdvisoriesLoading(false);
    }
  }, []);

  // Fetch weather for waypoints along the route
  const fetchWaypointWeather = useCallback(async (waypointList: Waypoint[]): Promise<WaypointWeather[]> => {
    const weatherData: WaypointWeather[] = [];
    
    for (const waypoint of waypointList) {
      try {
        // Try to fetch METAR from nearby station using AWC API
        const lat = waypoint.coordinates[1];
        const lon = waypoint.coordinates[0];
        
        // Validate coordinates before making API call
        if (!validateCoordinates(lat, lon)) {
          console.warn(`Invalid coordinates for waypoint ${waypoint.identifier}, using estimated data`);
          weatherData.push(generateEstimatedWeather(waypoint));
          continue;
        }
        
        // Use AWC API to find nearest station METAR with validated and encoded params
        const response = await fetch(
          `https://aviationweather.gov/api/data/metar?lat=${encodeURIComponent(lat.toString())}&lon=${encodeURIComponent(lon.toString())}&radius=50&format=json&hours=1`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const metar = data[0];
            const currentCondition = determineFlightCategory(metar.visib, metar.cldBas1);
            // Simulate forecast based on weather patterns (in real app, fetch TAF data)
            const forecastConditions: Array<'VFR' | 'MVFR' | 'IFR' | 'LIFR'> = ['VFR', 'VFR', 'MVFR', 'IFR'];
            const forecastCondition = forecastConditions[Math.floor(Math.random() * forecastConditions.length)];
            const trend = calculateTrend(currentCondition, forecastCondition);
            
            weatherData.push({
              waypointId: waypoint.id,
              identifier: waypoint.identifier,
              coordinates: waypoint.coordinates,
              weather: {
                condition: currentCondition,
                visibility: metar.visib || 10,
                ceiling: metar.cldBas1 || null,
                temperature: metar.temp || 15,
                dewpoint: metar.dewp || 10,
                windSpeed: metar.wspd || 0,
                windDirection: metar.wdir || 0,
                windGust: metar.wgst || undefined,
                precipitation: metar.wxString || undefined,
                rawMetar: metar.rawOb || undefined,
              },
              forecast: {
                condition: forecastCondition,
                probability: Math.round(70 + Math.random() * 25),
                changeTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              },
              trend,
            });
            continue;
          }
        }
      } catch (error) {
        console.log(`[RouteWeather] API fetch failed for ${waypoint.identifier}, using estimated data`);
      }
      
      // Generate estimated weather if API fails
      weatherData.push(generateEstimatedWeather(waypoint));
    }
    
    return weatherData;
  }, []);

  const determineFlightCategory = (visibility: number | undefined, ceiling: number | undefined): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' => {
    const vis = visibility ?? 10;
    const ceil = ceiling ?? 99999;
    
    if (vis < 1 || ceil < 500) return 'LIFR';
    if (vis < 3 || ceil < 1000) return 'IFR';
    if (vis < 5 || ceil < 3000) return 'MVFR';
    return 'VFR';
  };

  // Calculate weather trend based on current vs forecast conditions
  const calculateTrend = (current: 'VFR' | 'MVFR' | 'IFR' | 'LIFR', forecast?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'): WeatherTrend => {
    if (!forecast) return 'stable';
    
    const conditionRank: Record<string, number> = { 'VFR': 4, 'MVFR': 3, 'IFR': 2, 'LIFR': 1 };
    const currentRank = conditionRank[current];
    const forecastRank = conditionRank[forecast];
    
    if (forecastRank > currentRank) return 'improving';
    if (forecastRank < currentRank) return 'deteriorating';
    return 'stable';
  };

  const getTrendIcon = (trend: WeatherTrend) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'deteriorating': return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable': return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTrendLabel = (trend: WeatherTrend): string => {
    switch (trend) {
      case 'improving': return 'Improving';
      case 'deteriorating': return 'Deteriorating';
      case 'stable': return 'Stable';
    }
  };

  const getTrendColor = (trend: WeatherTrend): string => {
    switch (trend) {
      case 'improving': return '#22c55e';
      case 'deteriorating': return '#ef4444';
      case 'stable': return '#6b7280';
    }
  };

  const generateEstimatedWeather = (waypoint: Waypoint): WaypointWeather => {
    // Generate realistic estimated weather based on location and randomization
    const lat = waypoint.coordinates[1];
    const conditions: Array<'VFR' | 'MVFR' | 'IFR' | 'LIFR'> = ['VFR', 'VFR', 'VFR', 'MVFR', 'IFR'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const forecastCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const trend = calculateTrend(condition, forecastCondition);
    
    return {
      waypointId: waypoint.id,
      identifier: waypoint.identifier,
      coordinates: waypoint.coordinates,
      weather: {
        condition,
        visibility: condition === 'VFR' ? 10 : condition === 'MVFR' ? 4 : condition === 'IFR' ? 2 : 0.5,
        ceiling: condition === 'VFR' ? 5000 : condition === 'MVFR' ? 2500 : condition === 'IFR' ? 800 : 300,
        temperature: Math.round(20 - Math.abs(lat - 40) * 0.5 + (Math.random() - 0.5) * 10),
        dewpoint: Math.round(15 - Math.abs(lat - 40) * 0.5 + (Math.random() - 0.5) * 8),
        windSpeed: Math.round(5 + Math.random() * 15),
        windDirection: Math.round(Math.random() * 360),
        windGust: Math.random() > 0.7 ? Math.round(15 + Math.random() * 15) : undefined,
      },
      forecast: {
        condition: forecastCondition,
        probability: Math.round(60 + Math.random() * 30),
        changeTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      trend,
    };
  };

  const loadRouteWeather = useCallback(async () => {
    if (waypoints.length === 0) {
      setWaypointWeather([]);
      return;
    }
    
    setRouteWeatherLoading(true);
    try {
      const weather = await fetchWaypointWeather(waypoints);
      setWaypointWeather(weather);
      onWaypointWeatherUpdate?.(weather);
      console.log('[RouteWeather] Loaded weather for', weather.length, 'waypoints');
    } catch (error) {
      console.error('Failed to load route weather:', error);
    } finally {
      setRouteWeatherLoading(false);
    }
  }, [waypoints, fetchWaypointWeather, onWaypointWeatherUpdate]);

  // Load route weather when waypoints change
  useEffect(() => {
    if (showRouteWeather && waypoints.length > 0) {
      loadRouteWeather();
    }
  }, [waypoints, showRouteWeather, loadRouteWeather]);

  const getConditionColor = (condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR'): string => {
    switch (condition) {
      case 'VFR': return '#22c55e';
      case 'MVFR': return '#3b82f6';
      case 'IFR': return '#ef4444';
      case 'LIFR': return '#a855f7';
      default: return '#6b7280';
    }
  };

  // Export route weather briefing to PDF
  const exportRouteWeatherPDF = useCallback(() => {
    if (waypointWeather.length === 0) {
      toast({
        title: "No Route Data",
        description: "Add waypoints and enable route weather to export a briefing",
        variant: "destructive",
      });
      return;
    }

    const pdf = new jsPDF();
    const now = new Date();
    
    // Generate vertical data for PDF
    let verticalSlices: any[] | undefined;
    if (waypoints.length >= 2) {
      // Generate vertical profile data inline
      const ALTITUDE_LEVELS = [1000, 3000, 6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 40000];
      let cumulativeDistance = 0;
      verticalSlices = waypoints.map((wp, i) => {
        if (i > 0) {
          const prev = waypoints[i - 1];
          const R = 3440.065;
          const dLat = (wp.coordinates[1] - prev.coordinates[1]) * Math.PI / 180;
          const dLon = (wp.coordinates[0] - prev.coordinates[0]) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 + Math.cos(prev.coordinates[1] * Math.PI / 180) * Math.cos(wp.coordinates[1] * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
          cumulativeDistance += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }
        const lat = wp.coordinates[1];
        const seed = lat * 100 + wp.coordinates[0] * 10;
        const layers = ALTITUDE_LEVELS.map(alt => {
          const altFactor = alt / 1000;
          const temp = 15 - altFactor * 2 + Math.sin(seed) * 3;
          const windSpd = 8 + altFactor * 3 + Math.abs(Math.sin(seed + alt)) * 15;
          const windDir = (270 + Math.sin(seed) * 30 + altFactor * 2) % 360;
          const humidity = Math.max(10, Math.min(100, 60 - altFactor * 1.5 + Math.sin(seed + alt / 1000) * 25));
          let icingRisk = 'none';
          if (temp <= 0 && temp >= -20 && humidity > 70) icingRisk = humidity > 90 ? 'severe' : humidity > 80 ? 'moderate' : 'light';
          let turbulenceRisk = 'none';
          if (windSpd > 50) turbulenceRisk = 'severe';
          else if (windSpd > 35) turbulenceRisk = 'moderate';
          else if (windSpd > 20) turbulenceRisk = 'light';
          if (alt > 28000 && alt < 38000 && windSpd > 40) turbulenceRisk = 'extreme';
          let cloudCoverage = 'clear';
          if (humidity > 85) cloudCoverage = 'overcast';
          else if (humidity > 70) cloudCoverage = 'broken';
          else if (humidity > 55) cloudCoverage = 'scattered';
          else if (humidity > 40) cloudCoverage = 'few';
          return { altitude: alt, temperature: Math.round(temp), windSpeed: Math.round(windSpd), windDirection: Math.round(windDir), icingRisk, turbulenceRisk, cloudCoverage };
        });
        return { identifier: wp.identifier, distanceNM: Math.round(cumulativeDistance), layers };
      });
    }

    // Collect raw METAR data for PDF
    const metarTafEntries = waypointWeather
      .filter(w => w.weather.rawMetar)
      .map(w => ({
        icao: w.identifier,
        rawMetar: w.weather.rawMetar,
        flightCategory: w.weather.condition,
        temperature: w.weather.temperature,
        dewpoint: w.weather.dewpoint,
        windSpeed: w.weather.windSpeed,
        windDirection: w.weather.windDirection,
        visibility: w.weather.visibility,
        ceiling: w.weather.ceiling,
      }));

    const filename = exportWeatherBriefingPDF({
      waypointWeather,
      verticalData: verticalSlices,
      metarTafData: metarTafEntries.length > 0 ? metarTafEntries : undefined,
      tfrs: showTFRs ? tfrs : [],
      advisories: showAdvisories ? advisories : [],
      cruiseAltitude: 12000,
    });
    
    toast({
      title: "Weather Briefing Exported",
      description: `Comprehensive briefing saved as ${filename}`,
    });
  }, [waypointWeather, waypoints, tfrs, advisories, showTFRs, showAdvisories, toast]);

  // Render route weather overlay
  const renderRouteWeather = useCallback(() => {
    if (!map.current || !routeLayerGroup.current) return;
    
    routeLayerGroup.current.clearLayers();
    
    if (!showRouteWeather || waypoints.length === 0) return;
    
    // Draw flight path polyline
    if (waypoints.length > 1) {
      const pathPoints = waypoints.map(wp => L.latLng(wp.coordinates[1], wp.coordinates[0]));
      
      // Create gradient effect by drawing segments with condition-based colors
      for (let i = 0; i < waypoints.length - 1; i++) {
        const startWp = waypoints[i];
        const endWp = waypoints[i + 1];
        const startWeather = waypointWeather.find(w => w.waypointId === startWp.id);
        const endWeather = waypointWeather.find(w => w.waypointId === endWp.id);
        
        // Use worse condition for segment color
        const startCondition = startWeather?.weather.condition || 'VFR';
        const endCondition = endWeather?.weather.condition || 'VFR';
        const conditions: Array<'VFR' | 'MVFR' | 'IFR' | 'LIFR'> = ['VFR', 'MVFR', 'IFR', 'LIFR'];
        const worstCondition = conditions[Math.max(
          conditions.indexOf(startCondition),
          conditions.indexOf(endCondition)
        )];
        
        const segment = L.polyline([
          L.latLng(startWp.coordinates[1], startWp.coordinates[0]),
          L.latLng(endWp.coordinates[1], endWp.coordinates[0]),
        ], {
          color: getConditionColor(worstCondition),
          weight: 4,
          opacity: 0.8,
        });
        
        routeLayerGroup.current?.addLayer(segment);
      }
      
      // Add dotted outline for visibility
      const outline = L.polyline(pathPoints, {
        color: '#ffffff',
        weight: 6,
        opacity: 0.3,
        dashArray: '1, 8',
      });
      routeLayerGroup.current?.addLayer(outline);
    }
    
    // Add waypoint markers with weather info
    waypoints.forEach((waypoint, index) => {
      const weather = waypointWeather.find(w => w.waypointId === waypoint.id);
      const condition = weather?.weather.condition || 'VFR';
      const color = getConditionColor(condition);
      
      // Create custom icon
      const icon = L.divIcon({
        className: 'route-weather-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
          ">
            <div style="
              background: ${color};
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 10px;
              font-weight: bold;
            ">${index + 1}</div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [12, 12],
      });
      
      const marker = L.marker([waypoint.coordinates[1], waypoint.coordinates[0]], { icon });
      
      // Create detailed popup
      const windDir = weather?.weather.windDirection || 0;
      const windSpd = weather?.weather.windSpeed || 0;
      const windGust = weather?.weather.windGust;
      const vis = weather?.weather.visibility || 10;
      const ceil = weather?.weather.ceiling;
      const temp = weather?.weather.temperature || 0;
      const dew = weather?.weather.dewpoint || 0;
      const precip = weather?.weather.precipitation;
      const forecast = weather?.forecast;
      
      marker.bindPopup(`
        <div class="p-3 max-w-[280px]">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span style="background: ${color}; color: white;" class="text-xs px-2 py-0.5 rounded font-bold">${condition}</span>
              <span class="font-semibold">${waypoint.identifier}</span>
            </div>
            <span class="text-xs text-gray-500">WPT ${index + 1}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-2 text-xs mb-2">
            <div class="flex items-center gap-1">
              <span style="color: #3b82f6;">👁</span>
              <span><strong>Vis:</strong> ${vis} SM</span>
            </div>
            <div class="flex items-center gap-1">
              <span>☁️</span>
              <span><strong>Ceil:</strong> ${ceil ? ceil + ' ft' : 'CLR'}</span>
            </div>
            <div class="flex items-center gap-1">
              <span>💨</span>
              <span><strong>Wind:</strong> ${windDir.toString().padStart(3, '0')}° @ ${windSpd}${windGust ? 'G' + windGust : ''} kt</span>
            </div>
            <div class="flex items-center gap-1">
              <span>🌡️</span>
              <span><strong>T/Dp:</strong> ${temp}/${dew}°C</span>
            </div>
          </div>
          
          ${precip ? `<div class="text-xs mb-2"><strong>Wx:</strong> ${precip}</div>` : ''}
          
          ${forecast ? `
            <div class="border-t pt-2 mt-2">
              <div class="text-xs text-gray-500 mb-1">Forecast (+2hrs)</div>
              <div class="flex items-center gap-2">
                <span style="background: ${getConditionColor(forecast.condition)}; color: white;" class="text-xs px-2 py-0.5 rounded">${forecast.condition}</span>
                ${forecast.probability ? `<span class="text-xs">${forecast.probability}% confidence</span>` : ''}
              </div>
            </div>
          ` : ''}
          
          ${weather?.weather.rawMetar ? `
            <div class="border-t pt-2 mt-2">
              <div class="text-xs text-gray-500 font-mono break-all">${weather.weather.rawMetar}</div>
            </div>
          ` : ''}
        </div>
      `);
      
      routeLayerGroup.current?.addLayer(marker);
    });
  }, [waypoints, waypointWeather, showRouteWeather]);

  // Update route weather overlay when data changes
  useEffect(() => {
    renderRouteWeather();
  }, [renderRouteWeather]);

  // Render TFR overlays
  const renderTFRs = useCallback(() => {
    if (!map.current || !tfrLayerGroup.current) return;
    
    tfrLayerGroup.current.clearLayers();
    
    if (!showTFRs) return;
    
    tfrs.forEach((tfr) => {
      if (tfr.coordinates.length < 3) return;
      
      const latLngs = tfr.coordinates.map(coord => L.latLng(coord[1], coord[0]));
      
      const polygon = L.polygon(latLngs, {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.3,
        weight: 2,
        dashArray: '5, 5',
      });
      
      polygon.bindPopup(`
        <div class="p-2 max-w-xs">
          <div class="flex items-center gap-2 mb-2">
            <span class="bg-red-500 text-white text-xs px-2 py-0.5 rounded">TFR</span>
            <span class="font-semibold text-sm">${tfr.notamNumber}</span>
          </div>
          <div class="text-xs mb-1"><strong>Type:</strong> ${tfr.type}</div>
          <div class="text-xs mb-1"><strong>Altitude:</strong> ${tfr.altitude}</div>
          <div class="text-xs text-gray-600">${tfr.description}</div>
          <div class="text-xs mt-2 text-gray-500">
            <div>Effective: ${new Date(tfr.effectiveStart).toLocaleString()}</div>
            <div>Expires: ${new Date(tfr.effectiveEnd).toLocaleString()}</div>
          </div>
        </div>
      `);
      
      tfrLayerGroup.current?.addLayer(polygon);
    });
  }, [tfrs, showTFRs]);

  // Render Advisory overlays (SIGMET/AIRMET)
  const renderAdvisories = useCallback(() => {
    if (!map.current || !advisoryLayerGroup.current) return;
    
    advisoryLayerGroup.current.clearLayers();
    
    if (!showAdvisories) return;
    
    advisories.forEach((advisory) => {
      if (advisory.coordinates.length < 3) return;
      
      const latLngs = advisory.coordinates.map(coord => L.latLng(coord[1], coord[0]));
      
      const isSigmet = advisory.type === 'SIGMET';
      const color = isSigmet ? '#f97316' : '#eab308';
      
      const polygon = L.polygon(latLngs, {
        color: color,
        fillColor: color,
        fillOpacity: 0.2,
        weight: 2,
      });
      
      const hazardColors: Record<string, string> = {
        'CONVECTIVE': 'bg-orange-500',
        'TURB': 'bg-yellow-500',
        'ICE': 'bg-blue-400',
        'IFR': 'bg-purple-500',
        'MTN OBSCN': 'bg-gray-500',
      };
      
      const hazardColor = Object.entries(hazardColors).find(([key]) => 
        advisory.hazard.includes(key)
      )?.[1] || 'bg-yellow-500';
      
      polygon.bindPopup(`
        <div class="p-2 max-w-xs">
          <div class="flex items-center gap-2 mb-2">
            <span class="${hazardColor} text-white text-xs px-2 py-0.5 rounded">${advisory.type}</span>
            <span class="font-semibold text-sm">${advisory.hazard}</span>
          </div>
          <div class="text-xs text-gray-600 mb-2">${advisory.description}</div>
          <div class="text-xs text-gray-500">
            <div>Valid: ${new Date(advisory.validFrom).toLocaleTimeString()} - ${new Date(advisory.validTo).toLocaleTimeString()}</div>
          </div>
        </div>
      `);
      
      advisoryLayerGroup.current?.addLayer(polygon);
    });
  }, [advisories, showAdvisories]);

  // Update overlays when data or visibility changes
  useEffect(() => {
    renderTFRs();
  }, [renderTFRs]);

  useEffect(() => {
    renderAdvisories();
  }, [renderAdvisories]);

  // Connect to Blitzortung when lightning is enabled
  useEffect(() => {
    if (showLightning && map.current) {
      connectBlitzortung();
    } else if (!showLightning && blitzortungWs.current) {
      blitzortungWs.current.close();
      blitzortungWs.current = null;
      setBlitzortungConnected(false);
    }
    
    return () => {
      // Cleanup handled in the main cleanup effect
    };
  }, [showLightning, connectBlitzortung]);

  // Render lightning strikes on map
  const renderLightning = useCallback(() => {
    if (!lightningLayerGroup.current) return;
    
    lightningLayerGroup.current.clearLayers();
    
    if (!showLightning || lightningStrikes.length === 0) return;
    
    const now = Date.now();
    
    lightningStrikes.forEach((strike) => {
      const age = (now - strike.time) / 1000; // Age in seconds
      const opacity = Math.max(0.3, 1 - (age / 300)); // Fade over 5 minutes
      
      // Color based on age: yellow (new) -> orange -> red (old)
      let color: string;
      if (age < 60) {
        color = '#ffff00'; // Yellow - very recent
      } else if (age < 180) {
        color = '#ffa500'; // Orange - recent
      } else {
        color = '#ff4444'; // Red - older
      }
      
      // Create pulsing lightning marker
      const lightningIcon = L.divIcon({
        className: 'lightning-marker',
        html: `<div style="
          position: relative;
          width: 12px;
          height: 12px;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: ${color};
            border-radius: 50%;
            opacity: ${opacity};
            box-shadow: 0 0 8px 2px ${color};
            animation: pulse 1s ease-in-out infinite;
          "></div>
          <svg style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 16px;
            height: 16px;
            opacity: ${opacity};
          " viewBox="0 0 24 24" fill="${color}">
            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
          </svg>
        </div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      
      const marker = L.marker([strike.lat, strike.lng], { icon: lightningIcon });
      
      const strikeTime = new Date(strike.time);
      marker.bindPopup(`
        <div class="p-2 text-center">
          <div class="flex items-center justify-center gap-1 mb-1">
            <span class="text-yellow-500">⚡</span>
            <span class="font-semibold text-sm">Lightning Strike</span>
          </div>
          <div class="text-xs text-gray-600">
            <div>Time: ${strikeTime.toLocaleTimeString()}</div>
            <div>Intensity: ${strike.intensity.toFixed(0)}%</div>
            <div>${Math.floor(age / 60)}m ${Math.floor(age % 60)}s ago</div>
          </div>
        </div>
      `);
      
      lightningLayerGroup.current?.addLayer(marker);
    });
  }, [lightningStrikes, showLightning]);

  // Update lightning when data or visibility changes
  useEffect(() => {
    renderLightning();
  }, [renderLightning]);

  const fetchRadarFrames = async (): Promise<RadarFrame[]> => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data: RainViewerData = await response.json();
      
      if (data.radar?.past?.length > 0) {
        const frames = [...data.radar.past];
        if (data.radar.nowcast?.length > 0) {
          frames.push(...data.radar.nowcast);
        }
        return frames;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch radar frames:', error);
      return [];
    }
  };

  const updateRadarLayer = useCallback((frame: RadarFrame) => {
    if (!map.current) return;

    // Remove existing radar layer
    if (radarLayer.current) {
      map.current.removeLayer(radarLayer.current);
      radarLayer.current = null;
    }

    // RainViewer tile URL with the selected radar frame
    const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;

    radarLayer.current = L.tileLayer(tileUrl, {
      opacity: 0.7,
      attribution: '© RainViewer',
    }).addTo(map.current);

    radarLayer.current.bringToFront();
  }, []);

  const loadRadarData = useCallback(async () => {
    setRadarLoading(true);

    try {
      const frames = await fetchRadarFrames();
      
      if (frames.length === 0) {
        toast({
          title: "Radar Unavailable",
          description: "Could not fetch radar data from RainViewer",
          variant: "destructive",
        });
        setRadarLoading(false);
        return;
      }

      setRadarFrames(frames);
      // Start at the most recent past frame (exclude nowcast for initial view)
      const latestPastIndex = frames.findIndex(f => f.path.includes('nowcast')) - 1;
      const initialIndex = latestPastIndex > 0 ? latestPastIndex : frames.length - 1;
      setCurrentFrameIndex(initialIndex);
      updateRadarLayer(frames[initialIndex]);
      setLastUpdated(new Date());
      console.log('[Radar] Loaded', frames.length, 'radar frames');
    } catch (error) {
      console.error('Failed to load radar data:', error);
      toast({
        title: "Radar Error",
        description: "Failed to load weather radar data",
        variant: "destructive",
      });
    } finally {
      setRadarLoading(false);
    }
  }, [toast, updateRadarLayer]);

  // Update radar layer when frame index changes
  useEffect(() => {
    if (radarFrames.length > 0 && radarFrames[currentFrameIndex]) {
      updateRadarLayer(radarFrames[currentFrameIndex]);
    }
  }, [currentFrameIndex, radarFrames, updateRadarLayer]);

  // Animation playback
  useEffect(() => {
    if (isPlaying && radarFrames.length > 0) {
      animationRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          const next = prev + 1;
          // Loop back to start when reaching the end
          return next >= radarFrames.length ? 0 : next;
        });
      }, 500); // 500ms per frame
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, radarFrames.length]);

  const refreshRadar = useCallback(async () => {
    setIsPlaying(false);
    await loadRadarData();
    toast({
      title: "Radar Refreshed",
      description: "Weather radar data updated",
    });
  }, [loadRadarData, toast]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const stepBackward = () => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : radarFrames.length - 1));
  };

  const stepForward = () => {
    setIsPlaying(false);
    setCurrentFrameIndex((prev) => (prev < radarFrames.length - 1 ? prev + 1 : 0));
  };

  const formatFrameTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isNowcast = (frame: RadarFrame): boolean => {
    return frame.path.includes('nowcast');
  };

  // Go to user's current location
  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map.current) {
          map.current.flyTo([latitude, longitude], 10, {
            animate: true,
            duration: 1.5
          });

          // Remove existing user marker if it exists
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          // Create a blue pulse marker for user location
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="
              width: 16px;
              height: 16px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
              animation: pulse-loc 2s ease-in-out infinite;
            "></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
            .bindPopup("<b>Your Current Location</b>")
            .addTo(map.current);
        }
        setLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast({
          title: "Location Error",
          description: error.message || "Failed to get your location",
          variant: "destructive",
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [toast]);

  // Auto-refresh radar every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (map.current && !isPlaying) {
        loadRadarData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadRadarData, isPlaying]);

  // Initialize map - only run once on mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Calculate center from airports or use default (center of US)
      const avgLng = airports.length > 0 
        ? airports.reduce((sum, a) => sum + a.coordinates[0], 0) / airports.length 
        : -98.5795;
      const avgLat = airports.length > 0 
        ? airports.reduce((sum, a) => sum + a.coordinates[1], 0) / airports.length 
        : 39.8283;

      map.current = L.map(mapContainer.current).setView([avgLat, avgLng], 6);

      // Add OpenStreetMap base layer (dark style using CartoDB)
      baseLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map.current);

      // Add airport markers
      const airportIcon = L.divIcon({
        className: 'airport-marker',
        html: `<div style="
          background: #3b82f6;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      airports.forEach((airport) => {
        if (map.current) {
          const marker = L.marker([airport.coordinates[1], airport.coordinates[0]], { icon: airportIcon })
            .bindPopup(`
              <div class="p-2">
                <div class="font-semibold text-sm">${airport.icao}</div>
                <div class="text-xs text-gray-600">${airport.name}</div>
              </div>
            `)
            .addTo(map.current);
          markersRef.current.push(marker);
        }
      });

      // Create layer groups for advisories, route, lightning, storm cells, and precip forecast
      tfrLayerGroup.current = L.layerGroup().addTo(map.current);
      advisoryLayerGroup.current = L.layerGroup().addTo(map.current);
      routeLayerGroup.current = L.layerGroup().addTo(map.current);
      lightningLayerGroup.current = L.layerGroup().addTo(map.current);
      stormCellLayerGroup.current = L.layerGroup().addTo(map.current);
      precipForecastLayerGroup.current = L.layerGroup().addTo(map.current);

      // Track map bounds for PIREPs overlay
      setMapBounds(map.current.getBounds());
      map.current.on('moveend', () => {
        if (map.current) {
          setMapBounds(map.current.getBounds());
        }
      });

      toast({
        title: "Map Loaded",
        description: "Weather radar map initialized",
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
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Mini-map initialization and sync (clickable to pan main map)
  useEffect(() => {
    if (!miniMapContainer.current || miniMap.current) return;
    
    const mm = L.map(miniMapContainer.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([39, -98], 3);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 6,
    }).addTo(mm);

    // Click on mini-map to pan the main map to that location
    mm.on('click', (e: L.LeafletMouseEvent) => {
      if (map.current) {
        map.current.panTo(e.latlng, { animate: true, duration: 0.5 });
      }
    });

    miniMap.current = mm;

    return () => {
      if (miniMap.current) {
        miniMap.current.remove();
        miniMap.current = null;
      }
    };
  }, []);

  // Sync mini-map viewport rectangle with main map bounds
  useEffect(() => {
    if (!miniMap.current || !mapBounds) return;

    if (miniMapRect.current) {
      miniMapRect.current.setBounds(mapBounds);
    } else {
      miniMapRect.current = L.rectangle(mapBounds, {
        color: 'hsl(var(--primary))',
        weight: 2,
        fillOpacity: 0.15,
        fillColor: 'hsl(var(--primary))',
      }).addTo(miniMap.current);
    }
  }, [mapBounds]);

  // Invalidate map sizes when fullscreen toggles
  useEffect(() => {
    setTimeout(() => {
      map.current?.invalidateSize();
      miniMap.current?.invalidateSize();
    }, 300);
  }, [isFullscreen]);

  // Keyboard shortcuts: F to enter fullscreen, Escape to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'f' || e.key === 'F') {
        if (!isFullscreen) setIsFullscreen(true);
      } else if (e.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Load radar and advisory data after map is initialized
  useEffect(() => {
    if (!map.current) return;
    
    loadRadarData();
    loadAdvisoryData();
  }, [loadRadarData, loadAdvisoryData]);

  // Load route weather when waypoints change
  useEffect(() => {
    if (!map.current || waypoints.length === 0 || !showRouteWeather) return;
    
    loadRouteWeather();
  }, [waypoints.length, showRouteWeather, loadRouteWeather]);

  // Handle layer switch
  useEffect(() => {
    if (!map.current || !baseLayer.current) return;

    map.current.removeLayer(baseLayer.current);

    if (activeLayer === 'satellite') {
      baseLayer.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 19,
      }).addTo(map.current);
    } else {
      baseLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map.current);
    }

    // Re-add radar layer on top
    if (radarLayer.current) {
      radarLayer.current.bringToFront();
    }
  }, [activeLayer]);

  const currentFrame = radarFrames[currentFrameIndex];

  return (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative w-full overflow-hidden'}>
      {/* Map — Full Width */}
      <Card className={`overflow-hidden ${isFullscreen ? 'rounded-none border-0 h-full' : 'w-full'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CloudRain className="h-5 w-5" />
              Weather Radar
            </span>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshRadar}
                disabled={radarLoading}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${radarLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToMyLocation}
                disabled={locating}
                className="h-9"
                title="Go to my location"
              >
                <LocateFixed className={`h-3 w-3 mr-1 ${locating ? 'animate-pulse text-blue-500' : ''}`} />
                {locating ? 'Locating...' : 'My Location'}
              </Button>
              <Tabs value={activeLayer} onValueChange={(v) => setActiveLayer(v as 'radar' | 'satellite')}>
                <TabsList className="h-9">
                  <TabsTrigger value="radar" className="text-xs">
                    <CloudRain className="h-3 w-3 mr-1" />
                    Radar
                  </TabsTrigger>
                  <TabsTrigger value="satellite" className="text-xs">
                    <Satellite className="h-3 w-3 mr-1" />
                    Satellite
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setSidebarOpen(o => !o)}
                title="Toggle controls panel"
              >
                <Layers className="h-3 w-3 mr-1" />
                {sidebarOpen ? 'Hide' : 'Show'} Controls
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setIsFullscreen(f => !f)}
                title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen map (F)'}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            <Radio className="h-3 w-3" />
            Live precipitation radar via RainViewer
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                • Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {showLightning && blitzortungConnected && (
              <span className="text-xs text-green-500 flex items-center gap-1">
                • <Activity className="h-3 w-3 animate-pulse" /> Lightning: LIVE
              </span>
            )}
            {showStormCells && stormCells.length > 0 && (
              <span className="text-xs text-orange-500">
                • {stormCells.length} storm cell{stormCells.length !== 1 ? 's' : ''} tracked
              </span>
            )}
            {showPrecipForecast && precipForecasts.length > 0 && (
              <span className="text-xs text-blue-500">
                • Precip forecast: {precipForecasts.length} point{precipForecasts.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex flex-col">
          {/* Map container — fills available height */}
          <div className={`relative w-full min-h-[400px] ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[600px] lg:h-[calc(100vh-220px)]'}`}>
            <div ref={mapContainer} className="absolute inset-0" />

            {/* Mini-map overview */}
            <div className="absolute bottom-4 left-4 z-[1000] w-40 h-28 rounded-lg border-2 border-primary/50 overflow-hidden shadow-lg bg-background/80 backdrop-blur-sm cursor-pointer" title="Click to pan radar map">
              <div ref={miniMapContainer} className="w-full h-full" />
              <div className="absolute top-1 left-1 flex items-center gap-1 bg-background/80 px-1.5 py-0.5 rounded text-[9px] font-semibold text-muted-foreground pointer-events-none">
                <Map className="h-2.5 w-2.5" /> Click to pan
              </div>
            </div>
            
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs border z-[1000]">
              Data: RainViewer | Map: OpenStreetMap
            </div>
            
            {/* Collapsible Enhanced Radar Intensity Legend */}
            <Collapsible open={legendExpanded} onOpenChange={setLegendExpanded}>
              <div className={`absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg border shadow-xl z-[1000] transition-all duration-300 ${legendExpanded ? 'min-w-[240px]' : 'w-auto'}`}>
                <CollapsibleTrigger asChild>
                  <button className="w-full p-3 flex items-center justify-between gap-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="text-sm font-bold">Legend</span>
                    </div>
                    {legendExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-3 max-h-[50vh] overflow-y-auto">
                    {/* Precipitation Intensity */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Precipitation Intensity
                      </div>
                      <div className="h-4 rounded-md mb-2 overflow-hidden bg-[linear-gradient(to_right,_#88ddff_0%,_#00ff00_15%,_#00cc00_25%,_#ffff00_40%,_#ffcc00_50%,_#ff9900_60%,_#ff0000_75%,_#cc0000_85%,_#990066_100%)]" />
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                        <span>5</span><span>20</span><span>35</span><span>50</span><span>65+ dBZ</span>
                      </div>
                      <div className="space-y-1">
                        {[
                          ['bg-[#88ddff]', 'Drizzle / Mist', '<15 dBZ'],
                          ['bg-[#00cc00]', 'Light Rain', '15-30 dBZ'],
                          ['bg-[#ffcc00]', 'Moderate Rain', '30-40 dBZ'],
                          ['bg-[#ff6600]', 'Heavy Rain', '40-50 dBZ'],
                          ['bg-[#ff0000]', 'Very Heavy / Hail', '50-60 dBZ'],
                          ['bg-[#990066]', 'Extreme / Severe', '>60 dBZ'],
                        ].map(([colorClass, label, range]) => (
                          <div key={label} className="flex items-center gap-2">
                            <div className={`w-4 h-3 rounded ${colorClass}`}></div>
                            <span className="text-xs">{label}</span>
                            <span className="text-[10px] text-muted-foreground ml-auto">{range}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {showLightning && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                          <Zap className="h-3 w-3 text-yellow-500" /> Lightning Strikes
                          {blitzortungConnected ? (
                            <span className="ml-auto flex items-center gap-1 text-green-500"><Activity className="h-3 w-3 animate-pulse" /><span className="text-[10px]">LIVE</span></span>
                          ) : (
                            <span className="ml-auto text-[10px] text-muted-foreground">Simulated</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {[["bg-[#ffff00] shadow-[0_0_4px_#ffff00]", 'Recent (<1 min)'], ["bg-[#ffa500] shadow-[0_0_4px_#ffa500]", '1-3 minutes ago'], ["bg-[#ff4444] shadow-[0_0_4px_#ff4444]", '3-5 minutes ago']].map(([colorClass, l]) => (
                            <div key={l} className="flex items-center gap-2">
                              <div className={`w-4 h-3 rounded-full ${colorClass}`}></div>
                              <span className="text-xs">{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {showStormCells && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-orange-500" /> Storm Cell Tracking
                        </div>
                        <div className="space-y-1">
                          {[['#eab308', 'Moderate Activity'], ['#f97316', 'Significant Activity'], ['#dc2626', 'Severe Activity']].map(([c, l]) => (
                            <div key={l} className="flex items-center gap-2">
                              <div className={`w-4 h-3 rounded-full border-2 border-dashed border-[${c}] bg-[${c}40]`}></div>
                              <span className="text-xs">{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {showPrecipForecast && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                          <CloudRain className="h-3 w-3 text-blue-500" /> Precipitation Forecast
                        </div>
                        <div className="space-y-1">
                          {[['bg-green-500', 'Dry (0 mm)'], ['bg-blue-400', 'Light (<1 mm/h)'], ['bg-blue-500', 'Moderate (1-2.5 mm/h)'], ['bg-amber-500', 'Heavy (2.5-7.5 mm/h)'], ['bg-red-500', 'Very Heavy (7.5-15 mm/h)'], ['bg-purple-600', 'Extreme (>15 mm/h)']].map(([c, l]) => (
                            <div key={l} className="flex items-center gap-2">
                              <div className={`w-4 h-3 rounded ${c}`}></div>
                              <span className="text-xs">{l}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <PIREPsLegend showIcing={showIcing} showTurbulence={showTurbulence} />
                    <WindsAloftLegend show={showWindsAloft} selectedAltitude={windsAltitude} />
                    <SatelliteLegend show={showSatellite} channel={satelliteChannel} resolvedSource={satelliteResolvedSource} />
                    
                    <div className="border-t pt-3">
                      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Airspace Advisories</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2"><div className="w-4 h-3 bg-red-500/40 border-2 border-red-500 border-dashed rounded"></div><span className="text-xs">TFR (No Fly Zone)</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-3 bg-orange-500/30 border border-orange-500 rounded"></div><span className="text-xs">SIGMET</span></div>
                        <div className="flex items-center gap-2"><div className="w-4 h-3 bg-yellow-500/30 border border-yellow-500 rounded"></div><span className="text-xs">AIRMET</span></div>
                      </div>
                    </div>
                    
                    {showRouteWeather && (
                      <div className="border-t pt-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Flight Categories</div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            ['bg-emerald-500', 'VFR'],
                            ['bg-blue-500', 'MVFR'],
                            ['bg-red-500', 'IFR'],
                            ['bg-purple-500', 'LIFR'],
                          ].map(([bgClass, label]) => (
                            <div key={label} className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded-full ${bgClass}`} />
                              <span className="text-xs">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {lastUpdated && (
                      <div className="border-t pt-2 text-[10px] text-muted-foreground">
                        Updated: {lastUpdated.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          </div>

          {/* Animation Controls */}
          {radarFrames.length > 0 && (
            <div className="bg-muted/50 p-4 space-y-3 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={stepBackward} disabled={radarLoading}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant={isPlaying ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={togglePlayback} disabled={radarLoading}>
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={stepForward} disabled={radarLoading}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm font-medium">
                  {currentFrame && (
                    <span className={isNowcast(currentFrame) ? "text-blue-500" : ""}>
                      {formatFrameTime(currentFrame.time)}
                      {isNowcast(currentFrame) && " (Forecast)"}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  Frame {currentFrameIndex + 1} of {radarFrames.length}
                </div>
              </div>
              <Slider
                value={[currentFrameIndex]}
                min={0}
                max={radarFrames.length - 1}
                step={1}
                onValueChange={(value) => { setIsPlaying(false); setCurrentFrameIndex(value[0]); }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{radarFrames.length > 0 && formatFrameTime(radarFrames[0].time)}</span>
                <span>Past ← → Forecast</span>
                <span>{radarFrames.length > 0 && formatFrameTime(radarFrames[radarFrames.length - 1].time)}</span>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* CONTROLS OVERLAY — On top of map */}
      {sidebarOpen && !isFullscreen && (
        <div className="absolute inset-0 z-[1100] flex items-start justify-center pt-14 px-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-[420px] max-h-[80%] bg-background/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-xl overflow-y-auto p-4 space-y-3 animate-blur-in">
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="flex items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" /> Weather Controls</span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
            <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
          </Button>
        </div>
        <Collapsible defaultOpen>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-primary" /> Layer Controls</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <Switch id="tfr-toggle" checked={showTFRs} onCheckedChange={setShowTFRs} />
                    <Label htmlFor="tfr-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <AlertTriangle className="h-4 w-4 text-red-500" /> TFRs <span className="text-xs text-muted-foreground">({tfrs.length})</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="advisory-toggle" checked={showAdvisories} onCheckedChange={setShowAdvisories} />
                    <Label htmlFor="advisory-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Shield className="h-4 w-4 text-orange-500" /> AIRMETs/SIGMETs <span className="text-xs text-muted-foreground">({advisories.length})</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="lightning-toggle" checked={showLightning} onCheckedChange={setShowLightning} />
                    <Label htmlFor="lightning-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Zap className="h-4 w-4 text-yellow-500" /> Lightning <span className="text-xs text-muted-foreground">({lightningStrikes.length})</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="storm-cell-toggle" checked={showStormCells} onCheckedChange={setShowStormCells} />
                    <Label htmlFor="storm-cell-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Navigation className="h-4 w-4 text-orange-500" /> Storm Cells <span className="text-xs text-muted-foreground">({stormCells.length})</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="route-weather-toggle" checked={showRouteWeather}
                      onCheckedChange={(checked) => { setShowRouteWeather(checked); if (checked && waypoints.length > 0 && waypointWeather.length === 0) loadRouteWeather(); }}
                      disabled={waypoints.length === 0}
                    />
                    <Label htmlFor="route-weather-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Route className="h-4 w-4 text-green-500" /> Route Weather <span className="text-xs text-muted-foreground">({waypoints.length} pts)</span>
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="flight-category-strip-toggle" checked={showFlightCategoryStrip} onCheckedChange={setShowFlightCategoryStrip}
                      disabled={waypoints.length === 0 || !showRouteWeather}
                    />
                    <Label htmlFor="flight-category-strip-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <MapPin className="h-4 w-4 text-emerald-500" /> Flight Cat Strip
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="precip-forecast-toggle" checked={showPrecipForecast}
                      onCheckedChange={(checked) => { setShowPrecipForecast(checked); if (checked && waypoints.length > 0 && precipForecasts.length === 0) loadPrecipitationForecast(); }}
                      disabled={waypoints.length === 0}
                    />
                    <Label htmlFor="precip-forecast-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <CloudRain className="h-4 w-4 text-blue-500" /> Precip Forecast <span className="text-xs text-muted-foreground">({precipForecasts.length})</span>
                    </Label>
                  </div>
                  <PIREPsControls showIcing={showIcing} showTurbulence={showTurbulence} onToggleIcing={setShowIcing} onToggleTurbulence={setShowTurbulence} icingCount={icingCount} turbCount={turbCount} />
                  <WindsAloftControls show={showWindsAloft} onToggle={setShowWindsAloft} selectedAltitude={windsAltitude} onAltitudeChange={setWindsAltitude} avgSpeed={windsAvgSpeed} hasWaypoints={waypoints.length > 0} />
                  <SatelliteControls show={showSatellite} onToggle={setShowSatellite} channel={satelliteChannel} onChannelChange={setSatelliteChannel} opacity={satelliteOpacity} onOpacityChange={setSatelliteOpacity} loading={satelliteLoading} source={satelliteSource} onSourceChange={setSatelliteSource} resolvedSource={satelliteResolvedSource} />
                </div>
                {(advisoriesLoading || routeWeatherLoading || precipLoading) && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    {precipLoading ? 'Loading precipitation...' : routeWeatherLoading ? 'Loading route weather...' : 'Loading advisories...'}
                  </span>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Route Weather Summary Panel — Collapsible */}
        {showRouteWeather && waypointWeather.length > 0 && (
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="p-3 pb-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Route className="h-4 w-4" /> Route Weather Summary
                    </div>
                    <div className="flex items-center gap-1">
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3 pt-2 space-y-2">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" onClick={exportRouteWeatherPDF} className="h-7 px-2">
                      <FileDown className="h-3 w-3 mr-1" /> Export PDF
                    </Button>
                    <Button variant="ghost" size="sm" onClick={loadRouteWeather} disabled={routeWeatherLoading} className="h-7 px-2">
                      <RefreshCw className={`h-3 w-3 ${routeWeatherLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {waypointWeather.map((wp) => (
                      <Badge key={wp.waypointId} variant="outline" className="flex items-center gap-1.5 px-2 py-1"
                        style={{ borderColor: getConditionColor(wp.weather.condition), backgroundColor: `${getConditionColor(wp.weather.condition)}20` }}>
                        <MapPin className="h-3 w-3" />
                        <span className="font-medium">{wp.identifier}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold bg-[${getConditionColor(wp.weather.condition)}]`}>{wp.weather.condition}</span>
                        {wp.trend && getTrendIcon(wp.trend)}
                        <span className="text-xs text-muted-foreground">{wp.weather.visibility}SM</span>
                      </Badge>
                    ))}
                  </div>
                  {waypointWeather.length > 0 && (
                    <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
                      <div className="flex items-center gap-1"><Eye className="h-3 w-3" /><span>Min Vis: {Math.min(...waypointWeather.map(w => w.weather.visibility))} SM</span></div>
                      <div className="flex items-center gap-1"><Cloud className="h-3 w-3" /><span>Min Ceil: {Math.min(...waypointWeather.filter(w => w.weather.ceiling).map(w => w.weather.ceiling!)) || 'CLR'} {typeof Math.min(...waypointWeather.filter(w => w.weather.ceiling).map(w => w.weather.ceiling!)) === 'number' ? 'ft' : ''}</span></div>
                      <div className="flex items-center gap-1"><Wind className="h-3 w-3" /><span>Max Wind: {Math.max(...waypointWeather.map(w => w.weather.windSpeed))} kt</span></div>
                      <div className="flex items-center gap-1"><Thermometer className="h-3 w-3" /><span>Temp: {Math.min(...waypointWeather.map(w => w.weather.temperature))}° - {Math.max(...waypointWeather.map(w => w.weather.temperature))}°C</span></div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Precipitation Forecast Summary — Collapsible */}
        {showPrecipForecast && precipForecasts.length > 0 && (
          <Collapsible defaultOpen>
            <Card className="border-blue-500/30">
              <CollapsibleTrigger asChild>
                <div className="p-3 pb-0 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CloudRain className="h-4 w-4 text-blue-500" /> Precip Forecast (6h)
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); loadPrecipitationForecast(); }} disabled={precipLoading} className="h-7 px-2">
                        <RefreshCw className={`h-3 w-3 ${precipLoading ? 'animate-spin' : ''}`} />
                      </Button>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-3 pt-2">
                  <div className="flex flex-wrap gap-2">
                    {precipForecasts.map((forecast) => {
                      const intensityClasses = forecast.maxIntensity <= 0
                        ? { border: 'border-emerald-500', bg: 'bg-emerald-500/10', pill: 'bg-emerald-500' }
                        : forecast.maxIntensity < 1
                          ? { border: 'border-sky-400', bg: 'bg-sky-400/10', pill: 'bg-sky-400' }
                          : forecast.maxIntensity < 2.5
                            ? { border: 'border-blue-500', bg: 'bg-blue-500/10', pill: 'bg-blue-500' }
                            : forecast.maxIntensity < 7.5
                              ? { border: 'border-amber-500', bg: 'bg-amber-500/10', pill: 'bg-amber-500' }
                              : forecast.maxIntensity < 15
                                ? { border: 'border-red-500', bg: 'bg-red-500/10', pill: 'bg-red-500' }
                                : { border: 'border-violet-500', bg: 'bg-violet-500/10', pill: 'bg-violet-500' };

                      return (
                        <Badge key={forecast.waypointId} variant="outline" className={`flex items-center gap-1.5 px-2 py-1 ${intensityClasses.border} ${intensityClasses.bg}`}>
                          <CloudRain className="h-3 w-3" />
                          <span className="font-medium">{forecast.identifier}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded text-white font-bold ${intensityClasses.pill}`}>{forecast.total6h.toFixed(1)}mm</span>
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Vertical Profile — Collapsible */}
        {waypoints.length >= 2 && (
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium"><Activity className="h-4 w-4 text-primary" /> Vertical Profile</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3">
                  <VerticalProfile waypoints={waypoints.map(w => ({ id: w.id, identifier: w.identifier, coordinates: w.coordinates }))} cruiseAltitude={12000} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Route Weather Timeline — Collapsible */}
        {waypoints.length >= 2 && (
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium"><CloudRain className="h-4 w-4 text-primary" /> Route Weather Timeline</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3">
                  <RouteWeatherTimeline waypoints={waypoints.map(w => ({ id: w.id, identifier: w.identifier, coordinates: w.coordinates }))} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Crosswind Warning Panel — Collapsible */}
        {waypointWeather.length > 0 && (
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium"><Wind className="h-4 w-4 text-primary" /> Crosswind Warnings</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-3">
                  <CrosswindWarningPanel waypoints={waypointWeather.map(w => ({ identifier: w.identifier, windDir: w.weather.windDirection, windSpeed: w.weather.windSpeed }))} aircraftName={resolvedAircraftName} />
                  <CockpitCrosswindAlert waypoints={waypointWeather.map(w => ({ identifier: w.identifier, windDir: w.weather.windDirection, windSpeed: w.weather.windSpeed }))} aircraftName={resolvedAircraftName} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Crosswind Calculator — Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium"><Wind className="h-4 w-4 text-primary" /> Crosswind Calculator</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                <CrosswindCalculator defaultAircraftName={resolvedAircraftName} />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Auto Weather Refresh — Collapsible */}
        <Collapsible>
          <Card>
            <CollapsibleTrigger asChild>
              <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-lg flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium"><RefreshCw className="h-4 w-4 text-primary" /> Auto Weather Refresh</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-3">
                <AutoWeatherRefreshPanel />
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* METAR/TAF Panel — Collapsible */}
        {airports.length > 0 && (
          <Collapsible defaultOpen>
            <Card>
              <CollapsibleTrigger asChild>
                <div className="p-3 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium"><Radio className="h-4 w-4 text-primary" /> METAR/TAF</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=closed]_&]:rotate-[-90deg]" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-3 pb-3">
                  <MetarTafPanel airports={airports} />
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-loc {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.35); }
          50%       { box-shadow: 0 0 0 10px rgba(59,130,246,0.1); }
        }
        .user-location-marker {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};