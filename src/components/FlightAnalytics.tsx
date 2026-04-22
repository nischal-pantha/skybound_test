import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  Fuel, 
  Clock, 
  MapPin, 
  Gauge, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Compass,
  Wind,
  Thermometer,
  Eye,
  Zap,
  Shield
} from 'lucide-react';

interface FlightAnalyticsProps {
  flightAnalysis: any;
  waypoints: any[];
  currentPlan: any;
  validationErrors: string[];
  weatherData?: any;
  performanceData?: any;
}

export default function FlightAnalytics({
  flightAnalysis,
  waypoints,
  currentPlan,
  validationErrors,
  weatherData,
  performanceData
}: FlightAnalyticsProps) {
  if (!flightAnalysis) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Add waypoints to your flight plan to see detailed analytics and performance calculations.
        </AlertDescription>
      </Alert>
    );
  }

  const fuelProgress = Math.min((flightAnalysis.totalFuel / parseFloat(currentPlan.fuel || '0')) * 100, 100);
  const fuelStatus = flightAnalysis.fuelRemaining > 0 ? 'sufficient' : 'insufficient';
  
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatFuel = (gallons: number) => {
    return `${gallons.toFixed(1)} gal`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient': return 'text-green-600';
      case 'insufficient': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sufficient': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'insufficient': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default: return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Flight Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Distance</p>
                <p className="text-2xl font-bold">{flightAnalysis.totalDistance} nm</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Flight Time</p>
                <p className="text-2xl font-bold">{formatTime(flightAnalysis.totalTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Fuel className={`h-8 w-8 ${getStatusColor(fuelStatus)}`} />
              <div>
                <p className="text-sm text-muted-foreground">Fuel Required</p>
                <p className="text-2xl font-bold">{formatFuel(flightAnalysis.totalFuel)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gauge className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ground Speed</p>
                <p className="text-2xl font-bold">{currentPlan.airspeed || 0} kts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fuel Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Fuel Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fuel Usage</span>
                <span className="text-sm">{formatFuel(flightAnalysis.totalFuel)} / {formatFuel(parseFloat(currentPlan.fuel || '0'))}</span>
              </div>
              <Progress value={fuelProgress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Fuel:</span>
                  <span className="font-medium">{formatFuel(parseFloat(currentPlan.fuel || '0'))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Required:</span>
                  <span className="font-medium">{formatFuel(flightAnalysis.totalFuel)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reserve (20%):</span>
                  <span className="font-medium">{formatFuel(parseFloat(currentPlan.fuel || '0') * 0.2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Remaining:</span>
                  <span className={`font-medium ${getStatusColor(fuelStatus)}`}>
                    {formatFuel(flightAnalysis.fuelRemaining)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency:</span>
                  <span className="font-medium">{flightAnalysis.fuelEfficiency} gal/nm</span>
                </div>
                <div className="flex justify-between">
                  <span>Range:</span>
                  <span className="font-medium">{flightAnalysis.range} nm</span>
                </div>
              </div>
            </div>

            {fuelStatus === 'insufficient' && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Insufficient fuel for this flight plan. Add more fuel or reduce distance.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Compass className="h-4 w-4" />
                    True Airspeed:
                  </span>
                  <span className="font-medium">{currentPlan.airspeed || 0} kts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Cruise Altitude:
                  </span>
                  <span className="font-medium">{currentPlan.altitude || 0} ft</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Endurance:
                  </span>
                  <span className="font-medium">{formatTime(flightAnalysis.endurance)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Wind className="h-4 w-4" />
                    Ground Speed:
                  </span>
                  <span className="font-medium">{currentPlan.airspeed || 0} kts</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Fuel Flow:
                  </span>
                  <span className="font-medium">10.0 gph</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    Safety Margin:
                  </span>
                  <span className={`font-medium ${getStatusColor(fuelStatus)}`}>
                    {fuelStatus === 'sufficient' ? 'Good' : 'Low'}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Flight Status
              </h4>
              <div className="space-y-1">
                {validationErrors.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Flight plan ready for execution</span>
                  </div>
                ) : (
                  validationErrors.map((error, index) => (
                    <div key={index} className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Impact (if available) */}
      {weatherData && Object.keys(weatherData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Weather Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(weatherData).map(([station, data]: [string, any]) => (
                <div key={station} className="space-y-2">
                  <h4 className="font-medium">{station}</h4>
                  {data && (
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Temperature:</span>
                        <span>{data.temperature || 'N/A'}°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wind:</span>
                        <span>{data.windSpeed || 'N/A'} kts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Visibility:</span>
                        <span>{data.visibility || 'N/A'} nm</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              Navigation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Route Overview</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Waypoints:</span>
                    <span className="font-medium">{waypoints.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Route Type:</span>
                    <span className="font-medium capitalize">{currentPlan.flightRules || 'VFR'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Departure:</span>
                    <span className="font-medium">{currentPlan.departure || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Destination:</span>
                    <span className="font-medium">{currentPlan.destination || 'Not set'}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Efficiency Metrics</h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Direct Distance:</span>
                    <span className="font-medium">{flightAnalysis.totalDistance} nm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flight Efficiency:</span>
                    <span className="font-medium">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time Efficiency:</span>
                    <span className="font-medium">98%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Efficiency:</span>
                    <span className="font-medium">{flightAnalysis.fuelEfficiency} gal/nm</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}