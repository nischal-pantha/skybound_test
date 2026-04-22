import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CloudSun, Wind, Calculator, Settings, Gauge, Plane, TrendingUp, Plus, Edit, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { EnhancedAircraftForm } from "./EnhancedAircraftForm";
import { useSupabaseAircraft } from "@/hooks/useSupabaseAircraft";
import { useRealTimeWeather } from "@/hooks/useRealTimeWeather";
import { useNotifications } from "@/contexts/NotificationContext";

export const Performance = () => {
  const [conditions, setConditions] = useState({ temperature: "22", pressure: "30.15", dewpoint: "17", windSpeed: "8", windDirection: "280", icaoCode: "KORD" });
  const [runwayData, setRunwayData] = useState({ elevation: "5", length: "2443", width: "75", surface: "asphalt" });
  const [aircraftType, setAircraftType] = useState("c172");
  const [aircraftWeight, setAircraftWeight] = useState("2000");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState<any>(null);

  const { aircraft: supabaseAircraftList, addAircraft } = useSupabaseAircraft();
  const { weatherData, loading: weatherLoading, fetchWeather } = useRealTimeWeather();
  const { notify } = useNotifications();

  const defaultAircraftData: Record<string, any> = {
    c152: { name: "Cessna 152", emptyWeight: 1129, maxWeight: 1670, performance: { takeoffGroundRoll: 725, takeoffOver50ft: 1340, landingGroundRoll: 475, landingOver50ft: 1200, bestGlideSpeed: 60, stallSpeedClean: 48, stallSpeedLanding: 43, vr: 50, vx: 55, vy: 67, cruiseSpeed: 107, serviceCeiling: 14700, fuelFlow: { cruise65: 5.8, cruise75: 6.9 } } },
    c172: { name: "Cessna 172N", emptyWeight: 1663, maxWeight: 2300, performance: { takeoffGroundRoll: 865, takeoffOver50ft: 1440, landingGroundRoll: 550, landingOver50ft: 1290, bestGlideSpeed: 68, stallSpeedClean: 51, stallSpeedLanding: 47, vr: 55, vx: 62, vy: 79, cruiseSpeed: 122, serviceCeiling: 14200, fuelFlow: { cruise65: 8.1, cruise75: 9.6 } } },
  };

  // Map Supabase aircraft to format compatible with performance calculations
  const customAircraft = Object.fromEntries(
    supabaseAircraftList.map(ac => [ac.id, {
      name: ac.name,
      emptyWeight: ac.empty_weight || 0,
      maxWeight: ac.max_weight || 0,
      performance: (ac.performance_data as any) || {}
    }])
  );
  const allAircraft = { ...defaultAircraftData, ...customAircraft };
  const aircraft = allAircraft[aircraftType];

  const handleWeatherFetch = async () => { if (conditions.icaoCode) await fetchWeather(conditions.icaoCode); };

  useMemo(() => {
    if (weatherData && Object.keys(weatherData).length > 0) {
      const s = Object.values(weatherData)[0];
      setConditions(p => ({ ...p, temperature: s.temperature.toString(), pressure: s.pressure.toString(), dewpoint: s.dewPoint.toString(), windSpeed: s.windSpeed.toString(), windDirection: s.windDirection.toString() }));
    }
  }, [weatherData]);

  const calculations = useMemo(() => {
    const temp = parseFloat(conditions.temperature);
    const pressure = parseFloat(conditions.pressure);
    const elevation = parseFloat(runwayData.elevation);
    const weight = parseFloat(aircraftWeight);
    const pressureAltitude = (29.92 - pressure) * 1000 + elevation;
    const standardTemp = 15 - (pressureAltitude * 0.0019812);
    const densityAltitude = pressureAltitude + (120 * (temp - standardTemp));
    const maxWeight = aircraft?.maxWeight || 2300;
    const weightFactor = weight / maxWeight;
    const densityFactor = 1 + (densityAltitude - elevation) / 10000;
    const baseGR = aircraft?.performance?.takeoffGroundRoll || 865;
    const baseTD = aircraft?.performance?.takeoffOver50ft || 1440;
    const baseLR = aircraft?.performance?.landingGroundRoll || 550;
    const baseLD = aircraft?.performance?.landingOver50ft || 1290;
    const cloudBase = Math.round((temp - parseFloat(conditions.dewpoint)) * 400);
    return {
      pressureAltitude, densityAltitude, cloudBase, weightFactor, densityFactor,
      groundRoll: Math.round(baseGR * weightFactor * densityFactor),
      totalTakeoffDistance: Math.round(baseTD * weightFactor * densityFactor),
      landingRoll: Math.round(baseLR * weightFactor * Math.sqrt(densityFactor)),
      totalLandingDistance: Math.round(baseLD * weightFactor * Math.sqrt(densityFactor)),
    };
  }, [conditions, runwayData, aircraftWeight, aircraft]);

  const handleAddCustomAircraft = (id: string, data: any) => {
    // Convert legacy format to Supabase format
    const supabaseProfile = {
      name: data.name || id,
      registration: data.tailNumber || null,
      empty_weight: data.emptyWeight || null,
      max_weight: data.maxWeight || null,
      forward_cg_limit: data.cgLimits?.forward || null,
      aft_cg_limit: data.cgLimits?.aft || null,
      fuel_arm: data.stations?.fuel?.arm || null,
      front_seat_arm: data.stations?.frontPassenger?.arm || null,
      rear_seat_arm: data.stations?.rearPassenger?.arm || null,
      baggage_arm: data.stations?.baggage?.arm || null,
      max_fuel: data.fuelCapacity || null,
      fuel_burn_rate: data.performance?.fuelFlow?.cruise75 || null,
      cruise_speed: data.performance?.cruiseSpeed || null,
      max_range: null,
      service_ceiling: data.performance?.serviceCeiling || null,
      performance_data: data.performance || null
    };
    addAircraft(supabaseProfile);
    setAircraftType(id);
    setShowAddForm(false);
    setEditingAircraft(null);
  };

  if (showAddForm) return (
    <div className="animate-fade-in">
      <EnhancedAircraftForm onAddAircraft={handleAddCustomAircraft} onClose={() => { setShowAddForm(false); setEditingAircraft(null); }} editingAircraft={editingAircraft} />
    </div>
  );

  const safetyMarginTakeoff = parseFloat(runwayData.length) - calculations.totalTakeoffDistance;
  const safetyMarginLanding = parseFloat(runwayData.length) - calculations.totalLandingDistance;
  const daWarning = calculations.densityAltitude > 5000;

  const StatCard = ({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: string }) => (
    <div className="bg-muted/30 rounded-2xl p-4 border border-border/40">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p className={`text-xl font-semibold ${accent || 'text-foreground'}`}>{value}<span className="text-xs text-muted-foreground ml-1">{unit}</span></p>
    </div>
  );

  const InputCard = ({ label, value, onChange, ...props }: any) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <Input value={value} onChange={onChange} className="h-10 bg-muted/30 border-border/60 rounded-xl text-sm font-medium transition-all focus:bg-background focus:shadow-sm" {...props} />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Performance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Takeoff, landing, and cruise analysis</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-2 rounded-xl h-9 text-xs border-border/60">
            <Plus className="h-3.5 w-3.5" />Add Aircraft
          </Button>
        </div>
      </div>

      {/* Conditions summary strip */}
      <div className={`flex flex-wrap items-center gap-4 px-5 py-3.5 rounded-2xl border transition-all ${daWarning ? 'bg-warning/8 border-warning/20' : 'bg-muted/30 border-border/40'}`}>
        {daWarning && <AlertTriangle className="h-4 w-4 text-warning" />}
        <span className="text-xs text-muted-foreground">DA <strong className="text-foreground">{calculations.densityAltitude.toFixed(0)} ft</strong></span>
        <span className="text-xs text-muted-foreground">PA <strong className="text-foreground">{calculations.pressureAltitude.toFixed(0)} ft</strong></span>
        <span className="text-xs text-muted-foreground">Temp <strong className="text-foreground">{conditions.temperature}°C</strong></span>
        <span className="text-xs text-muted-foreground">Wind <strong className="text-foreground">{conditions.windDirection}° @ {conditions.windSpeed} kt</strong></span>
        <span className="text-xs text-muted-foreground">Cloud Base <strong className="text-foreground">~{calculations.cloudBase} ft</strong></span>
      </div>

      <Tabs defaultValue="conditions" className="space-y-5">
        <TabsList className="h-10 p-1 bg-muted/50 rounded-xl gap-1">
          <TabsTrigger value="conditions" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:shadow-sm"><CloudSun className="h-3.5 w-3.5" />Conditions</TabsTrigger>
          <TabsTrigger value="takeoff" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:shadow-sm"><Plane className="h-3.5 w-3.5" />Takeoff</TabsTrigger>
          <TabsTrigger value="landing" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:shadow-sm"><TrendingUp className="h-3.5 w-3.5 rotate-180" />Landing</TabsTrigger>
          <TabsTrigger value="cruise" className="rounded-lg text-xs font-medium gap-1.5 data-[state=active]:shadow-sm"><Gauge className="h-3.5 w-3.5" />Cruise</TabsTrigger>
        </TabsList>

        {/* CONDITIONS */}
        <TabsContent value="conditions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border/50 shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Wind className="h-4 w-4 text-primary" /></div>
                  <span className="text-sm font-semibold text-foreground">Weather</span>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="ICAO" value={conditions.icaoCode} onChange={(e) => setConditions({...conditions, icaoCode: e.target.value.toUpperCase()})} maxLength={4} className="h-10 bg-muted/30 border-border/60 rounded-xl text-sm font-medium flex-1" />
                  <Button onClick={handleWeatherFetch} disabled={weatherLoading} size="icon" className="h-10 w-10 rounded-xl">
                    <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {weatherData && Object.keys(weatherData).length > 0 && (
                  <div className="p-3 bg-success/8 rounded-xl border border-success/20">
                    <div className="flex items-center gap-2 text-xs text-success mb-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />Live from {Object.values(weatherData)[0].location}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground bg-muted/40 p-2 rounded-lg">{Object.values(weatherData)[0].metar}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <InputCard label="Temp (°C)" type="number" value={conditions.temperature} onChange={(e: any) => setConditions({...conditions, temperature: e.target.value})} />
                  <InputCard label="Dewpoint (°C)" type="number" value={conditions.dewpoint} onChange={(e: any) => setConditions({...conditions, dewpoint: e.target.value})} />
                  <InputCard label="Altimeter (inHg)" type="number" step="0.01" value={conditions.pressure} onChange={(e: any) => setConditions({...conditions, pressure: e.target.value})} />
                  <InputCard label="Wind Dir (°)" type="number" value={conditions.windDirection} onChange={(e: any) => setConditions({...conditions, windDirection: e.target.value})} />
                  <InputCard label="Wind Spd (kt)" type="number" value={conditions.windSpeed} onChange={(e: any) => setConditions({...conditions, windSpeed: e.target.value})} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Settings className="h-4 w-4 text-primary" /></div>
                  <span className="text-sm font-semibold text-foreground">Aircraft & Runway</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Aircraft</Label>
                    {customAircraft[aircraftType] && (
                      <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => { setEditingAircraft({ id: aircraftType, ...allAircraft[aircraftType] }); setShowAddForm(true); }}>
                        <Edit className="h-3 w-3 mr-1" />Edit
                      </Button>
                    )}
                  </div>
                  <Select value={aircraftType} onValueChange={setAircraftType}>
                    <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/60 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c152">Cessna 152</SelectItem>
                      <SelectItem value="c172">Cessna 172N</SelectItem>
                      {Object.entries(customAircraft).map(([id, a]) => <SelectItem key={id} value={id}>{(a as any).name} (Custom)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <InputCard label="Weight (lbs)" type="number" value={aircraftWeight} onChange={(e: any) => setAircraftWeight(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <InputCard label="Elevation (ft)" type="number" value={runwayData.elevation} onChange={(e: any) => setRunwayData({...runwayData, elevation: e.target.value})} />
                  <InputCard label="Runway (ft)" type="number" value={runwayData.length} onChange={(e: any) => setRunwayData({...runwayData, length: e.target.value})} />
                </div>
                <Button onClick={() => notify.success("Calculated", `DA: ${calculations.densityAltitude.toFixed(0)} ft`)} className="w-full h-10 rounded-xl gap-2 text-sm font-medium">
                  <Calculator className="h-4 w-4" />Calculate
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Pressure Altitude" value={calculations.pressureAltitude.toFixed(0)} unit="ft" />
            <StatCard label="Density Altitude" value={calculations.densityAltitude.toFixed(0)} unit="ft" accent={daWarning ? 'text-warning' : undefined} />
            <StatCard label="Temperature" value={`${(parseFloat(conditions.temperature) * 9/5 + 32).toFixed(0)}`} unit="°F" />
            <StatCard label="Cloud Base (Est.)" value={`${calculations.cloudBase}`} unit="ft" />
          </div>
        </TabsContent>

        {/* TAKEOFF */}
        <TabsContent value="takeoff" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Ground Roll" value={`${calculations.groundRoll}`} unit="ft" />
            <StatCard label="Over 50ft Obstacle" value={`${calculations.totalTakeoffDistance}`} unit="ft" />
            <StatCard label="Runway Available" value={runwayData.length} unit="ft" />
            <StatCard label="Safety Margin" value={`${safetyMarginTakeoff.toFixed(0)}`} unit="ft" accent={safetyMarginTakeoff < 500 ? 'text-destructive' : 'text-success'} />
          </div>
          <Card className={`rounded-2xl border ${safetyMarginTakeoff > 500 ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
            <CardContent className="p-5 flex items-start gap-3">
              {safetyMarginTakeoff > 500 ? <CheckCircle className="h-5 w-5 text-success mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />}
              <div>
                <p className={`text-sm font-semibold ${safetyMarginTakeoff > 500 ? 'text-success' : 'text-destructive'}`}>
                  {safetyMarginTakeoff > 500 ? 'Takeoff Approved' : 'Caution Required'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {safetyMarginTakeoff > 500 ? 'Adequate runway with sufficient safety margins.' : 'Limited margin. Consider reducing weight or waiting for better conditions.'}
                </p>
              </div>
            </CardContent>
          </Card>
          {aircraft?.performance && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Vr (Rotate)" value={`${aircraft.performance.vr}`} unit="kt" />
              <StatCard label="Vx (Best Angle)" value={`${aircraft.performance.vx}`} unit="kt" />
              <StatCard label="Vy (Best Rate)" value={`${aircraft.performance.vy}`} unit="kt" />
              <StatCard label="Perf. Factor" value={calculations.densityFactor.toFixed(2)} unit="×" />
            </div>
          )}
        </TabsContent>

        {/* LANDING */}
        <TabsContent value="landing" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Ground Roll" value={`${calculations.landingRoll}`} unit="ft" />
            <StatCard label="Over 50ft Obstacle" value={`${calculations.totalLandingDistance}`} unit="ft" />
            <StatCard label="Runway Available" value={runwayData.length} unit="ft" />
            <StatCard label="Safety Margin" value={`${safetyMarginLanding.toFixed(0)}`} unit="ft" accent={safetyMarginLanding < 300 ? 'text-destructive' : 'text-success'} />
          </div>
          <Card className={`rounded-2xl border ${safetyMarginLanding > 300 ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
            <CardContent className="p-5 flex items-start gap-3">
              {safetyMarginLanding > 300 ? <CheckCircle className="h-5 w-5 text-success mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />}
              <div>
                <p className={`text-sm font-semibold ${safetyMarginLanding > 300 ? 'text-success' : 'text-destructive'}`}>
                  {safetyMarginLanding > 300 ? 'Landing Approved' : 'Caution Required'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {safetyMarginLanding > 300 ? 'Adequate runway for safe landing.' : 'Consider alternate airport with longer runway.'}
                </p>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatCard label="Approach Speed" value={`${Math.round(65 * Math.sqrt(calculations.weightFactor))}`} unit="KIAS" />
            <StatCard label="Stall (Landing)" value={`${aircraft?.performance?.stallSpeedLanding || 47}`} unit="kt" />
            <StatCard label="Best Glide" value={`${aircraft?.performance?.bestGlideSpeed || 68}`} unit="kt" />
          </div>
        </TabsContent>

        {/* CRUISE */}
        <TabsContent value="cruise" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "65% Power @ 3,500 ft", tas: "118", ff: aircraft?.performance?.fuelFlow?.cruise65 || 8.1, range: "520" },
              { title: "75% Power @ 6,500 ft", tas: "131", ff: aircraft?.performance?.fuelFlow?.cruise75 || 9.6, range: "485" },
              { title: "Best Economy", tas: "105", ff: 6.8, range: "580" },
            ].map(c => (
              <Card key={c.title} className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground mb-4">{c.title}</p>
                  <div className="space-y-3">
                    {[
                      { l: "True Airspeed", v: `${c.tas} kt` },
                      { l: "Fuel Flow", v: `${c.ff} GPH` },
                      { l: "Range", v: `${c.range} nm` },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{r.l}</span>
                        <span className="font-medium text-foreground">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/50 shadow-sm rounded-2xl bg-primary/5">
            <CardContent className="p-5 flex items-start gap-3">
              <Gauge className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Recommended Cruise</p>
                <p className="text-xs text-muted-foreground mt-1">
                  For DA {calculations.densityAltitude.toFixed(0)} ft, cruise at 4,500 ft for optimal performance and fuel efficiency.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
