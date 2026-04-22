import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layers, Snowflake, Wind, Cloud, Thermometer, ChevronDown, ChevronUp, Plane, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Waypoint {
  id: string;
  identifier: string;
  coordinates: [number, number];
}

interface VerticalSlice {
  waypointId: string;
  identifier: string;
  distanceNM: number;
  layers: AltitudeLayer[];
}

interface AltitudeLayer {
  altitude: number; // feet
  temperature: number; // celsius
  windSpeed: number;
  windDirection: number;
  humidity: number; // %
  icingRisk: 'none' | 'light' | 'moderate' | 'severe';
  turbulenceRisk: 'none' | 'light' | 'moderate' | 'severe' | 'extreme';
  cloudCoverage: 'clear' | 'few' | 'scattered' | 'broken' | 'overcast';
  freezingLevel: boolean;
}

interface VerticalProfileProps {
  waypoints: Waypoint[];
  cruiseAltitude?: number;
  className?: string;
}

const ALTITUDE_LEVELS = [1000, 3000, 6000, 9000, 12000, 15000, 18000, 24000, 30000, 36000, 40000];

const RISK_COLORS = {
  none: 'hsl(142, 76%, 36%)',
  light: 'hsl(214, 100%, 60%)',
  moderate: 'hsl(38, 92%, 50%)',
  severe: 'hsl(0, 84%, 60%)',
  extreme: 'hsl(280, 70%, 50%)',
};

