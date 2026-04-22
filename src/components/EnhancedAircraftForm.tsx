
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plane, X, Save, Calculator } from "lucide-react";

interface AircraftFormData {
  name: string;
  emptyWeight: string;
  emptyMoment: string;
  maxWeight: string;
  cgForward: string;
  cgAft: string;
  pilotArm: string;
  passengerArm: string;
  baggageArm: string;
  fuelArm: string;
  maxBaggageWeight: string;
  fuelCapacity: string;
  usableFuel: string;
  fuelMaxWeight: string;
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

interface EnhancedAircraftFormProps {
  onAddAircraft: (id: string, aircraft: any) => void;
  onClose: () => void;
  editingAircraft?: any;
}

export const EnhancedAircraftForm = ({ onAddAircraft, onClose, editingAircraft }: EnhancedAircraftFormProps) => {
  const [formData, setFormData] = useState<AircraftFormData>({
    name: editingAircraft?.name || "",
    emptyWeight: editingAircraft?.emptyWeight?.toString() || "",
    emptyMoment: editingAircraft?.emptyMoment?.toString() || "",
    maxWeight: editingAircraft?.maxWeight?.toString() || "",
    cgForward: editingAircraft?.cgLimits?.forward?.toString() || "",
    cgAft: editingAircraft?.cgLimits?.aft?.toString() || "",
    pilotArm: editingAircraft?.stations?.pilot?.arm?.toString() || "",
    passengerArm: editingAircraft?.stations?.passenger?.arm?.toString() || "",
    baggageArm: editingAircraft?.stations?.baggage?.arm?.toString() || "",
    fuelArm: editingAircraft?.stations?.fuel?.arm?.toString() || "",
    maxBaggageWeight: editingAircraft?.maxBaggageWeight?.toString() || "",
    fuelCapacity: editingAircraft?.fuelCapacity?.toString() || "",
    usableFuel: editingAircraft?.usableFuel?.toString() || "",
    fuelMaxWeight: editingAircraft?.stations?.fuel?.maxWeight?.toString() || "",
    // Performance defaults
    takeoffGroundRoll: editingAircraft?.performance?.takeoffGroundRoll?.toString() || "",
    takeoffOver50ft: editingAircraft?.performance?.takeoffOver50ft?.toString() || "",
    landingGroundRoll: editingAircraft?.performance?.landingGroundRoll?.toString() || "",
    landingOver50ft: editingAircraft?.performance?.landingOver50ft?.toString() || "",
    bestGlideSpeed: editingAircraft?.performance?.bestGlideSpeed?.toString() || "",
    stallSpeedClean: editingAircraft?.performance?.stallSpeedClean?.toString() || "",
    stallSpeedLanding: editingAircraft?.performance?.stallSpeedLanding?.toString() || "",
    vr: editingAircraft?.performance?.vr?.toString() || "",
    vx: editingAircraft?.performance?.vx?.toString() || "",
    vy: editingAircraft?.performance?.vy?.toString() || "",
    cruiseSpeed: editingAircraft?.performance?.cruiseSpeed?.toString() || "",
    serviceCeiling: editingAircraft?.performance?.serviceCeiling?.toString() || "",
    fuelFlowCruise65: editingAircraft?.performance?.fuelFlow?.cruise65?.toString() || "",
    fuelFlowCruise75: editingAircraft?.performance?.fuelFlow?.cruise75?.toString() || "",
  });

  const handleInputChange = (field: keyof AircraftFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ['name', 'emptyWeight', 'emptyMoment', 'maxWeight', 'cgForward', 'cgAft', 'pilotArm', 'passengerArm', 'baggageArm', 'fuelArm'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof AircraftFormData]);
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }

