
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plane, Plus, Edit, Trash2, Save } from "lucide-react";
import { useSupabaseAircraft } from "@/hooks/useSupabaseAircraft";
import { useToast } from "@/hooks/use-toast";

interface AircraftProfile {
  id?: string;
  name: string;
  tailNumber: string;
  make: string;
  model: string;
  year?: string;
  emptyWeight: number;
  emptyMoment: number;
  maxWeight: number;
  cgLimits: {
    forward: number;
    aft: number;
  };
  stations: {
    pilot: { arm: number; maxWeight?: number };
    frontPassenger: { arm: number; maxWeight?: number };
    rearPassenger?: { arm: number; maxWeight?: number };
    baggage: { arm: number; maxWeight?: number };
    fuel: { arm: number; maxWeight: number };
  };
  fuelCapacity: number;
  usableFuel: number;
  performance?: {
    takeoffGroundRoll: number;
    takeoffOver50ft: number;
    landingGroundRoll: number;
    landingOver50ft: number;
    bestGlideSpeed: number;
    stallSpeedClean: number;
    stallSpeedLanding: number;
    vr: number;
    vx: number;
    vy: number;
    cruiseSpeed: number;
    serviceCeiling: number;
    fuelFlow: {
      cruise65: number;
      cruise75: number;
    };
  };
}

const defaultProfile: Partial<AircraftProfile> = {
  tailNumber: "",
  make: "",
  model: "",
  year: "",
  emptyWeight: 0,
  emptyMoment: 0,
  maxWeight: 0,
  cgLimits: { forward: 0, aft: 0 },
  stations: {
    pilot: { arm: 0, maxWeight: 300 },
    frontPassenger: { arm: 0, maxWeight: 300 },
    rearPassenger: { arm: 0, maxWeight: 300 },
    baggage: { arm: 0, maxWeight: 120 },
    fuel: { arm: 0, maxWeight: 0 }
  },
  fuelCapacity: 0,
  usableFuel: 0,
  performance: {
    takeoffGroundRoll: 0,
    takeoffOver50ft: 0,
    landingGroundRoll: 0,
    landingOver50ft: 0,
    bestGlideSpeed: 0,
    stallSpeedClean: 0,
    stallSpeedLanding: 0,
    vr: 0,
    vx: 0,
    vy: 0,
    cruiseSpeed: 0,
    serviceCeiling: 0,
    fuelFlow: {
      cruise65: 0,
      cruise75: 0
    }
  }
};

