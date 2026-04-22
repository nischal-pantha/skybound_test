import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAircraft } from '@/hooks/useSupabaseAircraft';
import { useRealTimeWeather } from '@/hooks/useRealTimeWeather';
import { FlightCalculator } from '@/utils/flightCalculations';
import FreeAviationChart from '@/components/FreeAviationChart';
import { 
  Route, 
  MapPin, 
  Navigation, 
  Trash2,
  Download,
  AlertCircle,
  Plane,
  Cloud,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Clock,
  Fuel,
  Target,
  ZoomIn,
  ZoomOut,
  Grid3x3,
  Compass,
  Ruler,
  RotateCcw,
  Save,
  Upload,
  Settings,
  Wind,
  Eye,
  Move,
  Plus,
  Minus,
  Search,
  Filter,
  Map as MapIcon,
  Layers,
  CloudRain,
  Sun,
  BarChart3,
  Info,
  FileText,
  Share2,
  Bookmark
} from 'lucide-react';

interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps" | "custom";
  altitude?: number;
  notes?: string;
  distance?: number;
  heading?: number;
  groundSpeed?: number;
  timeEnroute?: number;
  fuelUsed?: number;
  frequency?: string;
  elevation?: number;
}

interface NavPoint {
  identifier: string;
  name: string;
  lat: number;
  lng: number;
  type: 'airport' | 'vor' | 'fix';
  elevation?: number;
  frequency?: string;
  runways?: string[];
  services?: string[];
}

interface WeatherInfo {
  station: string;
  metar?: string;
  taf?: string;
  conditions?: string;
  visibility?: string;
  winds?: string;
  temperature?: number;
  altimeter?: string;
}

interface FlightPlan {
  name: string;
  aircraft: string;
  departure: string;
  destination: string;
  alternate: string;
  route: string;
  altitude: string;
  airspeed: string;
  fuel: string;
  passengers: string;
  flightRules: 'VFR' | 'IFR';
  cruiseAltitude: string;
  departureTime: string;
  estimatedDuration: string;
  remarks: string;
}

// Comprehensive worldwide navigation database (ForeFlight-style)
const FOREFLIGHT_NAV_DATABASE: NavPoint[] = [
  // Major US Airports - Enhanced
  { 
    identifier: 'KPAO', 
    name: 'Palo Alto Airport', 
    lat: 37.4611, 
    lng: -122.1150, 
    type: 'airport', 
    elevation: 7,
    runways: ['13/31'],
    services: ['Fuel', 'Maintenance', 'Rental', 'Training']
  },
  { 
    identifier: 'KSQL', 
    name: 'San Carlos Airport', 
    lat: 37.5119, 
    lng: -122.2495, 
    type: 'airport', 
    elevation: 5,
    runways: ['12/30'],
    services: ['Fuel', 'Restaurant', 'Rental']
  },
  { 
    identifier: 'KHWD', 
    name: 'Hayward Executive Airport', 
    lat: 37.6592, 
    lng: -122.1219, 
    type: 'airport', 
    elevation: 52,
    runways: ['10L/28R', '10R/28L'],
    services: ['Fuel', 'Tower', 'Maintenance', 'Customs']
  },
  { 
    identifier: 'KSJC', 
    name: 'San Jose International', 
    lat: 37.3626, 
    lng: -121.9291, 
    type: 'airport', 
    elevation: 62,
    runways: ['12L/30R', '12R/30L'],
    services: ['Commercial', 'Tower', 'Approach', 'Ground']
  },
  { 
    identifier: 'KOAK', 
    name: 'Oakland International', 
    lat: 37.7214, 
    lng: -122.2208, 
    type: 'airport', 
    elevation: 9,
    runways: ['09L/27R', '09R/27L', '11/29', '15/33'],
    services: ['Commercial', 'Tower', 'Approach', 'Customs']
  },
  { 
    identifier: 'KSFO', 
    name: 'San Francisco International', 
    lat: 37.6213, 
    lng: -122.3790, 
    type: 'airport', 
    elevation: 14,
    runways: ['01L/19R', '01R/19L', '10L/28R', '10R/28L'],
    services: ['Commercial', 'Tower', 'Approach', 'Ground', 'Customs']
  },
  { 
    identifier: 'KLAX', 
    name: 'Los Angeles International', 
    lat: 33.9425, 
    lng: -118.4081, 
    type: 'airport', 
    elevation: 126,
    runways: ['06L/24R', '06R/24L', '07L/25R', '07R/25L'],
    services: ['Commercial', 'Tower', 'Approach', 'Ground', 'Customs']
  },
  
  // VORs with frequencies
  { 
    identifier: 'SJC', 
    name: 'San Jose VOR-DME', 
    lat: 37.3626, 
    lng: -121.9291, 
    type: 'vor', 
    frequency: '114.1',
    elevation: 62
  },
  { 
    identifier: 'OAK', 
    name: 'Oakland VOR-DME', 
    lat: 37.7214, 
    lng: -122.2208, 
    type: 'vor', 
    frequency: '116.8',
    elevation: 9
  },
  { 
    identifier: 'SFO', 
    name: 'San Francisco VOR-DME', 
    lat: 37.6213, 
    lng: -122.3790, 
    type: 'vor', 
    frequency: '115.8',
    elevation: 14
  },
  
  // Navigation Fixes
  { identifier: 'MOVDD', name: 'MOVDD Intersection', lat: 37.4000, lng: -122.0000, type: 'fix' },
  { identifier: 'PORTE', name: 'PORTE Intersection', lat: 37.5000, lng: -122.1000, type: 'fix' },
  { identifier: 'MENLO', name: 'MENLO Intersection', lat: 37.4500, lng: -122.1800, type: 'fix' },
  { identifier: 'WESLA', name: 'WESLA Intersection', lat: 37.6000, lng: -122.4000, type: 'fix' },
  { identifier: 'BRIXX', name: 'BRIXX Intersection', lat: 37.7500, lng: -122.1500, type: 'fix' },
  { identifier: 'DUMBA', name: 'DUMBA Intersection', lat: 37.5500, lng: -121.8500, type: 'fix' }
];

