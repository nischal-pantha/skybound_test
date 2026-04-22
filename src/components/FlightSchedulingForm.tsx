
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";

interface FlightSchedulingFormProps {
  onClose: () => void;
}

export const FlightSchedulingForm = ({ onClose }: FlightSchedulingFormProps) => {
  const { addFlightSchedule } = useSupabaseFlightData();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    aircraft: '',
    instructor: '',
    type: '',
    duration: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.time || !formData.aircraft || !formData.type || !formData.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addFlightSchedule({
      date: formData.date,
      time: formData.time,
      aircraft: formData.aircraft,
      instructor: formData.instructor,
      type: formData.type,
      duration: parseFloat(formData.duration),
      notes: formData.notes,
      status: 'scheduled'
    });

    onClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Flight</CardTitle>
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
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                placeholder="John Smith, CFI"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Flight Type *</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select flight type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dual">Dual Instruction</SelectItem>
                  <SelectItem value="solo">Solo Flight</SelectItem>
                  <SelectItem value="cross-country">Cross Country</SelectItem>
                  <SelectItem value="pattern">Pattern Work</SelectItem>
                  <SelectItem value="checkride">Checkride</SelectItem>
                  <SelectItem value="bfr">BFR/IPC</SelectItem>
                  <SelectItem value="maintenance">Maintenance Flight</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours) *</Label>
              <Input
                id="duration"
                type="number"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="1.5"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Special requirements, weather minimums, specific training goals..."
              className="h-20"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Flight
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
