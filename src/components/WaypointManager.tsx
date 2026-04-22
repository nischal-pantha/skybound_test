import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Search, 
  MapPin, 
  Navigation, 
  Trash2, 
  Edit3, 
  GripVertical, 
  Target,
  Plane,
  Radio,
  Map,
  AlertCircle,
  CheckCircle,
  Clock,
  Compass,
  Fuel,
  Wind
} from 'lucide-react';

interface Waypoint {
  id: string;
  identifier: string;
  name?: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps" | "custom";
  altitude?: number;
  notes?: string;
  distance?: number;
  heading?: number;
  groundSpeed?: number;
  timeEnroute?: number;
  fuelUsed?: number;
  isEditing?: boolean;
}

interface WaypointManagerProps {
  waypoints: Waypoint[];
  onWaypointAdd: (waypoint: Partial<Waypoint>) => void;
  onWaypointUpdate: (id: string, updates: Partial<Waypoint>) => void;
  onWaypointRemove: (id: string) => void;
  onWaypointsReorder: (startIndex: number, endIndex: number) => void;
  navDatabase: any[];
}

export default function WaypointManager({
  waypoints,
  onWaypointAdd,
  onWaypointUpdate,
  onWaypointRemove,
  onWaypointsReorder,
  navDatabase
}: WaypointManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [editingWaypoint, setEditingWaypoint] = useState<string | null>(null);
  const [customWaypoint, setCustomWaypoint] = useState({
    identifier: '',
    name: '',
    lat: '',
    lng: '',
    altitude: '',
    notes: ''
  });

  const filteredNavPoints = navDatabase.filter(point => {
    const matchesSearch = point.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (point.name && point.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || point.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'airport': return <Plane className="h-4 w-4" />;
      case 'vor': return <Radio className="h-4 w-4" />;
      case 'fix': return <Target className="h-4 w-4" />;
      case 'gps': return <Navigation className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'airport': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'vor': return 'bg-green-100 text-green-800 border-green-200';
      case 'fix': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gps': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleCustomWaypointAdd = useCallback(() => {
    if (!customWaypoint.identifier || !customWaypoint.lat || !customWaypoint.lng) {
      return;
    }

    const lat = parseFloat(customWaypoint.lat);
    const lng = parseFloat(customWaypoint.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return;
    }

    onWaypointAdd({
      identifier: customWaypoint.identifier.toUpperCase(),
      name: customWaypoint.name,
      lat: lat,
      lng: lng,
      type: 'custom',
      altitude: customWaypoint.altitude ? parseInt(customWaypoint.altitude) : undefined,
      notes: customWaypoint.notes
    });

    setCustomWaypoint({
      identifier: '',
      name: '',
      lat: '',
      lng: '',
      altitude: '',
      notes: ''
    });
    setShowCustomDialog(false);
  }, [customWaypoint, onWaypointAdd]);

  const handleNavPointAdd = useCallback((navPoint: any) => {
    onWaypointAdd({
      identifier: navPoint.identifier,
      name: navPoint.name,
      lat: navPoint.lat,
      lng: navPoint.lng,
      type: navPoint.type
    });
  }, [onWaypointAdd]);

  const formatCoordinate = (coord: number, isLat: boolean) => {
    const abs = Math.abs(coord);
    const degrees = Math.floor(abs);
    const minutes = (abs - degrees) * 60;
    const direction = isLat ? (coord >= 0 ? 'N' : 'S') : (coord >= 0 ? 'E' : 'W');
    return `${degrees}°${minutes.toFixed(2)}'${direction}`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Navigation Database Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Navigation Database
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search airports, VORs, fixes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="airport">Airports</SelectItem>
                <SelectItem value="vor">VOR/DME</SelectItem>
                <SelectItem value="fix">Fixes</SelectItem>
                <SelectItem value="gps">GPS Points</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Custom
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom Waypoint</DialogTitle>
                  <DialogDescription>
                    Create a custom waypoint with specific coordinates for your flight plan.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-identifier">Identifier</Label>
                      <Input
                        id="custom-identifier"
                        value={customWaypoint.identifier}
                        onChange={(e) => setCustomWaypoint(prev => ({ ...prev, identifier: e.target.value }))}
                        placeholder="WAYPOINT"
                        maxLength={8}
                        className="uppercase"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-name">Name (Optional)</Label>
                      <Input
                        id="custom-name"
                        value={customWaypoint.name}
                        onChange={(e) => setCustomWaypoint(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Waypoint Name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-lat">Latitude</Label>
                      <Input
                        id="custom-lat"
                        type="number"
                        step="0.000001"
                        value={customWaypoint.lat}
                        onChange={(e) => setCustomWaypoint(prev => ({ ...prev, lat: e.target.value }))}
                        placeholder="37.4611"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="custom-lng">Longitude</Label>
                      <Input
                        id="custom-lng"
                        type="number"
                        step="0.000001"
                        value={customWaypoint.lng}
                        onChange={(e) => setCustomWaypoint(prev => ({ ...prev, lng: e.target.value }))}
                        placeholder="-122.1150"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-altitude">Altitude (Optional)</Label>
                    <Input
                      id="custom-altitude"
                      type="number"
                      value={customWaypoint.altitude}
                      onChange={(e) => setCustomWaypoint(prev => ({ ...prev, altitude: e.target.value }))}
                      placeholder="3500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-notes">Notes (Optional)</Label>
                    <Input
                      id="custom-notes"
                      value={customWaypoint.notes}
                      onChange={(e) => setCustomWaypoint(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCustomWaypointAdd}>
                      Add Waypoint
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="max-h-64 overflow-y-auto border rounded-lg">
            {filteredNavPoints.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No navigation points found
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredNavPoints.slice(0, 20).map((point) => (
                  <div
                    key={point.identifier}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded cursor-pointer"
                    onClick={() => handleNavPointAdd(point)}
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(point.type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{point.identifier}</span>
                          <Badge variant="outline" className={getTypeBadgeColor(point.type)}>
                            {point.type.toUpperCase()}
                          </Badge>
                        </div>
                        {point.name && (
                          <p className="text-sm text-muted-foreground">{point.name}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Route */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Flight Route ({waypoints.length} waypoints)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {waypoints.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No waypoints added to the flight plan. Search and add waypoints from the navigation database above.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <div
                  key={waypoint.id}
                  className="border rounded-lg p-4 bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(waypoint.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{waypoint.identifier}</span>
                            <Badge variant="outline" className={getTypeBadgeColor(waypoint.type)}>
                              {waypoint.type.toUpperCase()}
                            </Badge>
                          </div>
                          {waypoint.name && (
                            <p className="text-sm text-muted-foreground">{waypoint.name}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                            <span>{formatCoordinate(waypoint.lat, true)}</span>
                            <span>{formatCoordinate(waypoint.lng, false)}</span>
                            {waypoint.altitude && <span>ALT: {waypoint.altitude}ft</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Navigation Data */}
                    {index > 0 && waypoint.distance && (
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Map className="h-4 w-4 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">{waypoint.distance?.toFixed(1)} nm</p>
                            <p className="text-xs text-muted-foreground">Distance</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">{waypoint.heading?.toFixed(0)}°</p>
                            <p className="text-xs text-muted-foreground">Heading</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">{waypoint.timeEnroute ? formatTime(waypoint.timeEnroute) : '--'}</p>
                            <p className="text-xs text-muted-foreground">Time</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <div className="text-center">
                            <p className="font-medium">{waypoint.fuelUsed?.toFixed(1) || '--'} gal</p>
                            <p className="text-xs text-muted-foreground">Fuel</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingWaypoint(editingWaypoint === waypoint.id ? null : waypoint.id)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onWaypointRemove(waypoint.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Editing Fields */}
                  {editingWaypoint === waypoint.id && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Altitude (ft)</Label>
                           <Input
                             type="number"
                             value={waypoint.altitude?.toString() || ''}
                             onChange={(e) => onWaypointUpdate(waypoint.id, { 
                               altitude: e.target.value ? parseInt(e.target.value) : undefined 
                             })}
                             placeholder="3500"
                           />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Notes</Label>
                           <Input
                             value={waypoint.notes || ''}
                             onChange={(e) => onWaypointUpdate(waypoint.id, { notes: e.target.value })}
                             placeholder="Additional notes"
                           />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}