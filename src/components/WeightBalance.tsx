
import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, AlertTriangle, Calculator, Plane, Users, Package, Fuel, TrendingUp, Printer, Share } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { AircraftProfileManager } from "./AircraftProfileManager";
import { useSupabaseAircraft } from "@/hooks/useSupabaseAircraft";
import { useToast } from "@/hooks/use-toast";

interface WeightData {
  pilot: string;
  frontPassenger: string;
  rearPassenger: string;
  baggage: string;
  fuel: string;
  fuelBurn: string;
  startTaxiRunup: string;
  passengerAdjustment: string;
  baggageAdjustment: string;
  fuelAdjustment: string;
}

// Default aircraft database for common training aircraft
const defaultAircraftData = {
  c152: {
    name: "Cessna 152",
    emptyWeight: 1129,
    emptyMoment: 876.5,
    maxWeight: 1670,
    cgLimits: { forward: 31.0, aft: 36.5 },
    stations: {
      pilot: { arm: 32.0 },
      frontPassenger: { arm: 32.0 },
      rearPassenger: { arm: 0 },
      baggage: { arm: 64.0 },
      fuel: { arm: 40.0, maxWeight: 150 }
    },
    maxBaggageWeight: 120,
    fuelCapacity: 26,
    usableFuel: 24.5
  },
  c172: {
    name: "Cessna 172N",
    emptyWeight: 1663,
    emptyMoment: 1554.2,
    maxWeight: 2300,
    cgLimits: { forward: 35.0, aft: 40.9 },
    stations: {
      pilot: { arm: 37.0 },
      frontPassenger: { arm: 37.0 },
      rearPassenger: { arm: 73.0 },
      baggage: { arm: 95.0 },
      fuel: { arm: 48.0, maxWeight: 300 }
    },
    maxBaggageWeight: 120,
    fuelCapacity: 50,
    usableFuel: 48
  },
  c182: {
    name: "Cessna 182T",
    emptyWeight: 1883,
    emptyMoment: 1795.5,
    maxWeight: 3100,
    cgLimits: { forward: 32.5, aft: 40.5 },
    stations: {
      pilot: { arm: 37.0 },
      frontPassenger: { arm: 37.0 },
      rearPassenger: { arm: 73.0 },
      baggage: { arm: 95.0 },
      fuel: { arm: 48.0, maxWeight: 564 }
    },
    maxBaggageWeight: 200,
    fuelCapacity: 88,
    usableFuel: 87
  },
  pa28: {
    name: "Piper Cherokee PA-28",
    emptyWeight: 1205,
    emptyMoment: 1025.7,
    maxWeight: 2150,
    cgLimits: { forward: 83.0, aft: 95.0 },
    stations: {
      pilot: { arm: 85.5 },
      frontPassenger: { arm: 85.5 },
      rearPassenger: { arm: 118.0 },
      baggage: { arm: 118.0 },
      fuel: { arm: 95.0, maxWeight: 300 }
    },
    maxBaggageWeight: 200,
    fuelCapacity: 50,
    usableFuel: 48
  }
};