    // Create comprehensive aircraft data object
    const aircraftData = {
      name: formData.name,
      emptyWeight: parseFloat(formData.emptyWeight),
      emptyMoment: parseFloat(formData.emptyMoment),
      maxWeight: parseFloat(formData.maxWeight),
      cgLimits: {
        forward: parseFloat(formData.cgForward),
        aft: parseFloat(formData.cgAft)
      },
      stations: {
        pilot: { arm: parseFloat(formData.pilotArm) },
        passenger: { arm: parseFloat(formData.passengerArm) },
        baggage: { arm: parseFloat(formData.baggageArm) },
        fuel: { 
          arm: parseFloat(formData.fuelArm),
          maxWeight: formData.fuelMaxWeight ? parseFloat(formData.fuelMaxWeight) : undefined
        }
      },
      maxBaggageWeight: formData.maxBaggageWeight ? parseFloat(formData.maxBaggageWeight) : undefined,
      fuelCapacity: formData.fuelCapacity ? parseFloat(formData.fuelCapacity) : undefined,
      usableFuel: formData.usableFuel ? parseFloat(formData.usableFuel) : undefined,
      performance: {
        takeoffGroundRoll: formData.takeoffGroundRoll ? parseFloat(formData.takeoffGroundRoll) : 0,
        takeoffOver50ft: formData.takeoffOver50ft ? parseFloat(formData.takeoffOver50ft) : 0,
        landingGroundRoll: formData.landingGroundRoll ? parseFloat(formData.landingGroundRoll) : 0,
        landingOver50ft: formData.landingOver50ft ? parseFloat(formData.landingOver50ft) : 0,
        bestGlideSpeed: formData.bestGlideSpeed ? parseFloat(formData.bestGlideSpeed) : 0,
        stallSpeedClean: formData.stallSpeedClean ? parseFloat(formData.stallSpeedClean) : 0,
        stallSpeedLanding: formData.stallSpeedLanding ? parseFloat(formData.stallSpeedLanding) : 0,
        vr: formData.vr ? parseFloat(formData.vr) : 0,
        vx: formData.vx ? parseFloat(formData.vx) : 0,
        vy: formData.vy ? parseFloat(formData.vy) : 0,
        cruiseSpeed: formData.cruiseSpeed ? parseFloat(formData.cruiseSpeed) : 0,
        serviceCeiling: formData.serviceCeiling ? parseFloat(formData.serviceCeiling) : 0,
        fuelFlow: {
          cruise65: formData.fuelFlowCruise65 ? parseFloat(formData.fuelFlowCruise65) : 0,
          cruise75: formData.fuelFlowCruise75 ? parseFloat(formData.fuelFlowCruise75) : 0
        }
      }
    };

