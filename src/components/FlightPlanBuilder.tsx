import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plane, MapPin, Clock, Fuel, Users, Settings, Wind, Eye, CheckCircle } from 'lucide-react';

interface FlightPlanBuilderProps {
  currentPlan: any;
  onPlanUpdate: (updates: any) => void;
  availableAircraft: any[];
  routeOptions: any;
  onRouteOptionsUpdate: (options: any) => void;
}

export default function FlightPlanBuilder({
  currentPlan,
  onPlanUpdate,
  availableAircraft,
  routeOptions,
  onRouteOptionsUpdate
}: FlightPlanBuilderProps) {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    onPlanUpdate({ [field]: value });
  }, [onPlanUpdate]);

  const flightRulesOptions = [
    { value: 'VFR', label: 'VFR - Visual Flight Rules', icon: Eye },
    { value: 'IFR', label: 'IFR - Instrument Flight Rules', icon: Settings },
    { value: 'SVFR', label: 'SVFR - Special VFR', icon: Wind }
  ];

  const routeTypeOptions = [
    { value: 'direct', label: 'Direct Route', description: 'Straight line between points' },
    { value: 'airways', label: 'Airways Route', description: 'Follow published airways' },
    { value: 'custom', label: 'Custom Route', description: 'User-defined waypoints' }
  ];

  return (
    <div className="space-y-6">
      {/* Basic Flight Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Flight Plan Name</Label>
              <Input
                id="plan-name"
                value={currentPlan.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter flight plan name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft</Label>
              <Select
                value={currentPlan.aircraft}
                onValueChange={(value) => handleInputChange('aircraft', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {availableAircraft.map((aircraft) => (
                    <SelectItem key={aircraft.id} value={aircraft.id}>
                      {aircraft.name} {aircraft.tailNumber && `(${aircraft.tailNumber})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departure">Departure Airport</Label>
              <Input
                id="departure"
                value={currentPlan.departure}
                onChange={(e) => handleInputChange('departure', e.target.value.toUpperCase())}
                placeholder="KPAO"
                maxLength={4}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Airport</Label>
              <Input
                id="destination"
                value={currentPlan.destination}
                onChange={(e) => handleInputChange('destination', e.target.value.toUpperCase())}
                placeholder="KSQL"
                maxLength={4}
                className="uppercase"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alternate">Alternate Airport</Label>
              <Input
                id="alternate"
                value={currentPlan.alternate}
                onChange={(e) => handleInputChange('alternate', e.target.value.toUpperCase())}
                placeholder="KHWD"
                maxLength={4}
                className="uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flight-rules">Flight Rules</Label>
            <Select
              value={currentPlan.flightRules}
              onValueChange={(value) => handleInputChange('flightRules', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {flightRulesOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Flight Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Flight Parameters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="altitude">Altitude (ft)</Label>
              <Input
                id="altitude"
                type="number"
                value={currentPlan.altitude}
                onChange={(e) => handleInputChange('altitude', e.target.value)}
                placeholder="3500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="airspeed">Airspeed (kts)</Label>
              <Input
                id="airspeed"
                type="number"
                value={currentPlan.airspeed}
                onChange={(e) => handleInputChange('airspeed', e.target.value)}
                placeholder="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel">Fuel (gal)</Label>
              <Input
                id="fuel"
                type="number"
                value={currentPlan.fuel}
                onChange={(e) => handleInputChange('fuel', e.target.value)}
                placeholder="40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Passengers</Label>
              <Input
                id="passengers"
                type="number"
                value={currentPlan.passengers}
                onChange={(e) => handleInputChange('passengers', e.target.value)}
                placeholder="1"
                min="0"
                max="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Planning Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Route Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {routeTypeOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-colors ${
                    routeOptions.routeType === option.value
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onRouteOptionsUpdate({ ...routeOptions, routeType: option.value })}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {routeOptions.routeType === option.value && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                      <span className="font-medium">{option.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Avoid Weather</Label>
                <p className="text-sm text-muted-foreground">Route around weather hazards</p>
              </div>
              <Switch
                checked={routeOptions.avoidWeather}
                onCheckedChange={(checked) =>
                  onRouteOptionsUpdate({ ...routeOptions, avoidWeather: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Avoid Restricted Areas</Label>
                <p className="text-sm text-muted-foreground">Avoid MOAs and restricted zones</p>
              </div>
              <Switch
                checked={routeOptions.avoidRestricted}
                onCheckedChange={(checked) =>
                  onRouteOptionsUpdate({ ...routeOptions, avoidRestricted: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Minimize Fuel</Label>
                <p className="text-sm text-muted-foreground">Optimize for fuel efficiency</p>
              </div>
              <Switch
                checked={routeOptions.minimizeFuel}
                onCheckedChange={(checked) =>
                  onRouteOptionsUpdate({ ...routeOptions, minimizeFuel: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Minimize Time</Label>
                <p className="text-sm text-muted-foreground">Optimize for shortest time</p>
              </div>
              <Switch
                checked={routeOptions.minimizeTime}
                onCheckedChange={(checked) =>
                  onRouteOptionsUpdate({ ...routeOptions, minimizeTime: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Settings
            </div>
            <Badge variant="outline">{showAdvancedSettings ? 'Hide' : 'Show'}</Badge>
          </CardTitle>
        </CardHeader>
        {showAdvancedSettings && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preferred-altitude">Preferred Altitude</Label>
                <Select
                  value={routeOptions.preferredAltitude}
                  onValueChange={(value) =>
                    onRouteOptionsUpdate({ ...routeOptions, preferredAltitude: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2500">2,500 ft</SelectItem>
                    <SelectItem value="3500">3,500 ft</SelectItem>
                    <SelectItem value="4500">4,500 ft</SelectItem>
                    <SelectItem value="5500">5,500 ft</SelectItem>
                    <SelectItem value="6500">6,500 ft</SelectItem>
                    <SelectItem value="7500">7,500 ft</SelectItem>
                    <SelectItem value="8500">8,500 ft</SelectItem>
                    <SelectItem value="9500">9,500 ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks & Notes</Label>
              <Textarea
                id="remarks"
                value={currentPlan.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                placeholder="Additional flight plan remarks, special procedures, equipment notes, etc."
                rows={3}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}