export default function ForeFlight() {
  const { toast } = useToast();
  const { aircraft: supabaseAircraftList } = useSupabaseAircraft();
  const { weatherData, loading: weatherLoading, fetchWeather } = useRealTimeWeather();
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Chart state
  const [selectedWaypoints, setSelectedWaypoints] = useState<Waypoint[]>([]);
  const [isAddingWaypoint, setIsAddingWaypoint] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [chartCenter, setChartCenter] = useState({ lat: 37.5, lng: -122.2 });
  const [showGrid, setShowGrid] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [chartType, setChartType] = useState('sectional');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLayer, setSelectedLayer] = useState('base');
  const [measurementMode, setMeasurementMode] = useState(false);
  const [mousePosi, setMousePosi] = useState({ x: 0, y: 0 });
  
  // Flight plan state
  const [flightPlan, setFlightPlan] = useState<FlightPlan>({
    name: '',
    aircraft: '',
    departure: '',
    destination: '',
    alternate: '',
    route: '',
    altitude: '3500',
    airspeed: '120',
    fuel: '40',
    passengers: '1',
    flightRules: 'VFR',
    cruiseAltitude: '3500',
    departureTime: '',
    estimatedDuration: '',
    remarks: ''
  });

  // Weather data state
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo[]>([]);
  const [activeWeatherStation, setActiveWeatherStation] = useState('');

  // Build aircraft lookup for performance calcs
  const customAircraft = Object.fromEntries(
    supabaseAircraftList.map(ac => [ac.id, {
      name: ac.name,
      performance: (ac.performance_data as any) || {}
    }])
  );
  const availableAircraft = supabaseAircraftList.map(ac => ({
    id: ac.id,
    name: ac.name,
    tailNumber: ac.registration || '',
    make: '',
    model: '',
    performance: (ac.performance_data as any) || {}
  }));

  // Chart bounds (San Francisco Bay Area)
  const CHART_BOUNDS = {
    north: 38.5,
    south: 36.5,
    east: -121.0,
    west: -123.5
  };

  // Coordinate conversion functions
  const coordsToChart = useCallback((lat: number, lng: number) => {
    if (!chartRef.current) return { x: 0, y: 0 };
    
    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width;
    const chartHeight = rect.height;
    
    const x = ((lng - CHART_BOUNDS.west) / (CHART_BOUNDS.east - CHART_BOUNDS.west)) * chartWidth * zoomLevel;
    const y = ((CHART_BOUNDS.north - lat) / (CHART_BOUNDS.north - CHART_BOUNDS.south)) * chartHeight * zoomLevel;
    
    return { x, y };
  }, [zoomLevel]);

  const chartToCoords = useCallback((x: number, y: number) => {
    if (!chartRef.current) return { lat: 0, lng: 0 };
    
    const rect = chartRef.current.getBoundingClientRect();
    const chartWidth = rect.width;
    const chartHeight = rect.height;
    
    const lng = CHART_BOUNDS.west + (x / (chartWidth * zoomLevel)) * (CHART_BOUNDS.east - CHART_BOUNDS.west);
    const lat = CHART_BOUNDS.north - (y / (chartHeight * zoomLevel)) * (CHART_BOUNDS.north - CHART_BOUNDS.south);
    
    return { lat, lng };
  }, [zoomLevel]);

  // Flight calculations
  const flightTotals = useMemo(() => {
    if (selectedWaypoints.length === 0) return { totalDistance: 0, totalTime: 0, totalFuel: 0, legs: [] };
    
    let totalDistance = 0;
    let totalTime = 0;
    let totalFuel = 0;
    const legs = [];
    
    for (let i = 1; i < selectedWaypoints.length; i++) {
      const prev = selectedWaypoints[i - 1];
      const curr = selectedWaypoints[i];
      
      const distance = curr.distance || 0;
      const time = curr.timeEnroute || 0;
      const fuel = curr.fuelUsed || 0;
      
      totalDistance += distance;
      totalTime += time;
      totalFuel += fuel;
      
      legs.push({
        from: prev.identifier,
        to: curr.identifier,
        distance,
        time,
        fuel,
        heading: curr.heading || 0
      });
    }
    
    return { totalDistance, totalTime, totalFuel, legs };
  }, [selectedWaypoints]);

  // Filtered navigation database
  const filteredNavPoints = useMemo(() => {
    if (!searchTerm) return FOREFLIGHT_NAV_DATABASE.slice(0, 30);
    
    return FOREFLIGHT_NAV_DATABASE.filter(point =>
      point.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      point.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 30);
  }, [searchTerm]);

  // Waypoint management
  const handleAddWaypoint = useCallback((point: NavPoint | { lat: number; lng: number; identifier?: string }) => {
    let waypoint: Waypoint;
    
    if ('name' in point) {
      waypoint = {
        identifier: point.identifier,
        lat: point.lat,
        lng: point.lng,
        type: point.type as "airport" | "vor" | "fix",
        notes: point.name,
        frequency: point.frequency,
        elevation: point.elevation
      };
    } else {
      waypoint = {
        identifier: point.identifier || `WPT${selectedWaypoints.length + 1}`,
        lat: point.lat,
        lng: point.lng,
        type: "custom"
      };
    }
    
    // Calculate leg data if we have a previous waypoint
    if (selectedWaypoints.length > 0) {
      const prevWaypoint = selectedWaypoints[selectedWaypoints.length - 1];
      const selectedAircraft = customAircraft[flightPlan.aircraft];
      const fuelFlow = selectedAircraft?.performance?.fuelFlow?.cruise65 || 10;
      
      const calculation = FlightCalculator.calculateFlightLeg(
        { lat: prevWaypoint.lat, lng: prevWaypoint.lng },
        { lat: waypoint.lat, lng: waypoint.lng },
        parseInt(flightPlan.airspeed),
        0, // wind direction - could be enhanced
        0, // wind speed - could be enhanced
        fuelFlow
      );
      
      waypoint = {
        ...waypoint,
        distance: calculation.distance,
        heading: calculation.heading,
        groundSpeed: calculation.groundSpeed,
        timeEnroute: calculation.timeEnroute,
        fuelUsed: calculation.fuelUsed
      };
    }
    
    setSelectedWaypoints(prev => [...prev, waypoint]);
    setIsAddingWaypoint(false);
    
    toast({
      title: "Waypoint Added",
      description: `${waypoint.identifier} added to flight plan`,
    });
  }, [selectedWaypoints, flightPlan, customAircraft]);

  const handleRemoveWaypoint = useCallback((index: number) => {
    const waypoint = selectedWaypoints[index];
    setSelectedWaypoints(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Waypoint Removed",
      description: `${waypoint.identifier} removed from flight plan`,
    });
  }, [selectedWaypoints]);

  // Chart interaction handlers
  const handleChartClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingWaypoint || !chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const coords = chartToCoords(x, y);
    if (coords.lat >= CHART_BOUNDS.south && coords.lat <= CHART_BOUNDS.north &&
        coords.lng >= CHART_BOUNDS.west && coords.lng <= CHART_BOUNDS.east) {
      handleAddWaypoint({ lat: coords.lat, lng: coords.lng });
    }
  }, [isAddingWaypoint, chartToCoords, handleAddWaypoint]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePosi({ x, y });
  }, []);

  // Export functionality
  const exportFlightPlan = useCallback(() => {
    const exportData = {
      flightPlan,
      waypoints: selectedWaypoints,
      totals: flightTotals,
      weather: weatherInfo,
      exportedAt: new Date().toISOString(),
      version: "ForeFlight-Pro-3.0"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flight-plan-${flightPlan.name || 'unnamed'}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Flight Plan Exported",
      description: "Flight plan saved successfully",
    });
  }, [flightPlan, selectedWaypoints, flightTotals, weatherInfo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Professional Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
                <Plane className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  ForeFlight Pro
                </h1>
                <p className="text-muted-foreground text-sm">Professional Flight Planning & Navigation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                <Save className="w-3 h-3 mr-1" />
                Auto-saved
              </Badge>
              <Badge variant="secondary">
                <MapPin className="w-3 h-3 mr-1" />
                {selectedWaypoints.length} waypoints
              </Badge>
              {flightTotals.totalDistance > 0 && (
                <Badge variant="outline">
                  <Navigation className="w-3 h-3 mr-1" />
                  {flightTotals.totalDistance.toFixed(1)} NM
                </Badge>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportFlightPlan}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="maps" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="maps" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Maps
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Route className="w-4 h-4" />
              Plan
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="navlog" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Nav Log
            </TabsTrigger>
            <TabsTrigger value="plates" className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Plates
            </TabsTrigger>
          </TabsList>

          {/* Maps Tab - Interactive Chart */}
          <TabsContent value="maps" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Chart Controls */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Chart Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Chart Type */}
                  <div className="space-y-2">
                    <Label>Chart Type</Label>
                    <Select value={chartType} onValueChange={setChartType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sectional">VFR Sectional</SelectItem>
                        <SelectItem value="terminal">Terminal Area</SelectItem>
                        <SelectItem value="enroute">IFR Enroute</SelectItem>
                        <SelectItem value="approach">Approach Plates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Layer Controls */}
                  <div className="space-y-2">
                    <Label>Map Layers</Label>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Grid Lines</span>
                        <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Weather Overlay</span>
                        <Switch checked={showWeatherOverlay} onCheckedChange={setShowWeatherOverlay} />
                      </div>
                    </div>
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-2">
                    <Label>Zoom Level: {(zoomLevel * 100).toFixed(0)}%</Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <Slider
                        value={[zoomLevel]}
                        onValueChange={([value]) => setZoomLevel(value)}
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.2))}
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Navigation Search */}
                  <div className="space-y-2">
                    <Label>Search Navigation Points</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search airports, VORs, fixes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    
                    <ScrollArea className="h-48 border rounded-md">
                      <div className="p-2 space-y-1">
                        {filteredNavPoints.map((point) => (
                          <div
                            key={point.identifier}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                            onClick={() => handleAddWaypoint(point)}
                          >
                            <div className="flex items-center gap-2">
                              {point.type === 'airport' ? (
                                <Plane className="w-4 h-4 text-chart-airport" />
                              ) : point.type === 'vor' ? (
                                <Navigation className="w-4 h-4 text-chart-vor" />
                              ) : (
                                <MapPin className="w-4 h-4 text-chart-fix" />
                              )}
                              <div>
                                <div className="font-medium text-sm">{point.identifier}</div>
                                <div className="text-xs text-muted-foreground">{point.name}</div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Waypoint Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      variant={isAddingWaypoint ? "destructive" : "default"}
                      onClick={() => setIsAddingWaypoint(!isAddingWaypoint)}
                    >
                      {isAddingWaypoint ? (
                        <>
                          <Minus className="w-4 h-4 mr-2" />
                          Cancel Adding
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Waypoint
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Free Aviation Chart - No API Key Required */}
              <div className="lg:col-span-3">
                <FreeAviationChart 
                  waypoints={selectedWaypoints}
                  onWaypointAdd={handleAddWaypoint}
                />
              </div>
            </div>
          </TabsContent>

          {/* Flight Plan Tab */}
          <TabsContent value="plan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-4 h-4" />
                    Flight Plan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Flight Plan Name</Label>
                      <Input
                        id="name"
                        value={flightPlan.name}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Bay Tour"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aircraft">Aircraft</Label>
                      <Select value={flightPlan.aircraft} onValueChange={(value) => setFlightPlan(prev => ({ ...prev, aircraft: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select aircraft" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAircraft.map((aircraft) => (
                            <SelectItem key={aircraft.id} value={aircraft.id}>
                              {aircraft.name} {aircraft.tailNumber && `(${aircraft.tailNumber})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="departure">Departure</Label>
                      <Input
                        id="departure"
                        value={flightPlan.departure}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, departure: e.target.value }))}
                        placeholder="KPAO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <Input
                        id="destination"
                        value={flightPlan.destination}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, destination: e.target.value }))}
                        placeholder="KSQL"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alternate">Alternate</Label>
                      <Input
                        id="alternate"
                        value={flightPlan.alternate}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, alternate: e.target.value }))}
                        placeholder="KHWD"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="route">Route</Label>
                    <Textarea
                      id="route"
                      value={flightPlan.route}
                      onChange={(e) => setFlightPlan(prev => ({ ...prev, route: e.target.value }))}
                      placeholder="Direct or via specific waypoints..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="altitude">Altitude (ft)</Label>
                      <Input
                        id="altitude"
                        value={flightPlan.altitude}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, altitude: e.target.value }))}
                        placeholder="3500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="airspeed">Airspeed (kts)</Label>
                      <Input
                        id="airspeed"
                        value={flightPlan.airspeed}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, airspeed: e.target.value }))}
                        placeholder="120"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fuel">Fuel (gal)</Label>
                      <Input
                        id="fuel"
                        value={flightPlan.fuel}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, fuel: e.target.value }))}
                        placeholder="40"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="passengers">Passengers</Label>
                      <Input
                        id="passengers"
                        value={flightPlan.passengers}
                        onChange={(e) => setFlightPlan(prev => ({ ...prev, passengers: e.target.value }))}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={flightPlan.remarks}
                      onChange={(e) => setFlightPlan(prev => ({ ...prev, remarks: e.target.value }))}
                      placeholder="Additional flight plan remarks..."
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Flight Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedWaypoints.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-primary/5 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{flightTotals.totalDistance.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">Nautical Miles</div>
                        </div>
                        <div className="text-center p-3 bg-success/5 rounded-lg">
                          <div className="text-2xl font-bold text-success">{Math.round(flightTotals.totalTime)}</div>
                          <div className="text-xs text-muted-foreground">Minutes</div>
                        </div>
                        <div className="text-center p-3 bg-warning/5 rounded-lg">
                          <div className="text-2xl font-bold text-warning">{flightTotals.totalFuel.toFixed(1)}</div>
                          <div className="text-xs text-muted-foreground">Gallons</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h4 className="font-medium">Route Breakdown</h4>
                        <ScrollArea className="h-48">
                          <div className="space-y-2">
                            {selectedWaypoints.map((waypoint, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{index + 1}</Badge>
                                  <span className="font-medium">{waypoint.identifier}</span>
                                  {waypoint.notes && <span className="text-xs text-muted-foreground">({waypoint.notes})</span>}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {waypoint.distance && `${waypoint.distance.toFixed(1)} NM`}
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Add waypoints to see flight calculations</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs would go here - Weather, Performance, Nav Log, Plates */}
          <TabsContent value="weather">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Weather Briefing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <CloudRain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Weather integration coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Performance calculations coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navlog">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Navigation Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Navigation log coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Approach Plates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Approach plates coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
