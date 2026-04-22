
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";

interface FlightLogFormProps {
  onClose: () => void;
}

export const FlightLogForm = ({ onClose }: FlightLogFormProps) => {
  const { addFlightLog } = useSupabaseFlightData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    aircraft: '',
    departure: '',
    destination: '',
    route: '',
    flightTime: '',
    landings: '',
    approaches: '',
    holds: '',
    crossCountry: '',
    night: '',
    instrument: '',
    solo: false,
    dual: false,
    pic: false,
    instructor: '',
    remarks: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.aircraft || !formData.departure || !formData.destination || !formData.flightTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addFlightLog({
      date: formData.date,
      aircraft: formData.aircraft,
      departure: formData.departure.toUpperCase(),
      destination: formData.destination.toUpperCase(),
      route: formData.route,
      flight_time: parseFloat(formData.flightTime) || 0,
      landings: parseInt(formData.landings) || 0,
      approaches: parseInt(formData.approaches) || 0,
      holds: parseInt(formData.holds) || 0,
      cross_country: parseFloat(formData.crossCountry) || 0,
      night: parseFloat(formData.night) || 0,
      instrument: parseFloat(formData.instrument) || 0,
      solo: formData.solo,
      dual: formData.dual,
      pic: formData.pic,
      instructor: formData.instructor,
      remarks: formData.remarks,
      waypoints: [],
    });

    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Flight Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Input
                id="aircraft"
                value={formData.aircraft}
                onChange={(e) => setFormData(prev => ({ ...prev, aircraft: e.target.value }))}
                placeholder="N12345"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure *</Label>
              <Input
                id="departure"
                value={formData.departure}
                onChange={(e) => setFormData(prev => ({ ...prev, departure: e.target.value }))}
                placeholder="KPAO"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                value={formData.destination}
                onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                placeholder="KSQL"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route">Route</Label>
            <Input
              id="route"
              value={formData.route}
              onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
              placeholder="KPAO-KSQL via SF Bay Tour"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flightTime">Flight Time (hrs) *</Label>
              <Input
                id="flightTime"
                type="number"
                step="0.1"
                value={formData.flightTime}
                onChange={(e) => setFormData(prev => ({ ...prev, flightTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landings">Landings</Label>
              <Input
                id="landings"
                type="number"
                value={formData.landings}
                onChange={(e) => setFormData(prev => ({ ...prev, landings: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approaches">Approaches</Label>
              <Input
                id="approaches"
                type="number"
                value={formData.approaches}
                onChange={(e) => setFormData(prev => ({ ...prev, approaches: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holds">Holds</Label>
              <Input
                id="holds"
                type="number"
                value={formData.holds}
                onChange={(e) => setFormData(prev => ({ ...prev, holds: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="crossCountry">Cross Country (hrs)</Label>
              <Input
                id="crossCountry"
                type="number"
                step="0.1"
                value={formData.crossCountry}
                onChange={(e) => setFormData(prev => ({ ...prev, crossCountry: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="night">Night (hrs)</Label>
              <Input
                id="night"
                type="number"
                step="0.1"
                value={formData.night}
                onChange={(e) => setFormData(prev => ({ ...prev, night: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instrument">Instrument (hrs)</Label>
              <Input
                id="instrument"
                type="number"
                step="0.1"
                value={formData.instrument}
                onChange={(e) => setFormData(prev => ({ ...prev, instrument: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="solo"
                checked={formData.solo}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  solo: !!checked,
                  dual: checked ? false : prev.dual 
                }))}
              />
              <Label htmlFor="solo">Solo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dual"
                checked={formData.dual}
                onCheckedChange={(checked) => setFormData(prev => ({ 
                  ...prev, 
                  dual: !!checked,
                  solo: checked ? false : prev.solo 
                }))}
              />
              <Label htmlFor="dual">Dual</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pic"
                checked={formData.pic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pic: !!checked }))}
              />
              <Label htmlFor="pic">PIC</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructor">Instructor</Label>
            <Input
              id="instructor"
              value={formData.instructor}
              onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
              placeholder="John Smith, CFI"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Training notes, weather conditions, etc."
              className="h-20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Add Flight
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