const CLOUD_COLORS = {
  clear: 'hsla(214, 100%, 60%, 0.05)',
  few: 'hsla(214, 100%, 60%, 0.15)',
  scattered: 'hsla(214, 100%, 60%, 0.3)',
  broken: 'hsla(214, 100%, 60%, 0.5)',
  overcast: 'hsla(214, 100%, 60%, 0.7)',
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Generate simulated vertical profile data
const generateVerticalData = (waypoints: Waypoint[]): VerticalSlice[] => {
  let cumulativeDistance = 0;
  
  return waypoints.map((wp, i) => {
    if (i > 0) {
      const prev = waypoints[i - 1];
      cumulativeDistance += calculateDistance(
        prev.coordinates[1], prev.coordinates[0],
        wp.coordinates[1], wp.coordinates[0]
      );
    }

    // Generate data for each altitude level based on position
    const lat = wp.coordinates[1];
    const seed = lat * 100 + wp.coordinates[0] * 10;

    const layers: AltitudeLayer[] = ALTITUDE_LEVELS.map(alt => {
      const altFactor = alt / 1000;
      const temp = 15 - altFactor * 2 + Math.sin(seed) * 3;
      const windSpd = 8 + altFactor * 3 + Math.abs(Math.sin(seed + alt)) * 15;
      const windDir = (270 + Math.sin(seed) * 30 + altFactor * 2) % 360;
      const humidity = Math.max(10, Math.min(100, 60 - altFactor * 1.5 + Math.sin(seed + alt / 1000) * 25));
      
      const freezingLevel = temp <= 0 && temp > -4;
      
      // Icing risk based on temperature and humidity
      let icingRisk: AltitudeLayer['icingRisk'] = 'none';
      if (temp <= 0 && temp >= -20 && humidity > 70) {
        icingRisk = humidity > 90 ? 'severe' : humidity > 80 ? 'moderate' : 'light';
      }
      
      // Turbulence risk
      let turbulenceRisk: AltitudeLayer['turbulenceRisk'] = 'none';
      if (windSpd > 50) turbulenceRisk = 'severe';
      else if (windSpd > 35) turbulenceRisk = 'moderate';
      else if (windSpd > 20) turbulenceRisk = 'light';
      if (alt > 28000 && alt < 38000 && windSpd > 40) turbulenceRisk = 'extreme';
      
      // Cloud coverage
      let cloudCoverage: AltitudeLayer['cloudCoverage'] = 'clear';
      if (humidity > 85) cloudCoverage = 'overcast';
      else if (humidity > 70) cloudCoverage = 'broken';
      else if (humidity > 55) cloudCoverage = 'scattered';
      else if (humidity > 40) cloudCoverage = 'few';
      
      return {
        altitude: alt,
        temperature: Math.round(temp),
        windSpeed: Math.round(windSpd),
        windDirection: Math.round(windDir),
        humidity: Math.round(humidity),
        icingRisk,
        turbulenceRisk,
        cloudCoverage,
        freezingLevel,
      };
    });

    return {
      waypointId: wp.id,
      identifier: wp.identifier,
      distanceNM: Math.round(cumulativeDistance),
      layers,
    };
  });
};

export const VerticalProfile = ({ waypoints, cruiseAltitude = 12000, className = '' }: VerticalProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'icing' | 'turbulence' | 'clouds' | 'temperature'>('icing');

  const verticalData = useMemo(() => {
    if (waypoints.length < 2) return [];
    return generateVerticalData(waypoints);
  }, [waypoints]);

  if (waypoints.length < 2) return null;

  const totalDistance = verticalData.length > 0 
    ? verticalData[verticalData.length - 1].distanceNM 
    : 0;

  const getCellColor = (layer: AltitudeLayer): string => {
    switch (viewMode) {
      case 'icing': return RISK_COLORS[layer.icingRisk];
      case 'turbulence': return RISK_COLORS[layer.turbulenceRisk];
      case 'clouds': return CLOUD_COLORS[layer.cloudCoverage];
      case 'temperature': {
        const t = layer.temperature;
        if (t > 20) return 'hsl(0, 84%, 60%)';
        if (t > 10) return 'hsl(38, 92%, 50%)';
        if (t > 0) return 'hsl(142, 76%, 36%)';
        if (t > -10) return 'hsl(214, 100%, 60%)';
        if (t > -30) return 'hsl(240, 70%, 50%)';
        return 'hsl(280, 70%, 50%)';
      }
    }
  };

  const getCellLabel = (layer: AltitudeLayer): string => {
    switch (viewMode) {
      case 'icing': return layer.icingRisk === 'none' ? '' : layer.icingRisk[0].toUpperCase();
      case 'turbulence': return layer.turbulenceRisk === 'none' ? '' : layer.turbulenceRisk[0].toUpperCase();
      case 'clouds': return layer.cloudCoverage === 'clear' ? '' : layer.cloudCoverage.slice(0, 3).toUpperCase();
      case 'temperature': return `${layer.temperature}°`;
    }
  };

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-base">
                <Layers className="h-4 w-4" />
                Vertical Profile
                <Badge variant="secondary" className="text-[10px]">
                  {totalDistance} nm
                </Badge>
              </span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {/* View mode selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                  <SelectTrigger className="h-8 text-xs w-[150px]">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="icing">
                      <span className="flex items-center gap-1.5">
                        <Snowflake className="h-3 w-3 text-blue-500" /> Icing Risk
                      </span>
                    </SelectItem>
                    <SelectItem value="turbulence">
                      <span className="flex items-center gap-1.5">
                        <Wind className="h-3 w-3 text-amber-500" /> Turbulence
                      </span>
                    </SelectItem>
                    <SelectItem value="clouds">
                      <span className="flex items-center gap-1.5">
                        <Cloud className="h-3 w-3 text-gray-500" /> Cloud Cover
                      </span>
                    </SelectItem>
                    <SelectItem value="temperature">
                      <span className="flex items-center gap-1.5">
                        <Thermometer className="h-3 w-3 text-red-500" /> Temperature
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Plane className="h-3 w-3" />
                  Cruise: FL{Math.floor(cruiseAltitude / 100)}
                </Badge>
              </div>

              {/* Cross-section grid */}
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  {/* Header row with waypoints */}
                  <div className="flex">
                    <div className="w-16 shrink-0" />
                    {verticalData.map((slice, i) => (
                      <div
                        key={slice.waypointId}
                        className="flex-1 text-center text-[10px] font-bold px-0.5 border-b pb-1"
                        style={{ minWidth: '60px' }}
                      >
                        <div>{slice.identifier}</div>
                        <div className="text-muted-foreground font-normal">{slice.distanceNM} nm</div>
                      </div>
                    ))}
                  </div>

                  {/* Altitude rows (top to bottom = high to low) */}
                  {[...ALTITUDE_LEVELS].reverse().map(alt => {
                    const isCruise = Math.abs(alt - cruiseAltitude) < 1500;
                    return (
                      <div key={alt} className="flex items-stretch">
                        {/* Altitude label */}
                        <div className={`w-16 shrink-0 text-[10px] pr-2 flex items-center justify-end ${isCruise ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                          FL{Math.floor(alt / 100)}
                          {isCruise && <Plane className="h-2.5 w-2.5 ml-0.5" />}
                        </div>
                        {/* Data cells */}
                        {verticalData.map(slice => {
                          const layer = slice.layers.find(l => l.altitude === alt);
                          if (!layer) return <div key={slice.waypointId} className="flex-1" style={{ minWidth: '60px' }} />;
                          
                          const bgColor = getCellColor(layer);
                          const label = getCellLabel(layer);
                          
                          return (
                            <div
                              key={slice.waypointId}
                              className="flex-1 flex items-center justify-center text-[9px] font-medium border border-background/30 relative"
                              style={{ 
                                minWidth: '60px',
                                minHeight: '22px',
                                backgroundColor: bgColor,
                                color: viewMode === 'clouds' ? 'hsl(var(--foreground))' : 'white',
                              }}
                              title={`FL${Math.floor(alt / 100)} at ${slice.identifier}: ${viewMode === 'temperature' ? `${layer.temperature}°C` : viewMode === 'icing' ? `Icing: ${layer.icingRisk}` : viewMode === 'turbulence' ? `Turb: ${layer.turbulenceRisk}` : `Clouds: ${layer.cloudCoverage}`} | Wind: ${layer.windDirection}°@${layer.windSpeed}kt | Humidity: ${layer.humidity}%`}
                            >
                              {label}
                              {/* Freezing level indicator */}
                              {layer.freezingLevel && (
                                <div className="absolute inset-x-0 top-0 h-[2px] bg-cyan-400" />
                              )}
                              {/* Cruise altitude marker */}
                              {isCruise && (
                                <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap pt-1">
                {viewMode === 'icing' && (
                  <>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.none }} /> None</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.light }} /> Light</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.moderate }} /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.severe }} /> Severe</span>
                  </>
                )}
                {viewMode === 'turbulence' && (
                  <>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.none }} /> None</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.light }} /> Light</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.moderate }} /> Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.severe }} /> Severe</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: RISK_COLORS.extreme }} /> Extreme</span>
                  </>
                )}
                {viewMode === 'temperature' && (
                  <>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(0, 84%, 60%)' }} /> &gt;20°C</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(38, 92%, 50%)' }} /> 10-20°C</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(142, 76%, 36%)' }} /> 0-10°C</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(214, 100%, 60%)' }} /> 0 to -10°C</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: 'hsl(240, 70%, 50%)' }} /> -10 to -30°C</span>
                  </>
                )}
                <span className="flex items-center gap-1 ml-auto">
                  <span className="w-4 h-[2px] bg-cyan-400" /> Freezing Level
                </span>
              </div>

              {/* Hazard summary */}
              {verticalData.some(s => s.layers.some(l => l.icingRisk !== 'none' || l.turbulenceRisk !== 'none')) && (
                <div className="bg-muted/30 rounded-lg p-2 text-xs space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-amber-500">
                    <AlertTriangle className="h-3 w-3" /> Route Hazard Summary
                  </div>
                  {verticalData.some(s => s.layers.some(l => l.icingRisk === 'severe' || l.icingRisk === 'moderate')) && (
                    <p className="text-muted-foreground">
                      ❄️ Icing reported along route — check freezing level and plan accordingly.
                    </p>
                  )}
                  {verticalData.some(s => s.layers.some(l => l.turbulenceRisk === 'severe' || l.turbulenceRisk === 'extreme')) && (
                    <p className="text-muted-foreground">
                      💨 Significant turbulence at some flight levels — consider altitude change.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
