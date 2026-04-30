import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/AppContext';
import { useSupabaseAircraft } from '@/hooks/useSupabaseAircraft';
import { useNotifications } from '@/contexts/NotificationContext';
import { UnifiedAviationChart } from './chart/UnifiedAviationChart';
import { GPSTracker } from './GPSTracker';
import { 
  MapPin, Plus, Trash2, Save, Calculator, CloudSun, AlertTriangle,
  Navigation, Fuel, Clock, Plane, FileText, CheckCircle, RefreshCw,
  Download, Upload, Loader2, History, TrendingUp, Wind, Gauge
} from 'lucide-react';

export const IntegratedFlightPlanning = () => {
  const {
    currentFlightPlan, updateFlightPlan, addWaypoint, removeWaypoint,
    calculateFlightPlan, saveFlightPlan, loadFlightPlan, deleteFlightPlan,
    savedFlightPlans, gpsPosition, weatherData, fetchWeatherData,
    fetchAirportData, notams, fetchNOTAMs, selectedAircraft, isOnline, syncStatus
  } = useAppContext();
  
  const { aircraft: supabaseAircraftList } = useSupabaseAircraft();
  const { notify } = useNotifications();
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSavedPlans, setShowSavedPlans] = useState(false);
  const [briefingNotes, setBriefingNotes] = useState('');
  
  // Build a lookup for aircraft keyed by ID (for performance tab)
  const aircraft = Object.fromEntries(
    supabaseAircraftList.map(ac => [ac.id, {
      name: ac.name,
      fuelCapacity: ac.max_fuel || 0,
      performance: (ac.performance_data as any) || {}
    }])
  );
  const aircraftList = supabaseAircraftList.map(ac => ({
    id: ac.id, name: `${ac.name}${ac.registration ? ' - ' + ac.registration : ''}`
  }));

  useEffect(() => {
    if (currentFlightPlan?.departure) {
      fetchWeatherData(currentFlightPlan.departure);
      fetchAirportData(currentFlightPlan.departure);
      fetchNOTAMs(currentFlightPlan.departure);
    }
    if (currentFlightPlan?.destination) {
      fetchWeatherData(currentFlightPlan.destination);
      fetchAirportData(currentFlightPlan.destination);
      fetchNOTAMs(currentFlightPlan.destination);
    }
  }, [currentFlightPlan?.departure, currentFlightPlan?.destination]);

  const handleAddWaypoint = () => {
    const identifier = prompt('Enter waypoint identifier (e.g., VPAS, FIX1):');
    if (!identifier) return;
    const latStr = prompt('Enter latitude (decimal, e.g., 37.6213):');
    const lngStr = prompt('Enter longitude (decimal, e.g., -122.3790):');
    if (!latStr || !lngStr) { notify.error('Invalid Input', 'Latitude and longitude are required'); return; }
    const lat = parseFloat(latStr), lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      notify.error('Invalid Coordinates', 'Please enter valid coordinates'); return;
    }
    const newWaypoint = { identifier: identifier.toUpperCase(), lat, lng, type: 'custom' as const };
    addWaypoint(newWaypoint);
    if (currentFlightPlan) {
      const updatedWaypoints = [...(currentFlightPlan.waypoints || []), newWaypoint];
      updateFlightPlan({ route: updatedWaypoints.map(w => w.identifier).join(' ') });
      setTimeout(() => calculateFlightPlan(), 100);
    }
    notify.success('Waypoint Added', `${identifier.toUpperCase()} added`);
  };

  const handleAddCurrentPosition = () => {
    if (!gpsPosition) { notify.error('GPS Unavailable', 'Please enable GPS tracking first'); return; }
    const identifier = `GPS${Date.now().toString().slice(-4)}`;
    const newWaypoint = { identifier, lat: gpsPosition.latitude, lng: gpsPosition.longitude, type: 'gps' as const, altitude: gpsPosition.altitude || undefined };
    addWaypoint(newWaypoint);
    if (currentFlightPlan) {
      const updatedWaypoints = [...(currentFlightPlan.waypoints || []), newWaypoint];
      updateFlightPlan({ route: updatedWaypoints.map(w => w.identifier).join(' ') });
      setTimeout(() => calculateFlightPlan(), 100);
    }
    notify.success('Position Added', `GPS position saved as ${identifier}`);
  };

  const handleCalculate = async () => {
    if (!currentFlightPlan?.departure || !currentFlightPlan?.destination) {
      notify.error('Missing Information', 'Please enter departure and destination'); return;
    }
    setIsCalculating(true);
    setTimeout(() => { calculateFlightPlan(); setIsCalculating(false); notify.success('Calculated', 'Flight plan calculated'); }, 1000);
  };

  const handleSave = () => {
    if (!currentFlightPlan?.departure || !currentFlightPlan?.destination) {
      notify.error('Cannot Save', 'Incomplete flight plan'); return;
    }
    saveFlightPlan();
    notify.success('Saved', `${currentFlightPlan.departure} → ${currentFlightPlan.destination}`);
  };

  const handleExportJSON = () => {
    if (!currentFlightPlan) return;
    const blob = new Blob([JSON.stringify(currentFlightPlan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flight-plan-${currentFlightPlan.departure}-${currentFlightPlan.destination}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success('Exported', 'JSON file downloaded');
  };

  const getFuelRequired = () => {
    if (!currentFlightPlan?.totalTime || !selectedAircraft) return 0;
    const ac = aircraft[selectedAircraft];
    if (!ac?.performance?.fuelFlow?.cruise65) return 0;
    return Math.ceil((currentFlightPlan.totalTime / 60) * ac.performance.fuelFlow.cruise65);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Flight Planning</h2>
          <p className="text-sm text-muted-foreground mt-1">Integrated GPS, weather & navigation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`rounded-full text-[11px] px-2.5 py-0.5 ${isOnline ? 'border-success/40 text-success' : 'border-destructive/40 text-destructive'}`}>
            {isOnline ? '● Online' : '○ Offline'}
          </Badge>
          <Badge variant="outline" className="rounded-full text-[11px] px-2.5 py-0.5 border-border/60">
            {syncStatus === 'synced' ? <CheckCircle className="h-3 w-3 mr-1" /> : <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
            {syncStatus}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="planning" className="space-y-5">
        <TabsList className="h-10 p-1 rounded-xl bg-muted/50 backdrop-blur-sm w-full grid grid-cols-5">
          <TabsTrigger value="planning" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Flight Plan</TabsTrigger>
          <TabsTrigger value="chart" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Chart</TabsTrigger>
          <TabsTrigger value="weather" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Weather</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Performance</TabsTrigger>
          <TabsTrigger value="gps" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">GPS</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-5">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              Flight Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aircraft</Label>
                <Select value={currentFlightPlan?.aircraft || selectedAircraft || ''} onValueChange={(v) => updateFlightPlan({ aircraft: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50"><SelectValue placeholder="Select aircraft" /></SelectTrigger>
                  <SelectContent>{aircraftList.map(ac => <SelectItem key={ac.id} value={ac.id}>{ac.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flight Rules</Label>
                <Select value={currentFlightPlan?.flightRules || 'VFR'} onValueChange={(v: 'VFR' | 'IFR') => updateFlightPlan({ flightRules: v })}>
                  <SelectTrigger className="h-11 rounded-xl border-border/60 bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VFR">VFR</SelectItem>
                    <SelectItem value="IFR">IFR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {[
                { key: 'departure', label: 'Departure (ICAO)', placeholder: 'KPAO', maxLength: 4 },
                { key: 'destination', label: 'Destination (ICAO)', placeholder: 'KSQL', maxLength: 4 },
                { key: 'alternate', label: 'Alternate (ICAO)', placeholder: 'KHWD', maxLength: 4 },
                { key: 'altitude', label: 'Cruise Altitude (ft)', placeholder: '5500' },
                { key: 'airspeed', label: 'True Airspeed (kts)', placeholder: '120' },
                { key: 'passengers', label: 'Passengers', placeholder: '3' },
              ].map(field => (
                <div key={field.key} className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={(currentFlightPlan as any)?.[field.key] || ''}
                    onChange={(e) => updateFlightPlan({ [field.key]: field.key === 'departure' || field.key === 'destination' || field.key === 'alternate' ? e.target.value.toUpperCase() : e.target.value })}
                    maxLength={field.maxLength}
                    className="h-11 rounded-xl border-border/60 bg-background/50 font-mono"
                  />
                </div>
              ))}
            </div>

            <Separator className="bg-border/30" />

            {/* Waypoints */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-foreground">Waypoints</h4>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAddCurrentPosition} className="rounded-lg h-8 text-xs">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" /> GPS Position
                  </Button>
                  <Button size="sm" onClick={handleAddWaypoint} className="rounded-lg h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Waypoint
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {currentFlightPlan?.waypoints?.map((waypoint, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl group hover:bg-muted/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center">{idx + 1}</div>
                    <div className="flex-1 grid grid-cols-4 gap-2 text-sm">
                      <div><span className="font-medium text-foreground">{waypoint.identifier}</span> <span className="text-muted-foreground text-xs">{waypoint.type}</span></div>
                      <div className="text-muted-foreground">{waypoint.distance ? `${waypoint.distance.toFixed(1)} nm` : '-'}</div>
                      <div className="text-muted-foreground">{waypoint.heading ? `${waypoint.heading}°` : '-'}</div>
                      <div className="text-muted-foreground">{waypoint.timeEnroute ? `${waypoint.timeEnroute.toFixed(0)} min` : '-'}</div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      removeWaypoint(idx);
                      if (currentFlightPlan?.waypoints) {
                        const newWaypoints = currentFlightPlan.waypoints.filter((_, i) => i !== idx);
                        updateFlightPlan({ route: newWaypoints.map(w => w.identifier).join(' ') });
                        setTimeout(() => calculateFlightPlan(), 100);
                      }
                    }} className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                {(!currentFlightPlan?.waypoints || currentFlightPlan.waypoints.length === 0) && (
                  <div className="text-center py-10 text-muted-foreground text-sm">No waypoints added yet</div>
                )}
              </div>
            </div>

            {/* Summary Stats */}
            {currentFlightPlan?.totalDistance && (
              <>
                <Separator className="bg-border/30" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Distance', value: `${currentFlightPlan.totalDistance.toFixed(1)} nm` },
                    { label: 'Flight Time', value: `${(currentFlightPlan.totalTime || 0).toFixed(0)} min` },
                    { label: 'Fuel Required', value: `${getFuelRequired()} gal` },
                    { label: 'Reserve', value: selectedAircraft && aircraft[selectedAircraft]?.fuelCapacity ? `${(aircraft[selectedAircraft].fuelCapacity! - getFuelRequired()).toFixed(0)} gal` : '-' },
                  ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                      <div className="text-xl font-semibold text-foreground mt-1">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleCalculate} className="flex-1 h-11 rounded-xl" disabled={isCalculating}>
                {isCalculating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Calculating…</> : <><Calculator className="h-4 w-4 mr-2" />Calculate</>}
              </Button>
              <Button onClick={handleSave} variant="outline" className="flex-1 h-11 rounded-xl"><Save className="h-4 w-4 mr-2" />Save</Button>
              <Button onClick={handleExportJSON} variant="outline" className="flex-1 h-11 rounded-xl"><Download className="h-4 w-4 mr-2" />Export</Button>
              <Button onClick={() => setShowSavedPlans(!showSavedPlans)} variant="outline" className="h-11 rounded-xl">
                <History className="h-4 w-4 mr-2" />{showSavedPlans ? 'Hide' : 'History'}
              </Button>
            </div>
          </div>

          {/* NOTAMs */}
          {notams.length > 0 && (
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                NOTAMs
              </h3>
              <div className="space-y-2">
                {notams.map(notam => (
                  <div key={notam.id} className="p-4 bg-warning/5 border border-warning/15 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{notam.location} — {notam.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notam.description}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">{new Date(notam.effective).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="chart">
          <div className="rounded-2xl overflow-hidden border border-border/40">
            <UnifiedAviationChart
              waypoints={currentFlightPlan?.waypoints}
              onWaypointAdd={(waypoint) => { 
                addWaypoint(waypoint); 
                notify.success('Waypoint Added', `${waypoint.identifier} added`); 
                if (currentFlightPlan) {
                  const updatedWaypoints = [...(currentFlightPlan.waypoints || []), waypoint];
                  updateFlightPlan({ route: updatedWaypoints.map(w => w.identifier).join(' ') });
                  setTimeout(() => calculateFlightPlan(), 100);
                }
              }}
              onWaypointRemove={(waypoint, index) => {
                removeWaypoint(index);
                notify.success('Waypoint Removed', `${waypoint.identifier} removed`);
                if (currentFlightPlan?.waypoints) {
                  const newWaypoints = currentFlightPlan.waypoints.filter((_, i) => i !== index);
                  updateFlightPlan({ route: newWaypoints.map(w => w.identifier).join(' ') });
                  setTimeout(() => calculateFlightPlan(), 100);
                }
              }}
              minHeight="600px"
              className="animate-fade-in"
            />
          </div>
        </TabsContent>

        <TabsContent value="weather">
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-primary" />
              Route Weather
            </h3>
            {[currentFlightPlan?.departure, currentFlightPlan?.destination].filter(Boolean).map(airport => {
              const wd = weatherData instanceof Map ? weatherData.get(airport!) : weatherData[airport!];
              if (!wd) return null;
              return (
                <div key={airport} className="p-5 bg-muted/30 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">{airport}</h4>
                    <Badge variant="outline" className={`rounded-full text-xs ${wd.flightRules === 'VFR' || wd.conditions === 'VFR' ? 'border-success/40 text-success' : 'border-destructive/40 text-destructive'}`}>
                      {wd.flightRules || wd.conditions}
                    </Badge>
                  </div>
                  <div className="font-mono text-[11px] bg-background/60 p-2.5 rounded-lg text-foreground/80">{wd.metar}</div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="text-muted-foreground">Wind: <span className="text-foreground font-medium">{wd.windDirection}° @ {wd.windSpeed}kt</span></div>
                    <div className="text-muted-foreground">Vis: <span className="text-foreground font-medium">{wd.visibility}SM</span></div>
                    <div className="text-muted-foreground">Temp: <span className="text-foreground font-medium">{wd.temperature}°C</span></div>
                  </div>
                </div>
              );
            })}
            {!currentFlightPlan?.departure && !currentFlightPlan?.destination && (
              <div className="text-center py-12 text-muted-foreground text-sm">Enter departure and destination to view weather</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Performance Analysis
            </h3>
            {selectedAircraft && aircraft[selectedAircraft] ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: 'Cruise Speed', value: `${aircraft[selectedAircraft]?.performance?.cruiseSpeed || 'N/A'} kts` },
                    { label: 'Fuel Flow', value: `${aircraft[selectedAircraft]?.performance?.fuelFlow?.cruise65 || 'N/A'} GPH` },
                    { label: 'Service Ceiling', value: aircraft[selectedAircraft]?.performance?.serviceCeiling ? `${(aircraft[selectedAircraft].performance.serviceCeiling / 1000).toFixed(1)}k ft` : 'N/A' },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-xl bg-muted/30">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="text-xl font-semibold text-foreground mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>
                <Separator className="bg-border/30" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['Takeoff', 'Landing'].map(phase => {
                    const perf = aircraft[selectedAircraft]?.performance;
                    const groundRoll = phase === 'Takeoff' ? perf?.takeoffGroundRoll : perf?.landingGroundRoll;
                    const over50 = phase === 'Takeoff' ? perf?.takeoffOver50ft : perf?.landingOver50ft;
                    return (
                      <div key={phase} className="space-y-2">
                        <h4 className="text-sm font-semibold text-foreground">{phase} Performance</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-muted-foreground">Ground Roll: <span className="text-foreground font-medium">{groundRoll || 'N/A'} ft</span></div>
                          <div className="text-muted-foreground">Over 50ft: <span className="text-foreground font-medium">{over50 || 'N/A'} ft</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {currentFlightPlan?.totalDistance && (
                  <>
                    <Separator className="bg-border/30" />
                    <div className="p-5 rounded-xl bg-primary/5 border border-primary/10 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Flight Estimates
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-muted-foreground">Est. Time: <span className="text-foreground font-medium">{currentFlightPlan.totalTime ? `${Math.floor(currentFlightPlan.totalTime / 60)}h ${(currentFlightPlan.totalTime % 60).toFixed(0)}m` : 'Calculate first'}</span></div>
                        <div className="text-muted-foreground">Fuel Req: <span className="text-foreground font-medium">{getFuelRequired()} gal</span></div>
                        <div className="text-muted-foreground">Reserve: <span className="text-foreground font-medium">{(getFuelRequired() * 0.3).toFixed(1)} gal (30%)</span></div>
                        <div className="text-muted-foreground">Total Fuel: <span className="text-foreground font-bold">{(getFuelRequired() * 1.3).toFixed(1)} gal</span></div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">Select an aircraft to view performance data</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gps">
          <GPSTracker />
        </TabsContent>
      </Tabs>

      {/* Saved Plans */}
      {showSavedPlans && savedFlightPlans && savedFlightPlans.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 space-y-4 mt-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" /> Saved Flight Plans
          </h3>
          <div className="space-y-2">
            {savedFlightPlans.map((plan, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => { if (plan.id) loadFlightPlan(plan.id); setShowSavedPlans(false); notify.success('Loaded', `${plan.departure} → ${plan.destination}`); }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{plan.departure} → {plan.destination}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.flightRules} • {plan.waypoints?.length || 0} waypoints
                      {plan.totalDistance && ` • ${plan.totalDistance.toFixed(0)} nm`}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); if (plan.id) { deleteFlightPlan(plan.id); notify.info('Deleted', `${plan.departure} → ${plan.destination}`); } }}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