    // Generate ID from name
    const id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    onAddAircraft(id, aircraftData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-blue-600" />
              {editingAircraft ? 'Edit Aircraft' : 'Add Custom Aircraft'}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="weight-balance">Weight & Balance</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aircraft-name">Aircraft Name *</Label>
                  <Input
                    id="aircraft-name"
                    placeholder="e.g., N123AB - Cessna 172"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empty-weight">Empty Weight (lbs) *</Label>
                    <Input
                      id="empty-weight"
                      type="number"
                      placeholder="1663"
                      value={formData.emptyWeight}
                      onChange={(e) => handleInputChange("emptyWeight", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-weight">Maximum Weight (lbs) *</Label>
                    <Input
                      id="max-weight"
                      type="number"
                      placeholder="2300"
                      value={formData.maxWeight}
                      onChange={(e) => handleInputChange("maxWeight", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fuel-capacity">Fuel Capacity (gal)</Label>
                    <Input
                      id="fuel-capacity"
                      type="number"
                      placeholder="50"
                      value={formData.fuelCapacity}
                      onChange={(e) => handleInputChange("fuelCapacity", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usable-fuel">Usable Fuel (gal)</Label>
                    <Input
                      id="usable-fuel"
                      type="number"
                      placeholder="48"
                      value={formData.usableFuel}
                      onChange={(e) => handleInputChange("usableFuel", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-baggage">Max Baggage (lbs)</Label>
                    <Input
                      id="max-baggage"
                      type="number"
                      placeholder="120"
                      value={formData.maxBaggageWeight}
                      onChange={(e) => handleInputChange("maxBaggageWeight", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="weight-balance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="empty-moment">Empty Moment *</Label>
                    <Input
                      id="empty-moment"
                      type="number"
                      step="0.1"
                      placeholder="1554.2"
                      value={formData.emptyMoment}
                      onChange={(e) => handleInputChange("emptyMoment", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel-max-weight">Max Fuel Weight (lbs)</Label>
                    <Input
                      id="fuel-max-weight"
                      type="number"
                      placeholder="300"
                      value={formData.fuelMaxWeight}
                      onChange={(e) => handleInputChange("fuelMaxWeight", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cg-forward">CG Forward Limit (in) *</Label>
                    <Input
                      id="cg-forward"
                      type="number"
                      step="0.1"
                      placeholder="35.0"
                      value={formData.cgForward}
                      onChange={(e) => handleInputChange("cgForward", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cg-aft">CG Aft Limit (in) *</Label>
                    <Input
                      id="cg-aft"
                      type="number"
                      step="0.1"
                      placeholder="40.9"
                      value={formData.cgAft}
                      onChange={(e) => handleInputChange("cgAft", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Station Arms (inches) *
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pilot-arm">Pilot Arm</Label>
                      <Input
                        id="pilot-arm"
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        value={formData.pilotArm}
                        onChange={(e) => handleInputChange("pilotArm", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="passenger-arm">Passenger Arm</Label>
                      <Input
                        id="passenger-arm"
                        type="number"
                        step="0.1"
                        placeholder="37.0"
                        value={formData.passengerArm}
                        onChange={(e) => handleInputChange("passengerArm", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baggage-arm">Baggage Arm</Label>
                      <Input
                        id="baggage-arm"
                        type="number"
                        step="0.1"
                        placeholder="95.0"
                        value={formData.baggageArm}
                        onChange={(e) => handleInputChange("baggageArm", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuel-arm">Fuel Arm</Label>
                      <Input
                        id="fuel-arm"
                        type="number"
                        step="0.1"
                        placeholder="48.0"
                        value={formData.fuelArm}
                        onChange={(e) => handleInputChange("fuelArm", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Takeoff Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="takeoff-ground-roll">Ground Roll (ft)</Label>
                      <Input
                        id="takeoff-ground-roll"
                        type="number"
                        placeholder="865"
                        value={formData.takeoffGroundRoll}
                        onChange={(e) => handleInputChange("takeoffGroundRoll", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="takeoff-over-50ft">Over 50ft Obstacle (ft)</Label>
                      <Input
                        id="takeoff-over-50ft"
                        type="number"
                        placeholder="1440"
                        value={formData.takeoffOver50ft}
                        onChange={(e) => handleInputChange("takeoffOver50ft", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Landing Performance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="landing-ground-roll">Ground Roll (ft)</Label>
                      <Input
                        id="landing-ground-roll"
                        type="number"
                        placeholder="550"
                        value={formData.landingGroundRoll}
                        onChange={(e) => handleInputChange("landingGroundRoll", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="landing-over-50ft">Over 50ft Obstacle (ft)</Label>
                      <Input
                        id="landing-over-50ft"
                        type="number"
                        placeholder="1290"
                        value={formData.landingOver50ft}
                        onChange={(e) => handleInputChange("landingOver50ft", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Speeds (KIAS)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vr">VR</Label>
                      <Input
                        id="vr"
                        type="number"
                        placeholder="55"
                        value={formData.vr}
                        onChange={(e) => handleInputChange("vr", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vx">VX</Label>
                      <Input
                        id="vx"
                        type="number"
                        placeholder="62"
                        value={formData.vx}
                        onChange={(e) => handleInputChange("vx", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vy">VY</Label>
                      <Input
                        id="vy"
                        type="number"
                        placeholder="79"
                        value={formData.vy}
                        onChange={(e) => handleInputChange("vy", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="best-glide">Best Glide</Label>
                      <Input
                        id="best-glide"
                        type="number"
                        placeholder="68"
                        value={formData.bestGlideSpeed}
                        onChange={(e) => handleInputChange("bestGlideSpeed", e.target.value)}
                        className="transition-all duration-200 focus:scale-[1.02]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stall-clean">Stall Clean (KIAS)</Label>
                    <Input
                      id="stall-clean"
                      type="number"
                      placeholder="51"
                      value={formData.stallSpeedClean}
                      onChange={(e) => handleInputChange("stallSpeedClean", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stall-landing">Stall Landing (KIAS)</Label>
                    <Input
                      id="stall-landing"
                      type="number"
                      placeholder="47"
                      value={formData.stallSpeedLanding}
                      onChange={(e) => handleInputChange("stallSpeedLanding", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cruise-speed">Cruise Speed (KTAS)</Label>
                    <Input
                      id="cruise-speed"
                      type="number"
                      placeholder="122"
                      value={formData.cruiseSpeed}
                      onChange={(e) => handleInputChange("cruiseSpeed", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-ceiling">Service Ceiling (ft)</Label>
                    <Input
                      id="service-ceiling"
                      type="number"
                      placeholder="14200"
                      value={formData.serviceCeiling}
                      onChange={(e) => handleInputChange("serviceCeiling", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel-flow-65">Fuel Flow 65% (GPH)</Label>
                    <Input
                      id="fuel-flow-65"
                      type="number"
                      step="0.1"
                      placeholder="8.1"
                      value={formData.fuelFlowCruise65}
                      onChange={(e) => handleInputChange("fuelFlowCruise65", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fuel-flow-75">Fuel Flow 75% (GPH)</Label>
                    <Input
                      id="fuel-flow-75"
                      type="number"
                      step="0.1"
                      placeholder="9.6"
                      value={formData.fuelFlowCruise75}
                      onChange={(e) => handleInputChange("fuelFlowCruise75", e.target.value)}
                      className="transition-all duration-200 focus:scale-[1.02]"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingAircraft ? 'Update Aircraft' : 'Add Aircraft'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="transition-all duration-200 hover:scale-105">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
