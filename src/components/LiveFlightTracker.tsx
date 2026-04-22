
import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageTransition } from '@/components/ui/page-transition';
import {
  Plane, RefreshCw, Search, MapPin, Gauge, ArrowUp,
  Maximize2, Minimize2, Radio, Clock, Filter, X, Navigation, LocateFixed
} from 'lucide-react';

interface FlightState {
  icao24: string;
  callsign: string;
  origin_country: string;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  on_ground: boolean;
  geo_altitude: number | null;
  squawk: string | null;
}

// OpenSky endpoints — try direct first, fall back to public proxy
const OPENSKY_URLS = [
  'https://opensky-network.org/api/states/all?lamin=24&lomin=-125&lamax=50&lomax=-66',
  'https://opensky-network.org/api/states/all', // global fallback (smaller region)
];

export const LiveFlightTracker = () => {
  const [flights, setFlights] = useState<FlightState[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFlight, setSelectedFlight] = useState<FlightState | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [filterAirborne, setFilterAirborne] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFlightList, setShowFlightList] = useState(false);
  const [locating, setLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const mapInitRef = useRef(false);

  // ── Fetch flights ──────────────────────────────────────────────────────────
  const fetchFlights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(OPENSKY_URLS[0]);
      if (!res.ok) {
        if (res.status === 429) throw new Error('Rate limited — try again in a few seconds');
        if (res.status === 403) throw new Error('OpenSky requires login for this region — showing cached data');
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (!data.states) { setFlights([]); setLastUpdated(new Date()); return; }

      const parsed: FlightState[] = (data.states as any[][]).map(s => ({
        icao24: s[0] || '',
        callsign: (s[1] || '').trim(),
        origin_country: s[2] || '',
        longitude: s[5],
        latitude: s[6],
        baro_altitude: s[7],
        velocity: s[9],
        true_track: s[10],
        vertical_rate: s[11],
        on_ground: s[8],
        geo_altitude: s[13],
        squawk: s[14] || null,
      }));

      setFlights(parsed);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message);
      // Keep old flights so the map isn't cleared on a rate-limit error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlights();
    const interval = setInterval(fetchFlights, 15000);
    return () => clearInterval(interval);
  }, [fetchFlights]);

  // ── Init Leaflet map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInitRef.current) return;
    mapInitRef.current = true;

    import('leaflet').then(L => {
      leafletRef.current = L;

      // Fix default icon paths (broken in Vite bundles)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      if (mapRef.current) return; // guard double-init

      const map = L.map(mapContainerRef.current!, {
        center: [39.5, -98.35],
        zoom: 5,
        zoomControl: false,
        attributionControl: false,
      });

      // Satellite base layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 18,
      }).addTo(map);

      // Labels overlay
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        maxZoom: 18,
        subdomains: 'abcd',
        opacity: 0.7,
        pane: 'overlayPane',
      }).addTo(map);

      mapRef.current = map;
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapInitRef.current = false;
      }
    };
  }, []);

  // ── Update markers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const L = leafletRef.current;
    if (!mapRef.current || !L) return;

    // Clear old flight markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const visibleFlights = flights.filter(f => {
      if (!f.latitude || !f.longitude) return false;
      if (filterAirborne && f.on_ground) return false;
      return true;
    });

    const displayFlights = visibleFlights.slice(0, 600);

    displayFlights.forEach(flight => {
      const rotation = flight.true_track ?? 0;
      const isSelected = selectedFlight?.icao24 === flight.icao24;

      const altColor =
        !flight.baro_altitude ? '#94a3b8'
        : flight.baro_altitude > 10000 ? '#60a5fa'
        : flight.baro_altitude > 5000  ? '#4ade80'
        : '#fbbf24';

      const glowFilter = isSelected
        ? 'drop-shadow(0 0 6px #60a5fa) drop-shadow(0 0 12px #3b82f6)'
        : '';

      // Proper airplane icon pointing in direction of travel
      const icon = L.divIcon({
        className: 'flight-marker',
        html: `<div style="
          transform: rotate(${rotation}deg);
          transition: transform 0.8s ease;
          width:22px; height:22px;
          display:flex; align-items:center; justify-content:center;
          filter: ${glowFilter};
        ">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="${isSelected ? '#60a5fa' : altColor}">
            <path d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"/>
          </svg>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([flight.latitude!, flight.longitude!], { icon })
        .on('click', () => setSelectedFlight(flight))
        .addTo(mapRef.current!);

      if (flight.callsign) {
        marker.bindTooltip(flight.callsign, {
          permanent: false,
          direction: 'top',
          offset: [0, -14],
          className: 'flight-tooltip',
        });
      }

      markersRef.current.push(marker);
    });
  }, [flights, filterAirborne, selectedFlight]);

  // ── Go to my location ──────────────────────────────────────────────────────
  const goToMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const L = leafletRef.current;
        if (mapRef.current && L) {
          mapRef.current.flyTo([latitude, longitude], 9, { duration: 1.8 });

          // Remove old user marker
          if (userMarkerRef.current) userMarkerRef.current.remove();

          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div style="
              width:18px; height:18px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 0 0 4px rgba(59,130,246,0.35);
              animation: pulse-loc 2s ease-in-out infinite;
            "></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 1000 })
            .bindPopup(`<b>Your Location</b><br>${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`)
            .addTo(mapRef.current)
            .openPopup();
        }
        setLocating(false);
      },
      err => {
        setError(`Location error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const flyToFlight = (flight: FlightState) => {
    setSelectedFlight(flight);
    if (mapRef.current && flight.latitude && flight.longitude) {
      mapRef.current.flyTo([flight.latitude, flight.longitude], 9, { duration: 1.5 });
    }
  };

  const filteredFlights = flights.filter(f => {
    if (!f.latitude || !f.longitude) return false;
    if (filterAirborne && f.on_ground) return false;
    if (searchTerm) {
      const term = searchTerm.toUpperCase();
      return f.callsign.includes(term) || f.icao24.toUpperCase().includes(term);
    }
    return true;
  });

  const metersToFeet = (m: number | null) => m ? Math.round(m * 3.281).toLocaleString() : '—';
  const msToKnots   = (ms: number | null) => ms ? Math.round(ms * 1.944) : '—';
  const fpmFromMs   = (ms: number | null) => ms ? Math.round(ms * 196.85).toLocaleString() : '—';

  return (
    <PageTransition>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Live Flight Tracker</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Real-time aircraft positions • Auto-refreshes every 15s
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={fetchFlights} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Tracked', value: filteredFlights.length.toLocaleString(), icon: <Plane className="h-4 w-4" />, color: 'text-primary' },
            { label: 'Airborne', value: flights.filter(f => !f.on_ground && f.latitude).length.toLocaleString(), icon: <ArrowUp className="h-4 w-4" />, color: 'text-green-500' },
            { label: 'Countries', value: [...new Set(flights.map(f => f.origin_country))].length, icon: <MapPin className="h-4 w-4" />, color: 'text-yellow-500' },
            { label: 'Interval', value: '15s', icon: <Radio className="h-4 w-4" />, color: 'text-muted-foreground' },
          ].map((stat, i) => (
            <Card key={i} className="glass-card hover-lift">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={stat.color}>{stat.icon}</div>
                <div>
                  <div className="text-lg font-semibold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map + Sidebar */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'relative'} flex flex-col lg:flex-row gap-4`}>
          {/* Map */}
          <div className={`relative flex-1 rounded-xl overflow-hidden border border-border/50 ${isFullscreen ? 'h-full' : 'h-[550px] lg:h-[640px]'}`}>
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Zoom Controls */}
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-1">
              <button
                className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur border border-border/60 text-foreground hover:bg-muted font-bold text-lg flex items-center justify-center shadow-md transition"
                onClick={() => mapRef.current?.zoomIn()}
              >+</button>
              <button
                className="w-8 h-8 rounded-lg bg-background/90 backdrop-blur border border-border/60 text-foreground hover:bg-muted font-bold text-lg flex items-center justify-center shadow-md transition"
                onClick={() => mapRef.current?.zoomOut()}
              >−</button>
            </div>

            {/* Top-right Controls */}
            <div className="absolute top-4 right-4 z-[1000] flex gap-2 flex-wrap justify-end">
              {/* My Location */}
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs bg-background/90 backdrop-blur border-border/60 hover:bg-blue-500 hover:text-white transition-all"
                onClick={goToMyLocation}
                disabled={locating}
                title="Go to my location"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${locating ? 'animate-pulse text-blue-400' : ''}`} />
                {locating ? 'Locating…' : 'My Location'}
              </Button>

              <Button
                size="icon"
                variant={showFlightList ? 'default' : 'outline'}
                className="h-8 w-8 bg-background/90 backdrop-blur border-border/60"
                onClick={() => setShowFlightList(!showFlightList)}
                title="Search flights"
              >
                <Search className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant={filterAirborne ? 'default' : 'outline'}
                onClick={() => setFilterAirborne(!filterAirborne)}
                className="gap-1.5 text-xs h-8 bg-background/90 backdrop-blur border-border/60"
              >
                <Filter className="h-3 w-3" />
                Airborne only
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 bg-background/90 backdrop-blur border-border/60"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
            </div>

            {/* Altitude Legend */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-background/90 backdrop-blur-sm border border-border/40 rounded-lg p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Altitude</p>
              {[
                { color: '#60a5fa', label: '> 10,000 ft' },
                { color: '#4ade80', label: '5,000–10,000 ft' },
                { color: '#fbbf24', label: '< 5,000 ft' },
                { color: '#94a3b8', label: 'Unknown' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive/10 backdrop-blur border border-destructive/30 text-destructive rounded-lg px-4 py-2 text-sm max-w-[340px] text-center">
                {error}
              </div>
            )}

            {/* Loading spinner overlay */}
            {loading && flights.length === 0 && (
              <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading live flight data…</p>
                </div>
              </div>
            )}
          </div>

          {/* Flight List Sidebar */}
          {showFlightList && (
            <div className={`${isFullscreen ? 'absolute right-4 top-16 bottom-4 w-80 z-[1000]' : 'lg:w-80'} flex flex-col gap-3 animate-blur-in`}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search callsign or ICAO…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 glass-input h-9 text-sm"
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowFlightList(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className={`${isFullscreen ? 'flex-1' : 'max-h-[520px]'} overflow-y-auto space-y-1.5 pr-1`}>
                {filteredFlights.slice(0, 120).map(flight => (
                  <button
                    key={flight.icao24}
                    onClick={() => flyToFlight(flight)}
                    className={`w-full text-left p-3 rounded-lg border transition-all duration-200 hover-lift
                      ${selectedFlight?.icao24 === flight.icao24
                        ? 'bg-primary/10 border-primary/30 shadow-sm'
                        : 'border-border/40 hover:bg-muted/60'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-foreground">{flight.callsign || flight.icao24.toUpperCase()}</span>
                      <Badge variant="outline" className="text-[10px] h-5">{flight.origin_country}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ArrowUp className="h-3 w-3" />{metersToFeet(flight.baro_altitude)} ft
                      </span>
                      <span className="flex items-center gap-1">
                        <Gauge className="h-3 w-3" />{msToKnots(flight.velocity)} kts
                      </span>
                      <span className="flex items-center gap-1">
                        <Navigation className="h-3 w-3" />{Math.round(flight.true_track ?? 0)}°
                      </span>
                    </div>
                  </button>
                ))}
                {filteredFlights.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plane className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{loading ? 'Loading flights…' : 'No flights found'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Flight Detail */}
        {selectedFlight && (
          <Card className="glass-card animate-slide-in-up">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Plane className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedFlight.callsign || selectedFlight.icao24.toUpperCase()}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedFlight.origin_country} • ICAO: {selectedFlight.icao24.toUpperCase()}
                      {selectedFlight.squawk && ` • Squawk: ${selectedFlight.squawk}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selectedFlight.on_ground ? 'secondary' : 'default'} className="text-xs">
                    {selectedFlight.on_ground ? 'On Ground' : 'Airborne'}
                  </Badge>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedFlight(null)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Altitude', value: `${metersToFeet(selectedFlight.baro_altitude)} ft`, sub: 'Barometric' },
                  { label: 'Ground Speed', value: `${msToKnots(selectedFlight.velocity)} kts`, sub: 'True airspeed' },
                  { label: 'Vertical Rate', value: `${fpmFromMs(selectedFlight.vertical_rate)} fpm`, sub: selectedFlight.vertical_rate && selectedFlight.vertical_rate > 100 ? '↑ Climbing' : selectedFlight.vertical_rate && selectedFlight.vertical_rate < -100 ? '↓ Descending' : '→ Level' },
                  { label: 'Track', value: `${Math.round(selectedFlight.true_track ?? 0)}°`, sub: `Pos: ${selectedFlight.latitude?.toFixed(3)}°, ${selectedFlight.longitude?.toFixed(3)}°` },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
                    <div className="text-lg font-semibold">{item.value}</div>
                    <div className="text-[11px] text-muted-foreground">{item.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <style>{`
        .flight-tooltip {
          background: hsl(var(--popover)) !important;
          color: hsl(var(--foreground)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          padding: 4px 8px !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
        .flight-tooltip::before { display: none !important; }
        .flight-marker { background: none !important; border: none !important; }
        .user-location-marker { background: none !important; border: none !important; }
        @keyframes pulse-loc {
          0%, 100% { box-shadow: 0 0 0 4px rgba(59,130,246,0.35); }
          50%       { box-shadow: 0 0 0 8px rgba(59,130,246,0.15); }
        }
      `}</style>
    </PageTransition>
  );
};
