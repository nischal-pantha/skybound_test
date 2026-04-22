
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, AlertTriangle, Calculator, TrendingUp, Fuel, Users, Package, Plane } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useToast } from "@/hooks/use-toast";

interface WeightData {
  basicEmptyWeight: string;
  pilot: string;
  frontPassenger: string;
  rearPassenger: string;
  baggage: string;
  totalFuel: string;
  fuelBurn: string;
  startTaxiRunup: string;
  loadAdjustmentPassengers: string;
  loadAdjustmentBaggage: string;
  loadAdjustmentFuel: string;
}

const aircraftDatabase = {
  c152: {
    name: "Cessna 152",
    basicEmptyWeight: 1129,
    maxWeight: 1670,
    maxFuel: 150,
    cgLimits: { forward: 31.0, aft: 36.5 },
    arms: { pilot: 32.0, frontPassenger: 32.0, rearPassenger: 0, baggage: 64.0, fuel: 40.0 }
  },
  c172: {
    name: "Cessna 172N",
    basicEmptyWeight: 1663,
    maxWeight: 2300,
    maxFuel: 300,
    cgLimits: { forward: 35.0, aft: 40.9 },
    arms: { pilot: 37.0, frontPassenger: 37.0, rearPassenger: 73.0, baggage: 95.0, fuel: 48.0 }
  },
  c182: {
    name: "Cessna 182T",
    basicEmptyWeight: 1883,
    maxWeight: 3100,
    maxFuel: 564,
    cgLimits: { forward: 32.5, aft: 40.5 },
    arms: { pilot: 37.0, frontPassenger: 37.0, rearPassenger: 73.0, baggage: 95.0, fuel: 48.0 }
  },
  pa28: {
    name: "Piper Cherokee PA-28",
    basicEmptyWeight: 1205,
    maxWeight: 2150,
    maxFuel: 300,
    cgLimits: { forward: 83.0, aft: 95.0 },
    arms: { pilot: 85.5, frontPassenger: 85.5, rearPassenger: 118.0, baggage: 118.0, fuel: 95.0 }
  }
};

