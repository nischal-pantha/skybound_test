
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';

interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps";
  altitude?: number;
  notes?: string;
}

interface WaypointFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (waypoint: Waypoint) => void;
  initialCoordinates: { lat: number; lng: number };
}

export const WaypointForm: React.FC<WaypointFormProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCoordinates
}) => {
  const [formData, setFormData] = useState({
    identifier: '',
    lat: initialCoordinates.lat.toFixed(6),
    lng: initialCoordinates.lng.toFixed(6),
    type: 'gps' as const,
    altitude: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        identifier: '',
        lat: initialCoordinates.lat.toFixed(6),
        lng: initialCoordinates.lng.toFixed(6),
        type: 'gps',
        altitude: '',
        notes: ''
      });
    }
  }, [isOpen, initialCoordinates]);

  const handleSave = () => {
    if (!formData.identifier.trim()) return;

    const waypoint: Waypoint = {
      identifier: formData.identifier.trim().toUpperCase(),
      lat: parseFloat(formData.lat),
      lng: parseFloat(formData.lng),
      type: formData.type,
      altitude: formData.altitude ? parseInt(formData.altitude) : undefined,
      notes: formData.notes.trim() || undefined
    };

    onSave(waypoint);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Custom Waypoint
          </DialogTitle>
          <DialogDescription>
            Enter waypoint details including coordinates, altitude, and optional notes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="identifier">Identifier*</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="WAYPOINT"
                className="uppercase"
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airport">Airport</SelectItem>
                  <SelectItem value="vor">VOR</SelectItem>
                  <SelectItem value="fix">Fix</SelectItem>
                  <SelectItem value="gps">GPS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="latitude">Latitude*</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.lat}
                onChange={(e) => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                placeholder="37.4611"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude*</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.lng}
                onChange={(e) => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                placeholder="-122.1150"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="altitude">Altitude (ft)</Label>
            <Input
              id="altitude"
              type="number"
              value={formData.altitude}
              onChange={(e) => setFormData(prev => ({ ...prev, altitude: e.target.value }))}
              placeholder="3500"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional waypoint notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={!formData.identifier.trim()}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Waypoint
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