export const WeightBalance = () => {
  const [aircraftType, setAircraftType] = useState("c172");
  const [weights, setWeights] = useState<WeightData>({
    pilot: "170",
    frontPassenger: "0",
    rearPassenger: "0",
    baggage: "0",
    fuel: "240",
    fuelBurn: "20",
    startTaxiRunup: "5",
    passengerAdjustment: "0",
    baggageAdjustment: "0",
    fuelAdjustment: "0"
  });

  const { aircraft: supabaseAircraft } = useSupabaseAircraft();
  const { toast } = useToast();

  // Combine default and custom aircraft (Supabase aircraft mapped to compatible shape)
  const customAircraftMapped = Object.fromEntries(
    supabaseAircraft.map(ac => [ac.id, {
      name: ac.name,
      emptyWeight: ac.empty_weight || 0,
      emptyMoment: 0,
      maxWeight: ac.max_weight || 0,
      cgLimits: { forward: ac.forward_cg_limit || 0, aft: ac.aft_cg_limit || 0 },
      stations: {
        pilot: { arm: ac.front_seat_arm || 37 },
        frontPassenger: { arm: ac.front_seat_arm || 37 },
        rearPassenger: { arm: ac.rear_seat_arm || 73 },
        baggage: { arm: ac.baggage_arm || 95 },
        fuel: { arm: ac.fuel_arm || 48, maxWeight: (ac.max_fuel || 0) * 6 }
      },
      maxBaggageWeight: 120,
      fuelCapacity: ac.max_fuel || 0,
      usableFuel: (ac.max_fuel || 0) * 0.95,
      tailNumber: ac.registration || ''
    }])
  );
  const allAircraft = { ...defaultAircraftData, ...customAircraftMapped };
  const aircraft = allAircraft[aircraftType];

  // Professional weight and balance calculations like Garmin Pilot/ForeFlight
  const calculations = useMemo(() => {
    if (!aircraft) return null;

    const pilot = parseFloat(weights.pilot) || 0;
    const frontPassenger = parseFloat(weights.frontPassenger) || 0;
    const rearPassenger = parseFloat(weights.rearPassenger) || 0;
    const baggage = parseFloat(weights.baggage) || 0;
    const fuel = parseFloat(weights.fuel) || 0;
    const fuelBurn = parseFloat(weights.fuelBurn) || 0;
    const startTaxiRunup = parseFloat(weights.startTaxiRunup) || 0;
    const passengerAdj = parseFloat(weights.passengerAdjustment) || 0;
    const baggageAdj = parseFloat(weights.baggageAdjustment) || 0;
    const fuelAdj = parseFloat(weights.fuelAdjustment) || 0;

    // Basic empty weight and moment
    const basicEmptyWeight = aircraft.emptyWeight;
    const basicEmptyMoment = aircraft.emptyMoment;

    // Calculate moments for each station
    const pilotMoment = pilot * aircraft.stations.pilot.arm;
    const frontPassengerMoment = frontPassenger * aircraft.stations.frontPassenger.arm;
    const rearPassengerMoment = rearPassenger * (aircraft.stations.rearPassenger?.arm || 0);
    const baggageMoment = baggage * aircraft.stations.baggage.arm;
    const fuelMoment = fuel * aircraft.stations.fuel.arm;

    // Zero Fuel Weight (ZFW)
    const zeroFuelWeight = basicEmptyWeight + pilot + frontPassenger + rearPassenger + baggage;
    const zeroFuelMoment = basicEmptyMoment + pilotMoment + frontPassengerMoment + rearPassengerMoment + baggageMoment;

    // Ramp Weight
    const rampWeight = zeroFuelWeight + fuel;
    const rampMoment = zeroFuelMoment + fuelMoment;

    // Take-off Weight (after start/taxi/run-up)
    const takeoffWeight = rampWeight - startTaxiRunup;
    const takeoffMoment = rampMoment - (startTaxiRunup * aircraft.stations.fuel.arm);

    // Landing Weight (after fuel burn)
    const landingWeight = takeoffWeight - fuelBurn;
    const landingMoment = takeoffMoment - (fuelBurn * aircraft.stations.fuel.arm);

    // Adjusted weights (with load adjustments)
    const adjustedTakeoffWeight = takeoffWeight + passengerAdj + baggageAdj + fuelAdj;
    const adjustedTakeoffMoment = takeoffMoment + 
      (passengerAdj * aircraft.stations.pilot.arm) + 
      (baggageAdj * aircraft.stations.baggage.arm) + 
      (fuelAdj * aircraft.stations.fuel.arm);

    // Total fuel required (flight fuel + reserves)
    const totalFuelRequired = fuelBurn + startTaxiRunup + 30; // 30 lbs minimum reserve

    // Center of Gravity calculations
    const takeoffCG = takeoffWeight > 0 ? takeoffMoment / takeoffWeight : 0;
    const landingCG = landingWeight > 0 ? landingMoment / landingWeight : 0;
    const rampCG = rampWeight > 0 ? rampMoment / rampWeight : 0;
    const adjustedCG = adjustedTakeoffWeight > 0 ? adjustedTakeoffMoment / adjustedTakeoffWeight : 0;

    // Validation checks
    const isWeightValid = takeoffWeight <= aircraft.maxWeight && adjustedTakeoffWeight <= aircraft.maxWeight;
    const isCGValid = takeoffCG >= aircraft.cgLimits.forward && takeoffCG <= aircraft.cgLimits.aft;
    const isFuelValid = fuel <= (aircraft.stations.fuel.maxWeight || 400);
    const isBaggageValid = baggage <= (aircraft.maxBaggageWeight || 200);

    return {
      basicEmptyWeight,
      zeroFuelWeight,
      rampWeight,
      takeoffWeight,
      landingWeight,
      adjustedTakeoffWeight,
      totalFuelRequired,
      takeoffCG,
      landingCG,
      rampCG,
      adjustedCG,
      isWeightValid,
      isCGValid,
      isFuelValid,
      isBaggageValid,
      isValid: isWeightValid && isCGValid && isFuelValid && isBaggageValid,
      breakdown: {
        basicEmptyWeight,
        basicEmptyMoment,
        pilot,
        pilotMoment,
        frontPassenger,
        frontPassengerMoment,
        rearPassenger,
        rearPassengerMoment,
        baggage,
        baggageMoment,
        fuel,
        fuelMoment,
        totalWeight: takeoffWeight,
        totalMoment: takeoffMoment
      }
    };
  }, [weights, aircraft]);

  // CG envelope graph data
  const graphData = useMemo(() => {
    if (!aircraft || !calculations) return [];
    
    const data = [];
    const weightStep = 100;
    const minWeight = Math.max(1000, aircraft.emptyWeight);
    
    for (let weight = minWeight; weight <= aircraft.maxWeight; weight += weightStep) {
      data.push({
        weight,
        forwardLimit: aircraft.cgLimits.forward,
        aftLimit: aircraft.cgLimits.aft
      });
    }
    
    return data;
  }, [aircraft, calculations]);

  const handleShare = async () => {
    if (!calculations || !aircraft) return;

    const shareText = `🛩️ Weight & Balance - ${aircraft.name}

📊 WEIGHTS:
• Basic Empty: ${calculations.basicEmptyWeight} lbs
• Zero Fuel: ${calculations.zeroFuelWeight.toFixed(1)} lbs
• Ramp: ${calculations.rampWeight.toFixed(1)} lbs
• Take-off: ${calculations.takeoffWeight.toFixed(1)} lbs
• Landing: ${calculations.landingWeight.toFixed(1)} lbs

📍 CENTER OF GRAVITY:
• Take-off: ${calculations.takeoffCG.toFixed(2)}"
• Landing: ${calculations.landingCG.toFixed(2)}"
• Limits: ${aircraft.cgLimits.forward}" - ${aircraft.cgLimits.aft}"

✅ STATUS: ${calculations.isValid ? 'WITHIN LIMITS' : 'OUT OF LIMITS'}

Generated by SkyBound Student Pilot App`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Weight & Balance Report', text: shareText });
        toast({ title: "Report Shared", description: "Weight & balance report shared successfully." });
      } catch (error) {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "Copied to Clipboard", description: "Report copied to clipboard." });
      } catch (error) {
        toast({ title: "Share Failed", description: "Unable to share report.", variant: "destructive" });
      }
    }
  };

  const handlePrint = () => {
    if (!calculations || !aircraft) return;
    
    // Generate professional print layout
    const printContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">WEIGHT & BALANCE CALCULATION</h1>
          <h2 style="color: #1e40af; margin: 10px 0;">${aircraft.name}</h2>
          <div style="margin-top: 15px; font-size: 14px;">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div style="margin: 20px 0; padding: 20px; border: 4px solid ${calculations.isValid ? '#10b981' : '#ef4444'}; border-radius: 12px; text-align: center; background-color: ${calculations.isValid ? '#f0fdf4' : '#fef2f2'};">
          <h2 style="color: ${calculations.isValid ? '#065f46' : '#991b1b'}; margin: 0; font-size: 32px;">
            ${calculations.isValid ? '✅ WITHIN LIMITS' : '❌ OUT OF LIMITS'}
          </h2>
        </div>

        <table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px;">
          <thead>
            <tr style="background-color: #1e40af; color: white;">
              <th style="border: 1px solid #1e40af; padding: 12px; text-align: left;">ITEM</th>
              <th style="border: 1px solid #1e40af; padding: 12px; text-align: left;">WEIGHT (lbs)</th>
              <th style="border: 1px solid #1e40af; padding: 12px; text-align: left;">ARM (in)</th>
              <th style="border: 1px solid #1e40af; padding: 12px; text-align: left;">MOMENT (lb-in)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background-color: #f1f5f9;">
              <td style="border: 1px solid #cbd5e1; padding: 10px; font-weight: bold;">Basic Empty Weight</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.basicEmptyWeight}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">—</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.basicEmptyMoment.toFixed(1)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Pilot</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.pilot}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${aircraft.stations.pilot.arm}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.pilotMoment.toFixed(1)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Front Passenger</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.frontPassenger}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${aircraft.stations.frontPassenger.arm}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.frontPassengerMoment.toFixed(1)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Rear Passenger</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.rearPassenger}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${aircraft.stations.rearPassenger?.arm || 0}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.rearPassengerMoment.toFixed(1)}</td>
            </tr>
            <tr style="background-color: #f9fafb;">
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Baggage</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.baggage}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${aircraft.stations.baggage.arm}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.baggageMoment.toFixed(1)}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">Fuel</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.fuel}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${aircraft.stations.fuel.arm}</td>
              <td style="border: 1px solid #cbd5e1; padding: 10px;">${calculations.breakdown.fuelMoment.toFixed(1)}</td>
            </tr>
            <tr style="background-color: #1e40af; color: white; font-weight: bold;">
              <td style="border: 2px solid #1e40af; padding: 12px;">TOTAL</td>
              <td style="border: 2px solid #1e40af; padding: 12px;">${calculations.breakdown.totalWeight.toFixed(1)}</td>
              <td style="border: 2px solid #1e40af; padding: 12px;">CG: ${calculations.takeoffCG.toFixed(2)}"</td>
              <td style="border: 2px solid #1e40af; padding: 12px;">${calculations.breakdown.totalMoment.toFixed(1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Weight & Balance - ${aircraft?.name}</title>
          <style>
            @media print { body { margin: 0; } @page { margin: 0.5in; } }
          </style>
        </head>
        <body>${printContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!aircraft || !calculations) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg animate-pulse">
          <Scale className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Professional Weight & Balance
          </h2>
          <p className="text-gray-600">ForeFlight-style calculations with real-time validation</p>
        </div>
      </div>

      <Tabs defaultValue="calculator" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="calculator"
            className="transition-all duration-300 hover:bg-blue-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600"
          >
            Weight & Balance Calculator
          </TabsTrigger>
          <TabsTrigger 
            value="profiles"
            className="transition-all duration-300 hover:bg-blue-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600"
          >
            Aircraft Profiles
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Input Section */}
            <div className="xl:col-span-2 space-y-6">
              {/* Aircraft Selection */}
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-6 w-6 text-blue-600" />
                    Aircraft Selection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-blue-600 font-medium">Aircraft</Label>
                      <Select value={aircraftType} onValueChange={setAircraftType}>
                        <SelectTrigger className="border-blue-200 focus:border-blue-400 transition-colors duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="c152">Cessna 152</SelectItem>
                          <SelectItem value="c172">Cessna 172N</SelectItem>
                          <SelectItem value="c182">Cessna 182T</SelectItem>
                          <SelectItem value="pa28">Piper Cherokee PA-28</SelectItem>
                          {supabaseAircraft.map((ac) => (
                            <SelectItem key={ac.id} value={ac.id}>
                              {ac.registration ? `${ac.registration} - ` : ''}{ac.name} (Custom)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-sm text-blue-600">Empty Weight</div>
                        <div className="font-bold text-blue-800">{aircraft.emptyWeight} lbs</div>
                      </div>
                      <div className="text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-sm text-blue-600">Max Weight</div>
                        <div className="font-bold text-blue-800">{aircraft.maxWeight} lbs</div>
                      </div>
                      <div className="text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-sm text-blue-600">CG Forward</div>
                        <div className="font-bold text-blue-800">{aircraft.cgLimits.forward}"</div>
                      </div>
                      <div className="text-center transform hover:scale-105 transition-transform duration-200">
                        <div className="text-sm text-blue-600">CG Aft</div>
                        <div className="font-bold text-blue-800">{aircraft.cgLimits.aft}"</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Occupant Loading */}
              <Card className="border-2 border-green-200 hover:border-green-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-6 w-6 text-green-600" />
                    Occupant Loading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">Pilot Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.pilot}
                        onChange={(e) => setWeights({...weights, pilot: e.target.value})}
                        className="border-green-200 focus:border-green-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">Front Passenger (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.frontPassenger}
                        onChange={(e) => setWeights({...weights, frontPassenger: e.target.value})}
                        className="border-green-200 focus:border-green-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">Rear Passenger (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.rearPassenger}
                        onChange={(e) => setWeights({...weights, rearPassenger: e.target.value})}
                        disabled={!aircraft.stations.rearPassenger?.arm}
                        className="border-green-200 focus:border-green-400 transition-colors duration-200 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Baggage & Fuel */}
              <Card className="border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-purple-600" />
                    Baggage & Fuel
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Baggage Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.baggage}
                        onChange={(e) => setWeights({...weights, baggage: e.target.value})}
                        className="border-purple-200 focus:border-purple-400 transition-colors duration-200"
                      />
                      <p className="text-xs text-purple-500 mt-1">Max: {aircraft.maxBaggageWeight} lbs</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Fuel Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.fuel}
                        onChange={(e) => setWeights({...weights, fuel: e.target.value})}
                        className="border-purple-200 focus:border-purple-400 transition-colors duration-200"
                      />
                      <p className="text-xs text-purple-500 mt-1">
                        Max: {aircraft.stations.fuel.maxWeight} lbs ({aircraft.usableFuel} gal usable)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Flight Operations */}
              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="flex items-center gap-2">
                    <Fuel className="h-6 w-6 text-orange-600" />
                    Flight Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-orange-600 font-medium">Start/Taxi/Run-up (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.startTaxiRunup}
                        onChange={(e) => setWeights({...weights, startTaxiRunup: e.target.value})}
                        className="border-orange-200 focus:border-orange-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-orange-600 font-medium">Fuel Burn (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.fuelBurn}
                        onChange={(e) => setWeights({...weights, fuelBurn: e.target.value})}
                        className="border-orange-200 focus:border-orange-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border w-full transform hover:scale-105 transition-transform duration-200">
                        <div className="text-sm text-orange-600">Total Fuel Required</div>
                        <div className="text-xl font-bold text-orange-700">{calculations.totalFuelRequired.toFixed(1)} lbs</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Load Adjustments */}
              <Card className="border-2 border-red-200 hover:border-red-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                    Load Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Passenger Adjustment (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.passengerAdjustment}
                        onChange={(e) => setWeights({...weights, passengerAdjustment: e.target.value})}
                        className="border-red-200 focus:border-red-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Baggage Adjustment (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.baggageAdjustment}
                        onChange={(e) => setWeights({...weights, baggageAdjustment: e.target.value})}
                        className="border-red-200 focus:border-red-400 transition-colors duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Fuel Adjustment (lbs)</Label>
                      <Input
                        type="number"
                        value={weights.fuelAdjustment}
                        onChange={(e) => setWeights({...weights, fuelAdjustment: e.target.value})}
                        className="border-red-200 focus:border-red-400 transition-colors duration-200"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {/* Status Overview */}
              <Card className={`border-2 transition-all duration-500 ${
                calculations.isValid 
                  ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-green-200' 
                  : 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50 shadow-red-200'
              } shadow-lg hover:shadow-xl`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calculator className="h-6 w-6" />
                      Flight Status
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleShare}
                        className="hover:bg-blue-50 transition-colors duration-200 transform hover:scale-105"
                      >
                        <Share className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handlePrint}
                        className="hover:bg-blue-50 transition-colors duration-200 transform hover:scale-105"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-center p-6 rounded-lg mb-4 transition-all duration-500 transform ${
                    calculations.isValid 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 scale-105' 
                      : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 animate-pulse'
                  }`}>
                    <div className="text-3xl font-bold mb-2">
                      {calculations.isValid ? '✅ FLIGHT APPROVED' : '❌ FLIGHT RESTRICTED'}
                    </div>
                    <div className="text-sm">
                      {calculations.isValid ? 'Aircraft within all operational limits' : 'Aircraft exceeds operational limits'}
                    </div>
                  </div>

                  {!calculations.isValid && (
                    <div className="space-y-3">
                      {!calculations.isWeightValid && (
                        <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded animate-pulse">
                          <AlertTriangle className="h-4 w-4" />
                          Weight exceeds maximum gross weight
                        </div>
                      )}
                      {!calculations.isCGValid && (
                        <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded animate-pulse">
                          <AlertTriangle className="h-4 w-4" />
                          Center of gravity out of limits
                        </div>
                      )}
                      {!calculations.isFuelValid && (
                        <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded animate-pulse">
                          <AlertTriangle className="h-4 w-4" />
                          Fuel weight exceeds capacity
                        </div>
                      )}
                      {!calculations.isBaggageValid && (
                        <div className="flex items-center gap-2 text-red-600 text-sm p-2 bg-red-50 rounded animate-pulse">
                          <AlertTriangle className="h-4 w-4" />
                          Baggage weight exceeds limit
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Weight Summary */}
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-blue-700">Weight Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Basic Empty Weight:</span>
                      <span className="font-bold">{calculations.basicEmptyWeight} lbs</span>
                    </div>
                    <div className="flex justify-between p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Zero Fuel Weight:</span>
                      <span className="font-bold">{calculations.zeroFuelWeight.toFixed(1)} lbs</span>
                    </div>
                    <div className="flex justify-between p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Ramp Weight:</span>
                      <span className="font-bold">{calculations.rampWeight.toFixed(1)} lbs</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Take-off Weight:</span>
                      <span className={`font-bold transition-colors duration-300 ${calculations.isWeightValid ? 'text-green-600' : 'text-red-600'}`}>
                        {calculations.takeoffWeight.toFixed(1)} lbs
                      </span>
                    </div>
                    <div className="flex justify-between p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Landing Weight:</span>
                      <span className="font-bold">{calculations.landingWeight.toFixed(1)} lbs</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 p-2 hover:bg-blue-50 rounded transition-colors duration-200">
                      <span>Adjusted Take-off Weight:</span>
                      <span className="font-bold text-blue-600">{calculations.adjustedTakeoffWeight.toFixed(1)} lbs</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CG Summary */}
              <Card className="border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="text-purple-700">Center of Gravity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between p-2 hover:bg-purple-50 rounded transition-colors duration-200">
                      <span>Ramp CG:</span>
                      <span className="font-bold">{calculations.rampCG.toFixed(2)}"</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 p-2 hover:bg-purple-50 rounded transition-colors duration-200">
                      <span>Take-off CG:</span>
                      <span className={`font-bold transition-colors duration-300 ${calculations.isCGValid ? 'text-green-600' : 'text-red-600'}`}>
                        {calculations.takeoffCG.toFixed(2)}"
                      </span>
                    </div>
                    <div className="flex justify-between p-2 hover:bg-purple-50 rounded transition-colors duration-200">
                      <span>Landing CG:</span>
                      <span className="font-bold">{calculations.landingCG.toFixed(2)}"</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 p-2 hover:bg-purple-50 rounded transition-colors duration-200">
                      <span>Adjusted CG:</span>
                      <span className="font-bold text-purple-600">{calculations.adjustedCG.toFixed(2)}"</span>
                    </div>
                    <div className="text-xs text-purple-500 mt-3 p-2 bg-purple-50 rounded">
                      Limits: {aircraft.cgLimits.forward}" - {aircraft.cgLimits.aft}"
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CG Envelope Graph */}
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Center of Gravity Envelope
              </CardTitle>
              <CardDescription>Real-time aircraft loading validation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="weight" 
                      label={{ value: 'Weight (lbs)', position: 'insideBottom', offset: -10 }}
                      className="text-sm"
                    />
                    <YAxis 
                      domain={[aircraft.cgLimits.forward - 2, aircraft.cgLimits.aft + 2]}
                      label={{ value: 'CG Position (inches)', angle: -90, position: 'insideLeft' }}
                      className="text-sm"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="aftLimit"
                      fill="#ef4444"
                      fillOpacity={0.1}
                      stroke="none"
                    />
                    <Area
                      type="monotone"
                      dataKey="forwardLimit"
                      fill="#ffffff"
                      fillOpacity={1}
                      stroke="none"
                    />
                    <Line type="monotone" dataKey="forwardLimit" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="aftLimit" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <ReferenceLine 
                      y={calculations.takeoffCG} 
                      stroke="#10b981" 
                      strokeWidth={3} 
                      strokeDasharray="5 5"
                      className="animate-pulse"
                    />
                    <ReferenceLine 
                      y={calculations.landingCG} 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      strokeDasharray="2 2"
                    />
                    <ReferenceLine 
                      x={calculations.takeoffWeight} 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      strokeDasharray="5 5"
                      className="animate-pulse"
                    />
                    <ReferenceLine 
                      x={calculations.landingWeight} 
                      stroke="#3b82f6" 
                      strokeWidth={2} 
                      strokeDasharray="2 2"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>CG Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-green-500"></div>
                  <span>Take-off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-1 bg-blue-500" style={{ borderTop: '2px dashed' }}></div>
                  <span>Landing</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="profiles">
          <AircraftProfileManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};