export const AircraftProfileManager = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AircraftProfile | null>(null);
  const [formData, setFormData] = useState<Partial<AircraftProfile>>(defaultProfile);
  const { aircraft: customAircraft, addAircraft, updateAircraft, deleteAircraft } = useSupabaseAircraft();
  const { toast } = useToast();

  const handleSave = () => {
    if (!formData.tailNumber || !formData.make || !formData.model) {
      toast({
        title: "Missing Information",
        description: "Please fill in tail number, make, and model.",
        variant: "destructive"
      });
      return;
    }

    const supabaseProfile = {
      name: `${formData.tailNumber} - ${formData.make} ${formData.model}`,
      registration: formData.tailNumber,
      empty_weight: formData.emptyWeight || null,
      max_weight: formData.maxWeight || null,
      forward_cg_limit: formData.cgLimits?.forward || null,
      aft_cg_limit: formData.cgLimits?.aft || null,
      fuel_arm: formData.stations?.fuel?.arm || null,
      front_seat_arm: formData.stations?.frontPassenger?.arm || null,
      rear_seat_arm: formData.stations?.rearPassenger?.arm || null,
      baggage_arm: formData.stations?.baggage?.arm || null,
      max_fuel: formData.fuelCapacity || null,
      fuel_burn_rate: formData.performance?.fuelFlow?.cruise75 || null,
      cruise_speed: formData.performance?.cruiseSpeed || null,
      max_range: null,
      service_ceiling: formData.performance?.serviceCeiling || null,
      performance_data: formData.performance || null
    };

    if (editingProfile) {
      updateAircraft(editingProfile.id!, supabaseProfile);
    } else {
      addAircraft(supabaseProfile);
    }

    setIsDialogOpen(false);
    setEditingProfile(null);
    setFormData(defaultProfile);
  };

  const handleEdit = (id: string) => {
    const ac = customAircraft.find(a => a.id === id);
    if (ac) {
      const profile: AircraftProfile = {
        id: ac.id,
        name: ac.name,
        tailNumber: ac.registration || '',
        make: ac.name?.split(' - ')?.[1]?.split(' ')?.[0] || '',
        model: '',
        emptyWeight: ac.empty_weight || 0,
        emptyMoment: 0,
        maxWeight: ac.max_weight || 0,
        cgLimits: { forward: ac.forward_cg_limit || 0, aft: ac.aft_cg_limit || 0 },
        stations: {
          pilot: { arm: ac.front_seat_arm || 0, maxWeight: 300 },
          frontPassenger: { arm: ac.front_seat_arm || 0, maxWeight: 300 },
          rearPassenger: { arm: ac.rear_seat_arm || 0, maxWeight: 300 },
          baggage: { arm: ac.baggage_arm || 0, maxWeight: 120 },
          fuel: { arm: ac.fuel_arm || 0, maxWeight: (ac.max_fuel || 0) * 6 }
        },
        fuelCapacity: ac.max_fuel || 0,
        usableFuel: (ac.max_fuel || 0) * 0.95,
        performance: (ac.performance_data as any) || defaultProfile.performance
      };
      setEditingProfile(profile);
      setFormData(profile);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = (id: string) => {
    deleteAircraft(id);
  };

  const resetForm = () => {
    setFormData(defaultProfile);
    setEditingProfile(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Aircraft Profiles
          </h3>
          <p className="text-gray-600">Manage your aircraft for Weight & Balance, Performance, and Logbook</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={resetForm} 
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Add Aircraft
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingProfile ? "Edit Aircraft Profile" : "Add New Aircraft Profile"}
              </DialogTitle>
              <DialogDescription>
                Enter complete aircraft specifications for Weight & Balance, Performance calculations, and Logbook tracking
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Basic Information */}
              <Card className="border-2 border-blue-200 hover:border-blue-300 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-lg text-blue-700">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label className="text-blue-600 font-medium">Tail Number *</Label>
                    <Input
                      value={formData.tailNumber || ""}
                      onChange={(e) => setFormData({...formData, tailNumber: e.target.value})}
                      placeholder="N12345"
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-blue-600 font-medium">Make *</Label>
                      <Input
                        value={formData.make || ""}
                        onChange={(e) => setFormData({...formData, make: e.target.value})}
                        placeholder="Cessna"
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-blue-600 font-medium">Model *</Label>
                      <Input
                        value={formData.model || ""}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        placeholder="172N"
                        className="border-blue-200 focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-blue-600 font-medium">Year</Label>
                    <Input
                      value={formData.year || ""}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      placeholder="1979"
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Weight & Balance */}
              <Card className="border-2 border-green-200 hover:border-green-300 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardTitle className="text-lg text-green-700">Weight & Balance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">Empty Weight (lbs)</Label>
                      <Input
                        type="number"
                        value={formData.emptyWeight || ""}
                        onChange={(e) => setFormData({...formData, emptyWeight: Number(e.target.value)})}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">Empty Moment (lb-in)</Label>
                      <Input
                        type="number"
                        value={formData.emptyMoment || ""}
                        onChange={(e) => setFormData({...formData, emptyMoment: Number(e.target.value)})}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-green-600 font-medium">Max Gross Weight (lbs)</Label>
                    <Input
                      type="number"
                      value={formData.maxWeight || ""}
                      onChange={(e) => setFormData({...formData, maxWeight: Number(e.target.value)})}
                      className="border-green-200 focus:border-green-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">CG Forward Limit (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.cgLimits?.forward || ""}
                        onChange={(e) => setFormData({
                          ...formData, 
                          cgLimits: {...formData.cgLimits, forward: Number(e.target.value)}
                        })}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-green-600 font-medium">CG Aft Limit (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.cgLimits?.aft || ""}
                        onChange={(e) => setFormData({
                          ...formData, 
                          cgLimits: {...formData.cgLimits, aft: Number(e.target.value)}
                        })}
                        className="border-green-200 focus:border-green-400"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Station Arms */}
              <Card className="border-2 border-purple-200 hover:border-purple-300 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <CardTitle className="text-lg text-purple-700">Station Arms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Pilot Arm (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.stations?.pilot?.arm || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          stations: {
                            ...formData.stations!,
                            pilot: {...formData.stations?.pilot, arm: Number(e.target.value)}
                          }
                        })}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Front Passenger Arm (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.stations?.frontPassenger?.arm || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          stations: {
                            ...formData.stations!,
                            frontPassenger: {...formData.stations?.frontPassenger, arm: Number(e.target.value)}
                          }
                        })}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Rear Passenger Arm (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.stations?.rearPassenger?.arm || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          stations: {
                            ...formData.stations!,
                            rearPassenger: {...formData.stations?.rearPassenger, arm: Number(e.target.value)}
                          }
                        })}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-purple-600 font-medium">Baggage Arm (in)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.stations?.baggage?.arm || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          stations: {
                            ...formData.stations!,
                            baggage: {...formData.stations?.baggage, arm: Number(e.target.value)}
                          }
                        })}
                        className="border-purple-200 focus:border-purple-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-purple-600 font-medium">Fuel Arm (in)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.stations?.fuel?.arm || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        stations: {
                          ...formData.stations!,
                          fuel: {...formData.stations?.fuel, arm: Number(e.target.value)}
                        }
                      })}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Fuel Information */}
              <Card className="border-2 border-orange-200 hover:border-orange-300 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
                  <CardTitle className="text-lg text-orange-700">Fuel Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="space-y-2">
                    <Label className="text-orange-600 font-medium">Fuel Capacity (gal)</Label>
                    <Input
                      type="number"
                      value={formData.fuelCapacity || ""}
                      onChange={(e) => setFormData({...formData, fuelCapacity: Number(e.target.value)})}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-orange-600 font-medium">Usable Fuel (gal)</Label>
                    <Input
                      type="number"
                      value={formData.usableFuel || ""}
                      onChange={(e) => setFormData({...formData, usableFuel: Number(e.target.value)})}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-orange-600 font-medium">Max Fuel Weight (lbs)</Label>
                    <Input
                      type="number"
                      value={formData.stations?.fuel?.maxWeight || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        stations: {
                          ...formData.stations!,
                          fuel: {...formData.stations?.fuel, maxWeight: Number(e.target.value)}
                        }
                      })}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Performance Data */}
              <Card className="border-2 border-red-200 hover:border-red-300 transition-all duration-300 lg:col-span-2">
                <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
                  <CardTitle className="text-lg text-red-700">Performance Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Takeoff Ground Roll (ft)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.takeoffGroundRoll || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            takeoffGroundRoll: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Takeoff Over 50ft (ft)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.takeoffOver50ft || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            takeoffOver50ft: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Landing Ground Roll (ft)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.landingGroundRoll || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            landingGroundRoll: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Landing Over 50ft (ft)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.landingOver50ft || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            landingOver50ft: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Vr (kts)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.vr || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            vr: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Vx (kts)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.vx || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            vx: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Vy (kts)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.vy || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            vy: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-red-600 font-medium">Cruise Speed (kts)</Label>
                      <Input
                        type="number"
                        value={formData.performance?.cruiseSpeed || ""}
                        onChange={(e) => setFormData({
                          ...formData,
                          performance: {
                            ...formData.performance!,
                            cruiseSpeed: Number(e.target.value)
                          }
                        })}
                        className="border-red-200 focus:border-red-400"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Aircraft
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {customAircraft.map((ac) => (
          <Card
            key={ac.id}
            className="border-2 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                    <Plane className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-blue-700">{ac.registration || ac.name}</span>
                </span>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(ac.id)}
                    className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(ac.id)}
                    className="hover:bg-red-600 transition-all duration-200 transform hover:scale-105">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription className="font-medium text-blue-600">{ac.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-xs text-blue-600">Empty Weight</div>
                    <div className="font-bold text-blue-800">{ac.empty_weight} lbs</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-green-600">Max Weight</div>
                    <div className="font-bold text-green-800">{ac.max_weight} lbs</div>
                  </div>
                </div>
                <div className="bg-purple-50 p-2 rounded">
                  <div className="text-xs text-purple-600">CG Limits</div>
                  <div className="font-bold text-purple-800">{ac.forward_cg_limit}" - {ac.aft_cg_limit}"</div>
                </div>
                <div className="bg-orange-50 p-2 rounded">
                  <div className="text-xs text-orange-600">Fuel Capacity</div>
                  <div className="font-bold text-orange-800">{ac.max_fuel || 0} gal</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {customAircraft.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-blue-400 transition-all duration-300">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
              <Plane className="h-16 w-16 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No Aircraft Profiles</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Add your aircraft profiles to use in Weight &amp; Balance calculations, Performance planning, and Logbook tracking
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Aircraft
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