export const EnhancedWeightBalance = () => {
  const [aircraftType, setAircraftType] = useState("c172");
  const [weights, setWeights] = useState<WeightData>({
    basicEmptyWeight: "1663",
    pilot: "170",
    frontPassenger: "0",
    rearPassenger: "0",
    baggage: "0",
    totalFuel: "240",
    fuelBurn: "20",
    startTaxiRunup: "5",
    loadAdjustmentPassengers: "0",
    loadAdjustmentBaggage: "0",
    loadAdjustmentFuel: "0"
  });

  const { toast } = useToast();
  const aircraft = aircraftDatabase[aircraftType as keyof typeof aircraftDatabase];

  // Update basic empty weight when aircraft changes
  useEffect(() => {
    setWeights(prev => ({
      ...prev,
      basicEmptyWeight: aircraft.basicEmptyWeight.toString()
    }));
  }, [aircraft.basicEmptyWeight]);

  const calculations = useMemo(() => {
    const basicEmptyWeight = parseFloat(weights.basicEmptyWeight) || 0;
    const pilot = parseFloat(weights.pilot) || 0;
    const frontPassenger = parseFloat(weights.frontPassenger) || 0;
    const rearPassenger = parseFloat(weights.rearPassenger) || 0;
    const baggage = parseFloat(weights.baggage) || 0;
    const totalFuel = parseFloat(weights.totalFuel) || 0;
    const fuelBurn = parseFloat(weights.fuelBurn) || 0;
    const startTaxiRunup = parseFloat(weights.startTaxiRunup) || 0;
    
    // Ensure aircraft object exists and has required properties
    if (!aircraft || !aircraft.arms) {
      console.error('Aircraft data not properly loaded:', aircraft);
      console.error('Available aircraft types:', Object.keys(aircraftDatabase));
      console.error('Selected aircraft type:', aircraftType);
      return {
        basicEmptyWeight: 0,
        zeroFuelWeight: 0,
        rampWeight: 0,
        takeoffWeight: 0,
        landingWeight: 0,
        adjustedTakeoffWeight: 0,
        totalFuelRequired: 0,
        centerOfGravity: 0,
        landingCG: 0,
        isWeightValid: false,
        isCGValid: false,
        isFuelValid: false,
        isValid: false,
        adjustedPassengerWeight: 0,
        adjustedBaggageWeight: 0,
        adjustedFuelWeight: 0
      };
    }
    
    // Load adjustments
    const adjPassengers = parseFloat(weights.loadAdjustmentPassengers) || 0;
    const adjBaggage = parseFloat(weights.loadAdjustmentBaggage) || 0;
    const adjFuel = parseFloat(weights.loadAdjustmentFuel) || 0;

    // Basic calculations
    const zeroFuelWeight = basicEmptyWeight + pilot + frontPassenger + rearPassenger + baggage;
    const rampWeight = zeroFuelWeight + totalFuel;
    const takeoffWeight = rampWeight - startTaxiRunup;
    const landingWeight = takeoffWeight - fuelBurn;
    
    // Adjusted weights
    const adjustedPassengerWeight = pilot + frontPassenger + rearPassenger + adjPassengers;
    const adjustedBaggageWeight = baggage + adjBaggage;
    const adjustedFuelWeight = totalFuel + adjFuel;
    const adjustedTakeoffWeight = basicEmptyWeight + adjustedPassengerWeight + adjustedBaggageWeight + adjustedFuelWeight - startTaxiRunup;
    
    // Total fuel required calculation
    const totalFuelRequired = fuelBurn + startTaxiRunup + 30; // 30 lbs reserve

    // Moment calculations
    const basicEmptyMoment = basicEmptyWeight * ((aircraft.arms.pilot + aircraft.arms.fuel) / 2); // Estimated
    const pilotMoment = pilot * aircraft.arms.pilot;
    const frontPassengerMoment = frontPassenger * aircraft.arms.frontPassenger;
    const rearPassengerMoment = rearPassenger * aircraft.arms.rearPassenger;
    const baggageMoment = baggage * aircraft.arms.baggage;
    const fuelMoment = totalFuel * aircraft.arms.fuel;
    
    const totalMoment = basicEmptyMoment + pilotMoment + frontPassengerMoment + rearPassengerMoment + baggageMoment + fuelMoment;
    const centerOfGravity = rampWeight > 0 ? totalMoment / rampWeight : 0;
    
    // Landing CG calculation
    const landingMoment = totalMoment - (fuelBurn * aircraft.arms.fuel);
    const landingCG = landingWeight > 0 ? landingMoment / landingWeight : 0;

    // Validation
    const isWeightValid = takeoffWeight <= aircraft.maxWeight && adjustedTakeoffWeight <= aircraft.maxWeight;
    const isCGValid = centerOfGravity >= aircraft.cgLimits.forward && centerOfGravity <= aircraft.cgLimits.aft;
    const isFuelValid = totalFuel <= aircraft.maxFuel && adjustedFuelWeight <= aircraft.maxFuel;

    return {
      basicEmptyWeight,
      zeroFuelWeight,
      rampWeight,
      takeoffWeight,
      landingWeight,
      adjustedTakeoffWeight,
      totalFuelRequired,
      centerOfGravity,
      landingCG,
      isWeightValid,
      isCGValid,
      isFuelValid,
      isValid: isWeightValid && isCGValid && isFuelValid,
      adjustedPassengerWeight,
      adjustedBaggageWeight,
      adjustedFuelWeight
    };
  }, [weights, aircraft]);

  // Graph data for CG envelope
  const graphData = useMemo(() => {
    const data = [];
    const weightStep = 100;
    const minWeight = Math.max(1000, aircraft.basicEmptyWeight);
    const maxWeight = aircraft.maxWeight;

    for (let weight = minWeight; weight <= maxWeight; weight += weightStep) {
      data.push({
        weight,
        forwardLimit: aircraft.cgLimits.forward,
        aftLimit: aircraft.cgLimits.aft,
        currentCG: weight === Math.round(calculations.takeoffWeight / weightStep) * weightStep ? calculations.centerOfGravity : null,
        landingCG: weight === Math.round(calculations.landingWeight / weightStep) * weightStep ? calculations.landingCG : null
      });
    }
    
    return data;
  }, [aircraft, calculations]);

  const handleWeightChange = (field: keyof WeightData, value: string) => {
    setWeights(prev => ({ ...prev, [field]: value }));
    
    // Show toast for validation errors
    if (!calculations.isValid) {
      const errors = [];
      if (!calculations.isWeightValid) errors.push("Weight exceeds maximum");
      if (!calculations.isCGValid) errors.push("CG out of limits"); 
      if (!calculations.isFuelValid) errors.push("Fuel exceeds capacity");
      
      if (errors.length > 0) {
        toast({
          title: "⚠ Weight & Balance Warning",
          description: errors.join(" • "),
          variant: "destructive",
        });
      }
    } else if (calculations.isValid) {
      toast({
        title: "✓ Weight & Balance Valid",
        description: "Aircraft is within all operating limits",
        variant: "default",
      });
    }
  };

  return (
    <div className="space-y-6 p-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg animate-bounce-in">
          <Scale className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Enhanced Weight & Balance Calculator
          </h2>
          <p className="text-gray-600">Comprehensive aircraft weight and balance analysis with real-time calculations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-2 border-blue-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-6 w-6 text-blue-600" />
                Aircraft Selection & Basic Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Aircraft Type</Label>
                  <Select value={aircraftType} onValueChange={setAircraftType}>
                    <SelectTrigger className="border-2 hover:border-blue-300 transition-all duration-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="c152">Cessna 152</SelectItem>
                      <SelectItem value="c172">Cessna 172N</SelectItem>
                      <SelectItem value="c182">Cessna 182T</SelectItem>
                      <SelectItem value="pa28">Piper Cherokee PA-28</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Basic Empty Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.basicEmptyWeight}
                    onChange={(e) => handleWeightChange('basicEmptyWeight', e.target.value)}
                    className="border-2 hover:border-blue-300 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-green-600" />
                Occupant Loading
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Pilot Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.pilot}
                    onChange={(e) => handleWeightChange('pilot', e.target.value)}
                    className="border-2 hover:border-green-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Front Passenger (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.frontPassenger}
                    onChange={(e) => handleWeightChange('frontPassenger', e.target.value)}
                    className="border-2 hover:border-green-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Rear Passenger (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.rearPassenger}
                    onChange={(e) => handleWeightChange('rearPassenger', e.target.value)}
                    className="border-2 hover:border-green-300 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6 text-purple-600" />
                Baggage & Fuel Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Baggage Weight (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.baggage}
                    onChange={(e) => handleWeightChange('baggage', e.target.value)}
                    className="border-2 hover:border-purple-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Total Fuel (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.totalFuel}
                    onChange={(e) => handleWeightChange('totalFuel', e.target.value)}
                    className="border-2 hover:border-purple-300 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-6 w-6 text-orange-600" />
                Flight Operations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Start/Taxi/Run-up Fuel (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.startTaxiRunup}
                    onChange={(e) => handleWeightChange('startTaxiRunup', e.target.value)}
                    className="border-2 hover:border-orange-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Fuel Burn (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.fuelBurn}
                    onChange={(e) => handleWeightChange('fuelBurn', e.target.value)}
                    className="border-2 hover:border-orange-300 transition-all duration-200"
                  />
                </div>
                <div className="flex items-end">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 w-full">
                    <div className="text-sm text-orange-600 font-medium">Total Fuel Required</div>
                    <div className="text-xl font-bold text-orange-700">{calculations.totalFuelRequired.toFixed(1)} lbs</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-red-600" />
                Load Adjustments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Passenger Adjustment (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.loadAdjustmentPassengers}
                    onChange={(e) => handleWeightChange('loadAdjustmentPassengers', e.target.value)}
                    className="border-2 hover:border-red-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Baggage Adjustment (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.loadAdjustmentBaggage}
                    onChange={(e) => handleWeightChange('loadAdjustmentBaggage', e.target.value)}
                    className="border-2 hover:border-red-300 transition-all duration-200"
                  />
                </div>
                <div>
                  <Label>Fuel Adjustment (lbs)</Label>
                  <Input
                    type="number"
                    value={weights.loadAdjustmentFuel}
                    onChange={(e) => handleWeightChange('loadAdjustmentFuel', e.target.value)}
                    className="border-2 hover:border-red-300 transition-all duration-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <Card className={`border-2 hover:shadow-xl transition-all duration-300 animate-scale-in ${
            calculations.isValid ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Weight Summary
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  calculations.isValid 
                    ? 'bg-green-100 text-green-800 animate-pulse' 
                    : 'bg-red-100 text-red-800 animate-pulse'
                }`}>
                  {calculations.isValid ? '✓ VALID' : '⚠ INVALID'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-gray-600">Zero Fuel Weight</div>
                  <div className="text-lg font-bold">{calculations.zeroFuelWeight.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-gray-600">Ramp Weight</div>
                  <div className="text-lg font-bold">{calculations.rampWeight.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-gray-600">Take-off Weight</div>
                  <div className="text-lg font-bold">{calculations.takeoffWeight.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <div className="text-gray-600">Landing Weight</div>
                  <div className="text-lg font-bold">{calculations.landingWeight.toFixed(1)} lbs</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 col-span-2">
                  <div className="text-blue-600">Adjusted Take-off Weight</div>
                  <div className="text-xl font-bold text-blue-700">{calculations.adjustedTakeoffWeight.toFixed(1)} lbs</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Center of Gravity (T/O):</span>
                  <span className={`font-bold ${calculations.isCGValid ? 'text-green-600' : 'text-red-600'}`}>
                    {calculations.centerOfGravity.toFixed(2)}"
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Center of Gravity (Landing):</span>
                  <span className="font-bold text-blue-600">{calculations.landingCG.toFixed(2)}"</span>
                </div>
                <div className="text-xs text-gray-500">
                  Limits: {aircraft.cgLimits.forward}" - {aircraft.cgLimits.aft}"
                </div>
              </div>

              {!calculations.isValid && (
                <div className="space-y-2">
                  {!calculations.isWeightValid && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Weight exceeds maximum
                    </div>
                  )}
                  {!calculations.isCGValid && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      CG out of limits
                    </div>
                  )}
                  {!calculations.isFuelValid && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Fuel exceeds capacity
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* CG Envelope Graph */}
          <Card className="border-2 border-blue-200 hover:shadow-xl transition-all duration-300 animate-scale-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Center of Gravity Envelope
              </CardTitle>
              <CardDescription>Weight vs CG position with flight phases</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="weight" 
                      label={{ value: 'Weight (lbs)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      domain={[aircraft.cgLimits.forward - 2, aircraft.cgLimits.aft + 2]}
                      label={{ value: 'CG Position (inches)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        `${Number(value).toFixed(2)}"`, 
                        name === 'forwardLimit' ? 'Forward Limit' : 
                        name === 'aftLimit' ? 'Aft Limit' : 
                        name === 'currentCG' ? 'Current CG' : 'Landing CG'
                      ]}
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
                    <ReferenceLine y={calculations.centerOfGravity} stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" />
                    <ReferenceLine y={calculations.landingCG} stroke="#3b82f6" strokeWidth={3} strokeDasharray="2 2" />
                    <ReferenceLine x={calculations.takeoffWeight} stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
                    <ReferenceLine x={calculations.landingWeight} stroke="#3b82f6" strokeWidth={2} strokeDasharray="2 2" />
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
        </div>
      </div>
    </div>
  );
};
