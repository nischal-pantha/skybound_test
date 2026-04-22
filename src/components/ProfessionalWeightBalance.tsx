import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertTriangle, CheckCircle, Download, Plane, Users, Package, Fuel, Printer } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useNotifications } from "@/contexts/NotificationContext";
import { useSupabaseAircraft } from "@/hooks/useSupabaseAircraft";
import { exportWeightBalanceToPDF, printWeightBalance } from "@/utils/pdfExport";

interface WeightStation {
  name: string;
  weight: number;
  arm: number;
  moment: number;
  maxWeight?: number;
}

interface AircraftConfig {
  emptyWeight: number;
  emptyCG: number;
  maxGrossWeight: number;
  cgLimits: { forward: number; aft: number };
  stations: { [key: string]: { arm: number; maxWeight?: number } };
}

export const ProfessionalWeightBalance = () => {
  const { notify } = useNotifications();
  const { aircraft: supabaseAircraft } = useSupabaseAircraft();
  const [selectedAircraft, setSelectedAircraft] = useState<string>("c172");
  const [fuelUnit, setFuelUnit] = useState<"gallons" | "pounds">("gallons");
  const [isExporting, setIsExporting] = useState(false);
  const [weights, setWeights] = useState({
    pilot: 170, frontPassenger: 0, rearPassenger: 0, baggage1: 0, baggage2: 0, fuel: 38,
  });

  const aircraftConfigs: Record<string, AircraftConfig> = {
    c152: { emptyWeight: 1129, emptyCG: 32.6, maxGrossWeight: 1670, cgLimits: { forward: 31.0, aft: 36.5 }, stations: { pilot: { arm: 32.0, maxWeight: 200 }, frontPassenger: { arm: 32.0, maxWeight: 200 }, baggage: { arm: 64.0, maxWeight: 120 }, fuel: { arm: 40.0 } } },
    c172: { emptyWeight: 1663, emptyCG: 36.2, maxGrossWeight: 2300, cgLimits: { forward: 35.0, aft: 40.9 }, stations: { pilot: { arm: 37.0, maxWeight: 200 }, frontPassenger: { arm: 37.0, maxWeight: 200 }, rearPassenger: { arm: 73.0, maxWeight: 340 }, baggage1: { arm: 95.0, maxWeight: 120 }, fuel: { arm: 48.0 } } },
    c182: { emptyWeight: 1883, emptyCG: 35.8, maxGrossWeight: 3100, cgLimits: { forward: 32.5, aft: 40.5 }, stations: { pilot: { arm: 37.0, maxWeight: 200 }, frontPassenger: { arm: 37.0, maxWeight: 200 }, rearPassenger: { arm: 73.0, maxWeight: 340 }, baggage1: { arm: 95.0, maxWeight: 120 }, baggage2: { arm: 123.0, maxWeight: 80 }, fuel: { arm: 48.0 } } },
  };

  // Merge built-in configs with Supabase aircraft profiles
  const customAircraftConfigs = Object.fromEntries(
    supabaseAircraft.map(ac => [ac.id, {
      emptyWeight: ac.empty_weight || 0,
      emptyCG: ((ac.forward_cg_limit || 0) + (ac.aft_cg_limit || 0)) / 2,
      maxGrossWeight: ac.max_weight || 0,
      cgLimits: { forward: ac.forward_cg_limit || 0, aft: ac.aft_cg_limit || 0 },
      stations: {
        pilot: { arm: ac.front_seat_arm || 37, maxWeight: 300 },
        frontPassenger: { arm: ac.front_seat_arm || 37, maxWeight: 300 },
        rearPassenger: { arm: ac.rear_seat_arm || 73, maxWeight: 340 },
        baggage1: { arm: ac.baggage_arm || 95, maxWeight: 120 },
        fuel: { arm: ac.fuel_arm || 48 },
      }
    } as AircraftConfig])
  );
  const allAircraftConfigs = { ...aircraftConfigs, ...customAircraftConfigs };
  const currentConfig = allAircraftConfigs[selectedAircraft];

  const calculations = useMemo(() => {
    const fuelWeight = fuelUnit === "gallons" ? weights.fuel * 6 : weights.fuel;
    const stations: WeightStation[] = [
      { name: "Empty Weight", weight: currentConfig.emptyWeight, arm: currentConfig.emptyCG, moment: currentConfig.emptyWeight * currentConfig.emptyCG },
      { name: "Pilot", weight: weights.pilot, arm: currentConfig.stations.pilot.arm, moment: weights.pilot * currentConfig.stations.pilot.arm, maxWeight: currentConfig.stations.pilot.maxWeight },
      { name: "Front Passenger", weight: weights.frontPassenger, arm: currentConfig.stations.frontPassenger.arm, moment: weights.frontPassenger * currentConfig.stations.frontPassenger.arm, maxWeight: currentConfig.stations.frontPassenger.maxWeight },
    ];
    if (currentConfig.stations.rearPassenger) {
      stations.push({ name: "Rear Passenger", weight: weights.rearPassenger, arm: currentConfig.stations.rearPassenger.arm, moment: weights.rearPassenger * currentConfig.stations.rearPassenger.arm, maxWeight: currentConfig.stations.rearPassenger.maxWeight });
    }
    if (currentConfig.stations.baggage1) {
      stations.push({ name: "Baggage 1", weight: weights.baggage1, arm: currentConfig.stations.baggage1.arm, moment: weights.baggage1 * currentConfig.stations.baggage1.arm, maxWeight: currentConfig.stations.baggage1.maxWeight });
    } else if (currentConfig.stations.baggage) {
      stations.push({ name: "Baggage", weight: weights.baggage1, arm: currentConfig.stations.baggage.arm, moment: weights.baggage1 * currentConfig.stations.baggage.arm, maxWeight: currentConfig.stations.baggage.maxWeight });
    }
    if (currentConfig.stations.baggage2) {
      stations.push({ name: "Baggage 2", weight: weights.baggage2, arm: currentConfig.stations.baggage2.arm, moment: weights.baggage2 * currentConfig.stations.baggage2.arm, maxWeight: currentConfig.stations.baggage2.maxWeight });
    }
    stations.push({ name: "Fuel", weight: fuelWeight, arm: currentConfig.stations.fuel.arm, moment: fuelWeight * currentConfig.stations.fuel.arm });

    const totalWeight = stations.reduce((s, st) => s + st.weight, 0);
    const totalMoment = stations.reduce((s, st) => s + st.moment, 0);
    const centerOfGravity = totalWeight > 0 ? totalMoment / totalWeight : 0;
    const isWeightValid = totalWeight <= currentConfig.maxGrossWeight;
    const isCGValid = centerOfGravity >= currentConfig.cgLimits.forward && centerOfGravity <= currentConfig.cgLimits.aft;
    const stationLimitViolations = stations.filter(st => st.maxWeight && st.weight > st.maxWeight);
    return {
      stations, totalWeight, totalMoment, centerOfGravity, isWeightValid, isCGValid,
      isValid: isWeightValid && isCGValid && stationLimitViolations.length === 0,
      stationLimitViolations,
      usefulLoad: currentConfig.maxGrossWeight - currentConfig.emptyWeight,
      payloadWithFuel: totalWeight - currentConfig.emptyWeight,
    };
  }, [weights, currentConfig, fuelUnit]);

  const handleWeightChange = (field: string, value: string) => {
    setWeights(prev => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const handleExportToPDF = async () => {
    setIsExporting(true);
    try {
      await exportWeightBalanceToPDF({
        aircraft: selectedAircraft, totalWeight: calculations.totalWeight, centerOfGravity: calculations.centerOfGravity,
        totalMoment: calculations.totalMoment, stations: calculations.stations, isValid: calculations.isValid,
        maxWeight: currentConfig.maxGrossWeight, cgLimits: currentConfig.cgLimits,
      });
      notify.success("Export Successful", "Weight & Balance report exported to PDF");
    } catch (error) {
      console.error('Export error:', error);
      notify.error("Export Failed", "Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const weightPercent = Math.min((calculations.totalWeight / currentConfig.maxGrossWeight) * 100, 100);
  const cgRange = currentConfig.cgLimits.aft - currentConfig.cgLimits.forward;
  const cgPercent = Math.min(Math.max(((calculations.centerOfGravity - currentConfig.cgLimits.forward) / cgRange) * 100, 0), 100);

  const graphData = useMemo(() => {
    const data = [];
    const step = 100;
    for (let w = currentConfig.emptyWeight; w <= currentConfig.maxGrossWeight; w += step) {
      data.push({ weight: w, forwardLimit: currentConfig.cgLimits.forward, aftLimit: currentConfig.cgLimits.aft, currentCG: w === Math.round(calculations.totalWeight / step) * step ? calculations.centerOfGravity : null });
    }
    return data;
  }, [currentConfig, calculations]);

  const InputField = ({ label, field, max, suffix = "lbs" }: { label: string; field: string; max?: number; suffix?: string }) => {
    const val = weights[field as keyof typeof weights];
    const overLimit = max ? val > max : false;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
          {max && <span className="text-[10px] text-muted-foreground">Max {max} {suffix}</span>}
        </div>
        <Input
          type="number"
          value={val}
          onChange={(e) => handleWeightChange(field, e.target.value)}
          className={`h-10 bg-muted/30 border-border/60 rounded-xl text-sm font-medium transition-all focus:bg-background focus:shadow-sm ${overLimit ? 'border-destructive/60 bg-destructive/5' : ''}`}
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Weight & Balance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">FAA-compliant computations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportToPDF} variant="outline" size="sm" disabled={isExporting} className="gap-2 rounded-xl h-9 text-xs border-border/60">
            <Download className="h-3.5 w-3.5" />{isExporting ? 'Exporting…' : 'PDF'}
          </Button>
          <Button onClick={() => printWeightBalance()} variant="outline" size="sm" className="gap-2 rounded-xl h-9 text-xs border-border/60">
            <Printer className="h-3.5 w-3.5" />Print
          </Button>
        </div>
      </div>

      {/* Status Strip */}
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all ${calculations.isValid ? 'bg-success/8 border-success/20' : 'bg-destructive/8 border-destructive/20'}`}>
        {calculations.isValid ? <CheckCircle className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-destructive" />}
        <span className={`text-sm font-semibold ${calculations.isValid ? 'text-success' : 'text-destructive'}`}>
          {calculations.isValid ? 'Within All Limits' : 'Out of Limits'}
        </span>
        <div className="flex-1" />
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{calculations.totalWeight.toFixed(0)}</strong> / {currentConfig.maxGrossWeight} lbs</span>
          <span>CG <strong className="text-foreground">{calculations.centerOfGravity.toFixed(2)}</strong>"</span>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="space-y-5">
        <TabsList className="h-10 p-1 bg-muted/50 rounded-xl gap-1">
          <TabsTrigger value="calculator" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Calculator</TabsTrigger>
          <TabsTrigger value="envelope" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">CG Envelope</TabsTrigger>
          <TabsTrigger value="report" className="rounded-lg text-xs font-medium data-[state=active]:shadow-sm">Report</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            {/* Left: Inputs */}
            <div className="xl:col-span-3 space-y-4">
              {/* Aircraft Select */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Plane className="h-4 w-4 text-primary" /></div>
                    <span className="text-sm font-semibold text-foreground">Aircraft</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2 md:col-span-1">
                      <Label className="text-xs text-muted-foreground">Type</Label>
                      <Select value={selectedAircraft} onValueChange={setSelectedAircraft}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/60 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="c152">Cessna 152</SelectItem>
                          <SelectItem value="c172">Cessna 172</SelectItem>
                          <SelectItem value="c182">Cessna 182</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {[{ l: "Empty Wt", v: `${currentConfig.emptyWeight} lbs` }, { l: "Empty CG", v: `${currentConfig.emptyCG}"` }, { l: "Max Gross", v: `${currentConfig.maxGrossWeight} lbs` }].map(d => (
                      <div key={d.l}>
                        <Label className="text-xs text-muted-foreground">{d.l}</Label>
                        <div className="h-10 flex items-center px-3 bg-muted/30 rounded-xl text-sm font-mono text-foreground">{d.v}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Occupants */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                    <span className="text-sm font-semibold text-foreground">Occupants</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Pilot" field="pilot" max={currentConfig.stations.pilot.maxWeight} />
                    <InputField label="Front Passenger" field="frontPassenger" max={currentConfig.stations.frontPassenger.maxWeight} />
                    {currentConfig.stations.rearPassenger && (
                      <div className="col-span-2">
                        <InputField label="Rear Passengers" field="rearPassenger" max={currentConfig.stations.rearPassenger.maxWeight} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Baggage */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Package className="h-4 w-4 text-primary" /></div>
                    <span className="text-sm font-semibold text-foreground">Baggage</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label={currentConfig.stations.baggage1 ? 'Compartment 1' : 'Baggage'} field="baggage1" max={(currentConfig.stations.baggage1?.maxWeight || currentConfig.stations.baggage?.maxWeight)} />
                    {currentConfig.stations.baggage2 && <InputField label="Compartment 2" field="baggage2" max={currentConfig.stations.baggage2.maxWeight} />}
                  </div>
                </CardContent>
              </Card>

              {/* Fuel */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Fuel className="h-4 w-4 text-primary" /></div>
                    <span className="text-sm font-semibold text-foreground">Fuel</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Unit</Label>
                      <Select value={fuelUnit} onValueChange={(v: "gallons" | "pounds") => setFuelUnit(v)}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/60 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gallons">Gallons</SelectItem>
                          <SelectItem value="pounds">Pounds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input type="number" value={weights.fuel} onChange={(e) => handleWeightChange('fuel', e.target.value)} className="h-10 bg-muted/30 border-border/60 rounded-xl text-sm font-medium" />
                      <p className="text-[10px] text-muted-foreground">{fuelUnit === "gallons" ? `= ${(weights.fuel * 6).toFixed(0)} lbs` : `= ${(weights.fuel / 6).toFixed(1)} gal`}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Results */}
            <div className="xl:col-span-2 space-y-4">
              {/* Weight gauge */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-5 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Weight</span>
                      <span className={`font-semibold ${calculations.isWeightValid ? 'text-foreground' : 'text-destructive'}`}>{calculations.totalWeight.toFixed(0)} lbs</span>
                    </div>
                    <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${weightPercent > 100 ? 'bg-destructive' : weightPercent > 90 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${weightPercent}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground text-right">{(currentConfig.maxGrossWeight - calculations.totalWeight).toFixed(0)} lbs remaining</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Center of Gravity</span>
                      <span className={`font-semibold ${calculations.isCGValid ? 'text-foreground' : 'text-destructive'}`}>{calculations.centerOfGravity.toFixed(2)}"</span>
                    </div>
                    <div className="relative h-2 bg-muted/60 rounded-full overflow-hidden">
                      <div className="absolute inset-0 bg-success/30 rounded-full" />
                      <div className="absolute top-0 h-full w-1 bg-foreground rounded-full transition-all duration-700" style={{ left: `${cgPercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{currentConfig.cgLimits.forward}"</span>
                      <span>{currentConfig.cgLimits.aft}"</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: "Total Moment", v: `${calculations.totalMoment.toFixed(0)}`, u: "in-lbs" },
                  { l: "Useful Load", v: `${calculations.usefulLoad}`, u: "lbs" },
                  { l: "Payload", v: `${calculations.payloadWithFuel.toFixed(0)}`, u: "lbs" },
                  { l: "Weight Factor", v: `${(calculations.totalWeight / currentConfig.maxGrossWeight * 100).toFixed(0)}`, u: "%" },
                ].map(s => (
                  <div key={s.l} className="bg-muted/30 rounded-2xl p-4 border border-border/40">
                    <p className="text-[11px] text-muted-foreground mb-1">{s.l}</p>
                    <p className="text-lg font-semibold text-foreground">{s.v}<span className="text-xs text-muted-foreground ml-1">{s.u}</span></p>
                  </div>
                ))}
              </div>

              {/* Violations */}
              {calculations.stationLimitViolations.length > 0 && (
                <Card className="border-destructive/30 bg-destructive/5 rounded-2xl">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-destructive">Station Violations</p>
                    {calculations.stationLimitViolations.map((st, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{st.name}: {st.weight} lbs (max {st.maxWeight})</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Loading Table */}
              <Card className="border-border/50 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left py-2 font-medium text-muted-foreground">Station</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Wt</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Arm</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Moment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculations.stations.map((st, i) => (
                        <tr key={i} className="border-b border-border/20">
                          <td className="py-2 font-medium text-foreground">{st.name}</td>
                          <td className="py-2 text-right font-mono text-muted-foreground">{st.weight.toFixed(0)}</td>
                          <td className="py-2 text-right font-mono text-muted-foreground">{st.arm.toFixed(1)}</td>
                          <td className="py-2 text-right font-mono text-muted-foreground">{st.moment.toFixed(0)}</td>
                        </tr>
                      ))}
                      <tr className="font-semibold">
                        <td className="py-2 text-foreground">Total</td>
                        <td className="py-2 text-right font-mono text-foreground">{calculations.totalWeight.toFixed(0)}</td>
                        <td className="py-2 text-right font-mono text-foreground">{calculations.centerOfGravity.toFixed(2)}</td>
                        <td className="py-2 text-right font-mono text-foreground">{calculations.totalMoment.toFixed(0)}</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="envelope">
          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">CG Envelope</CardTitle>
              <p className="text-xs text-muted-foreground">Visual loading verification</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="weight" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'Weight (lbs)', position: 'insideBottom', offset: -8, style: { fontSize: 11 } }} />
                    <YAxis domain={[currentConfig.cgLimits.forward - 2, currentConfig.cgLimits.aft + 2]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'CG (in)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                    <Area type="monotone" dataKey="aftLimit" fill="hsl(var(--destructive))" fillOpacity={0.08} stroke="none" />
                    <Area type="monotone" dataKey="forwardLimit" fill="hsl(var(--background))" fillOpacity={1} stroke="none" />
                    <Line type="monotone" dataKey="forwardLimit" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="aftLimit" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                    <ReferenceLine y={calculations.centerOfGravity} stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="6 4" />
                    <ReferenceLine x={calculations.totalWeight} stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="6 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-5 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-destructive rounded" />CG Limits</div>
                <div className="flex items-center gap-2"><div className="w-3 h-0.5 bg-success rounded" />Current Loading</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card className="border-border/50 shadow-sm rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Flight Report</CardTitle>
              <p className="text-xs text-muted-foreground">FAA-compliant document for DPE review</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 font-mono text-xs">
                <div className="border-b border-border/40 pb-4">
                  <h3 className="font-bold text-sm mb-3 text-foreground">WEIGHT AND BALANCE COMPUTATION</h3>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <span>Aircraft: {selectedAircraft.toUpperCase()}</span>
                    <span>Date: {new Date().toLocaleDateString()}</span>
                  </div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border/60">
                      <th className="text-left py-2 text-muted-foreground font-semibold">ITEM</th>
                      <th className="text-right py-2 text-muted-foreground font-semibold">WEIGHT</th>
                      <th className="text-right py-2 text-muted-foreground font-semibold">ARM</th>
                      <th className="text-right py-2 text-muted-foreground font-semibold">MOMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.stations.map((st, i) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="py-2 text-foreground">{st.name}</td>
                        <td className="py-2 text-right text-foreground">{st.weight.toFixed(1)}</td>
                        <td className="py-2 text-right text-foreground">{st.arm.toFixed(1)}</td>
                        <td className="py-2 text-right text-foreground">{st.moment.toFixed(0)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border/60 font-bold">
                      <td className="py-2 text-foreground">TOTAL</td>
                      <td className="py-2 text-right text-foreground">{calculations.totalWeight.toFixed(1)}</td>
                      <td className="py-2 text-right text-foreground">{calculations.centerOfGravity.toFixed(2)}</td>
                      <td className="py-2 text-right text-foreground">{calculations.totalMoment.toFixed(0)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/40">
                  <div className="space-y-1 text-muted-foreground">
                    <h4 className="font-bold text-foreground">LIMITS</h4>
                    <p>Max Weight: {currentConfig.maxGrossWeight} lbs</p>
                    <p>CG Range: {currentConfig.cgLimits.forward}" – {currentConfig.cgLimits.aft}"</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground">VERIFICATION</h4>
                    <p className={calculations.isWeightValid ? 'text-success' : 'text-destructive'}>Weight: {calculations.isWeightValid ? 'WITHIN LIMITS' : 'EXCEEDS LIMITS'}</p>
                    <p className={calculations.isCGValid ? 'text-success' : 'text-destructive'}>CG: {calculations.isCGValid ? 'WITHIN LIMITS' : 'OUT OF LIMITS'}</p>
                    <p className={`font-bold ${calculations.isValid ? 'text-success' : 'text-destructive'}`}>{calculations.isValid ? '✓ APPROVED FOR FLIGHT' : '✗ NOT APPROVED'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
