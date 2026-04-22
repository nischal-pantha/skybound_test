
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plane, Plus, Edit, Trash2, Save, X, Check } from "lucide-react";
import { useSupabaseAircraft } from "@/hooks/useSupabaseAircraft";
import { useToast } from "@/hooks/use-toast";

interface AircraftFormData {
  name: string;
  tailNumber: string;
  make: string;
  model: string;
  year: string;
  emptyWeight: string;
  emptyMoment: string;
  maxWeight: string;
  cgForward: string;
  cgAft: string;
  pilotArm: string;
  frontPassengerArm: string;
  rearPassengerArm: string;
  baggageArm: string;
  fuelArm: string;
  fuelCapacity: string;
  usableFuel: string;
  maxBaggageWeight: string;
  // Performance data
  takeoffGroundRoll: string;
  takeoffOver50ft: string;
  landingGroundRoll: string;
  landingOver50ft: string;
  bestGlideSpeed: string;
  stallSpeedClean: string;
  stallSpeedLanding: string;
  vr: string;
  vx: string;
  vy: string;
  cruiseSpeed: string;
  serviceCeiling: string;
  fuelFlowCruise65: string;
  fuelFlowCruise75: string;
}

interface AircraftManagerProps {
  onClose?: () => void;
  prefilledData?: any;
  compact?: boolean;
}

