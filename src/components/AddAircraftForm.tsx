
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";

interface AircraftData {
  name: string;
  emptyWeight: number;
  emptyMoment: number;
  maxWeight: number;
  cgLimits: { forward: number; aft: number };
  stations: {
    pilot: { arm: number };
    passenger: { arm: number };
    baggage: { arm: number };
    fuel: { arm: number };
  };
}

interface AddAircraftFormProps {
  onAddAircraft: (id: string, aircraft: AircraftData) => void;
  onClose: () => void;
}

export const AddAircraftForm = ({ onAddAircraft, onClose }: AddAircraftFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    emptyWeight: "",
    emptyMoment: "",
    maxWeight: "",
    cgForward: "",
    cgAft: "",
    pilotArm: "",
    passengerArm: "",
    baggageArm: "",
    fuelArm: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields are filled
    const requiredFields = Object.values(formData);
    if (requiredFields.some(field => field === "")) {
      alert("Please fill in all fields");
      return;
    }

    // Create aircraft data object
    const aircraftData: AircraftData = {
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
        fuel: { arm: parseFloat(formData.fuelArm) }
      }
    };

    // Generate ID from name
    const id = formData.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    onAddAircraft(id, aircraftData);
    onClose();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Aircraft
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aircraft-name">Aircraft Name</Label>
            <Input
              id="aircraft-name"
              placeholder="e.g., N123AB - Cessna 172"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empty-weight">Empty Weight (lbs)</Label>
              <Input
                id="empty-weight"
                type="number"
                placeholder="1663"
                value={formData.emptyWeight}
                onChange={(e) => handleInputChange("emptyWeight", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="empty-moment">Empty Moment</Label>
              <Input
                id="empty-moment"
                type="number"
                step="0.1"
                placeholder="1554.2"
                value={formData.emptyMoment}
                onChange={(e) => handleInputChange("emptyMoment", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-weight">Maximum Weight (lbs)</Label>
            <Input
              id="max-weight"
              type="number"
              placeholder="2300"
              value={formData.maxWeight}
              onChange={(e) => handleInputChange("maxWeight", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cg-forward">CG Forward Limit (in)</Label>
              <Input
                id="cg-forward"
                type="number"
                step="0.1"
                placeholder="35.0"
                value={formData.cgForward}
                onChange={(e) => handleInputChange("cgForward", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cg-aft">CG Aft Limit (in)</Label>
              <Input
                id="cg-aft"
                type="number"
                step="0.1"
                placeholder="40.9"
                value={formData.cgAft}
                onChange={(e) => handleInputChange("cgAft", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Station Arms (inches)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pilot-arm">Pilot Arm</Label>
                <Input
                  id="pilot-arm"
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={formData.pilotArm}
                  onChange={(e) => handleInputChange("pilotArm", e.target.value)}
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
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baggage-arm">Baggage Arm</Label>
                <Input
                  id="baggage-arm"
                  type="number"
                  step="0.1"
                  placeholder="95.0"
                  value={formData.baggageArm}
                  onChange={(e) => handleInputChange("baggageArm", e.target.value)}
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
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Add Aircraft
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