export const AircraftManager = ({ onClose, prefilledData, compact = false }: AircraftManagerProps) => {
  const { aircraft, addAircraft, updateAircraft, deleteAircraft } = useSupabaseAircraft();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<AircraftFormData>({
    name: prefilledData?.name || "",
    tailNumber: prefilledData?.tailNumber || "",
    make: prefilledData?.make || "",
    model: prefilledData?.model || "",
    year: prefilledData?.year || "",
    emptyWeight: prefilledData?.emptyWeight?.toString() || "",
    emptyMoment: prefilledData?.emptyMoment?.toString() || "",
    maxWeight: prefilledData?.maxWeight?.toString() || "",
    cgForward: prefilledData?.cgLimits?.forward?.toString() || "",
    cgAft: prefilledData?.cgLimits?.aft?.toString() || "",
    pilotArm: prefilledData?.stations?.pilot?.arm?.toString() || "",
    frontPassengerArm: prefilledData?.stations?.frontPassenger?.arm?.toString() || "",
    rearPassengerArm: prefilledData?.stations?.rearPassenger?.arm?.toString() || "",
    baggageArm: prefilledData?.stations?.baggage?.arm?.toString() || "",
    fuelArm: prefilledData?.stations?.fuel?.arm?.toString() || "",
    fuelCapacity: prefilledData?.fuelCapacity?.toString() || "",
    usableFuel: prefilledData?.usableFuel?.toString() || "",
    maxBaggageWeight: prefilledData?.maxBaggageWeight?.toString() || "",
    takeoffGroundRoll: prefilledData?.performance?.takeoffGroundRoll?.toString() || "",
    takeoffOver50ft: prefilledData?.performance?.takeoffOver50ft?.toString() || "",
    landingGroundRoll: prefilledData?.performance?.landingGroundRoll?.toString() || "",
    landingOver50ft: prefilledData?.performance?.landingOver50ft?.toString() || "",
    bestGlideSpeed: prefilledData?.performance?.bestGlideSpeed?.toString() || "",
    stallSpeedClean: prefilledData?.performance?.stallSpeedClean?.toString() || "",
    stallSpeedLanding: prefilledData?.performance?.stallSpeedLanding?.toString() || "",
    vr: prefilledData?.performance?.vr?.toString() || "",
    vx: prefilledData?.performance?.vx?.toString() || "",
    vy: prefilledData?.performance?.vy?.toString() || "",
    cruiseSpeed: prefilledData?.performance?.cruiseSpeed?.toString() || "",
    serviceCeiling: prefilledData?.performance?.serviceCeiling?.toString() || "",
    fuelFlowCruise65: prefilledData?.performance?.fuelFlow?.cruise65?.toString() || "",
    fuelFlowCruise75: prefilledData?.performance?.fuelFlow?.cruise75?.toString() || "",
  });

  const [activeTab, setActiveTab] = useState("basic");

  const handleSubmit = () => {
    if (!formData.name || !formData.tailNumber) {
      toast({
        title: "Missing Information",
        description: "Please provide at least aircraft name and tail number.",
        variant: "destructive",
      });
      return;
    }

    const aircraftData = {
      name: formData.name,
      tailNumber: formData.tailNumber,
      make: formData.make,
      model: formData.model,
      year: formData.year,
      emptyWeight: parseFloat(formData.emptyWeight) || 0,
      emptyMoment: parseFloat(formData.emptyMoment) || 0,
      maxWeight: parseFloat(formData.maxWeight) || 0,
      cgLimits: {
        forward: parseFloat(formData.cgForward) || 0,
        aft: parseFloat(formData.cgAft) || 0,
      },
      stations: {
        pilot: { arm: parseFloat(formData.pilotArm) || 0 },
        frontPassenger: { arm: parseFloat(formData.frontPassengerArm) || 0 },
        rearPassenger: { arm: parseFloat(formData.rearPassengerArm) || 0 },
        baggage: { arm: parseFloat(formData.baggageArm) || 0 },
        fuel: { 
          arm: parseFloat(formData.fuelArm) || 0,
          maxWeight: parseFloat(formData.fuelCapacity) * 6 || 0
        },
      },
      fuelCapacity: parseFloat(formData.fuelCapacity) || 0,
      usableFuel: parseFloat(formData.usableFuel) || 0,
      maxBaggageWeight: parseFloat(formData.maxBaggageWeight) || 0,
      performance: {
        takeoffGroundRoll: parseFloat(formData.takeoffGroundRoll) || 0,
        takeoffOver50ft: parseFloat(formData.takeoffOver50ft) || 0,
        landingGroundRoll: parseFloat(formData.landingGroundRoll) || 0,
        landingOver50ft: parseFloat(formData.landingOver50ft) || 0,
        bestGlideSpeed: parseFloat(formData.bestGlideSpeed) || 0,
        stallSpeedClean: parseFloat(formData.stallSpeedClean) || 0,
        stallSpeedLanding: parseFloat(formData.stallSpeedLanding) || 0,
        vr: parseFloat(formData.vr) || 0,
        vx: parseFloat(formData.vx) || 0,
        vy: parseFloat(formData.vy) || 0,
        cruiseSpeed: parseFloat(formData.cruiseSpeed) || 0,
        serviceCeiling: parseFloat(formData.serviceCeiling) || 0,
        fuelFlow: {
          cruise65: parseFloat(formData.fuelFlowCruise65) || 0,
          cruise75: parseFloat(formData.fuelFlowCruise75) || 0,
        },
      },
    };

    const supabaseProfile = {
      name: formData.name,
      registration: formData.tailNumber,
      empty_weight: parseFloat(formData.emptyWeight) || null,
      max_weight: parseFloat(formData.maxWeight) || null,
      forward_cg_limit: parseFloat(formData.cgForward) || null,
      aft_cg_limit: parseFloat(formData.cgAft) || null,
      fuel_arm: parseFloat(formData.fuelArm) || null,
      front_seat_arm: parseFloat(formData.frontPassengerArm) || null,
      rear_seat_arm: parseFloat(formData.rearPassengerArm) || null,
      baggage_arm: parseFloat(formData.baggageArm) || null,
      max_fuel: parseFloat(formData.fuelCapacity) || null,
      fuel_burn_rate: parseFloat(formData.fuelFlowCruise75) || null,
      cruise_speed: parseFloat(formData.cruiseSpeed) || null,
      max_range: null,
      service_ceiling: parseFloat(formData.serviceCeiling) || null,
      performance_data: aircraftData
    };

    addAircraft(supabaseProfile);
    
    if (onClose) onClose();
  };

  if (compact) {
    return (
      <Card className="animate-scale-in">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plane className="h-5 w-5" />
              Quick Add Aircraft
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Aircraft Name</Label>
              <Input
                placeholder="Cessna 172N"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Tail Number</Label>
              <Input
                placeholder="N123AB"
                value={formData.tailNumber}
                onChange={(e) => setFormData({ ...formData, tailNumber: e.target.value.toUpperCase() })}
                className="text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm">Make</Label>
              <Input
                placeholder="Cessna"
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-sm">Model</Label>
              <Input
                placeholder="172N"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Aircraft
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plane className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Aircraft Manager</h2>
            <p className="text-muted-foreground">Add and manage your aircraft profiles</p>
          </div>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="weight">Weight & Balance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Aircraft Information</CardTitle>
              <CardDescription>Enter the basic details of your aircraft</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Aircraft Name *</Label>
                  <Input
                    placeholder="Cessna 172N Skyhawk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tail Number *</Label>
                  <Input
                    placeholder="N123AB"
                    value={formData.tailNumber}
                    onChange={(e) => setFormData({ ...formData, tailNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label>Make</Label>
                  <Input
                    placeholder="Cessna"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input
                    placeholder="172N"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input
                    placeholder="1979"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weight" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weight & Balance Data</CardTitle>
              <CardDescription>Configure weight and balance parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Empty Weight (lbs)</Label>
                  <Input
                    type="number"
                    placeholder="1663"
                    value={formData.emptyWeight}
                    onChange={(e) => setFormData({ ...formData, emptyWeight: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Empty Moment (lb-in)</Label>
                  <Input
                    type="number"
                    placeholder="63540"
                    value={formData.emptyMoment}
                    onChange={(e) => setFormData({ ...formData, emptyMoment: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Max Gross Weight (lbs)</Label>
                  <Input
                    type="number"
                    placeholder="2300"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Forward CG Limit (in)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="35.0"
                    value={formData.cgForward}
                    onChange={(e) => setFormData({ ...formData, cgForward: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Aft CG Limit (in)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="40.5"
                    value={formData.cgAft}
                    onChange={(e) => setFormData({ ...formData, cgAft: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Station Arms</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Pilot Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={formData.pilotArm}
                      onChange={(e) => setFormData({ ...formData, pilotArm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Front Passenger Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="37.0"
                      value={formData.frontPassengerArm}
                      onChange={(e) => setFormData({ ...formData, frontPassengerArm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Rear Passenger Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="73.0"
                      value={formData.rearPassengerArm}
                      onChange={(e) => setFormData({ ...formData, rearPassengerArm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Baggage Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="95.0"
                      value={formData.baggageArm}
                      onChange={(e) => setFormData({ ...formData, baggageArm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fuel Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="48.0"
                      value={formData.fuelArm}
                      onChange={(e) => setFormData({ ...formData, fuelArm: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Max Baggage Weight (lbs)</Label>
                    <Input
                      type="number"
                      placeholder="120"
                      value={formData.maxBaggageWeight}
                      onChange={(e) => setFormData({ ...formData, maxBaggageWeight: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Fuel Capacity (gal)</Label>
                  <Input
                    type="number"
                    placeholder="43"
                    value={formData.fuelCapacity}
                    onChange={(e) => setFormData({ ...formData, fuelCapacity: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Usable Fuel (gal)</Label>
                  <Input
                    type="number"
                    placeholder="40"
                    value={formData.usableFuel}
                    onChange={(e) => setFormData({ ...formData, usableFuel: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Data</CardTitle>
              <CardDescription>Enter performance specifications for your aircraft</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Takeoff Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ground Roll (ft)</Label>
                    <Input
                      type="number"
                      placeholder="865"
                      value={formData.takeoffGroundRoll}
                      onChange={(e) => setFormData({ ...formData, takeoffGroundRoll: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Over 50ft Obstacle (ft)</Label>
                    <Input
                      type="number"
                      placeholder="1440"
                      value={formData.takeoffOver50ft}
                      onChange={(e) => setFormData({ ...formData, takeoffOver50ft: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Landing Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Ground Roll (ft)</Label>
                    <Input
                      type="number"
                      placeholder="550"
                      value={formData.landingGroundRoll}
                      onChange={(e) => setFormData({ ...formData, landingGroundRoll: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Over 50ft Obstacle (ft)</Label>
                    <Input
                      type="number"
                      placeholder="1290"
                      value={formData.landingOver50ft}
                      onChange={(e) => setFormData({ ...formData, landingOver50ft: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">V-Speeds</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>VR (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="55"
                      value={formData.vr}
                      onChange={(e) => setFormData({ ...formData, vr: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>VX (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="62"
                      value={formData.vx}
                      onChange={(e) => setFormData({ ...formData, vx: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>VY (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="79"
                      value={formData.vy}
                      onChange={(e) => setFormData({ ...formData, vy: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Best Glide (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="68"
                      value={formData.bestGlideSpeed}
                      onChange={(e) => setFormData({ ...formData, bestGlideSpeed: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stall Clean (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="51"
                      value={formData.stallSpeedClean}
                      onChange={(e) => setFormData({ ...formData, stallSpeedClean: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Stall Landing (KIAS)</Label>
                    <Input
                      type="number"
                      placeholder="47"
                      value={formData.stallSpeedLanding}
                      onChange={(e) => setFormData({ ...formData, stallSpeedLanding: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cruise Performance</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cruise Speed (KTAS)</Label>
                    <Input
                      type="number"
                      placeholder="122"
                      value={formData.cruiseSpeed}
                      onChange={(e) => setFormData({ ...formData, cruiseSpeed: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Service Ceiling (ft)</Label>
                    <Input
                      type="number"
                      placeholder="14200"
                      value={formData.serviceCeiling}
                      onChange={(e) => setFormData({ ...formData, serviceCeiling: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fuel Flow 65% (GPH)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="8.1"
                      value={formData.fuelFlowCruise65}
                      onChange={(e) => setFormData({ ...formData, fuelFlowCruise65: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fuel Flow 75% (GPH)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="9.6"
                      value={formData.fuelFlowCruise75}
                      onChange={(e) => setFormData({ ...formData, fuelFlowCruise75: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Aircraft Profile</CardTitle>
              <CardDescription>Review and save your aircraft configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Basic Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Name:</span>
                      <span className="font-medium">{formData.name || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tail Number:</span>
                      <span className="font-medium">{formData.tailNumber || "Not set"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Make/Model:</span>
                      <span className="font-medium">{formData.make} {formData.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Year:</span>
                      <span className="font-medium">{formData.year || "Not set"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Weight & Balance
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Empty Weight:</span>
                      <span className="font-medium">{formData.emptyWeight || "0"} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Weight:</span>
                      <span className="font-medium">{formData.maxWeight || "0"} lbs</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CG Range:</span>
                      <span className="font-medium">{formData.cgForward || "0"}" - {formData.cgAft || "0"}"</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} className="w-full" size="lg">
                <Save className="h-4 w-4 mr-2" />
                Save Aircraft Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
