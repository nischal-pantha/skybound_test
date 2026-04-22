import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { MapPin, Navigation, Activity, Play, Square, Crosshair } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const GPSTracker: React.FC = () => {
  const { 
    gpsPosition, 
    isGPSTracking, 
    startGPSTracking, 
    stopGPSTracking,
    getCurrentGPSPosition 
  } = useAppContext();
  const { toast } = useToast();

  const handleGetCurrentPosition = async () => {
    try {
      await getCurrentGPSPosition();
      toast({
        title: "Position Updated",
        description: "Current GPS position acquired",
      });
    } catch (error) {
      toast({
        title: "GPS Error",
        description: "Could not get current position",
        variant: "destructive",
      });
    }
  };

  const toggleTracking = () => {
    if (isGPSTracking) {
      stopGPSTracking();
      toast({
        title: "GPS Tracking Stopped",
        description: "Location tracking has been disabled",
      });
    } else {
      startGPSTracking();
      toast({
        title: "GPS Tracking Started",
        description: "Real-time location tracking enabled",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            GPS Position
          </span>
          <Badge variant={isGPSTracking ? "default" : "secondary"}>
            {isGPSTracking ? "Tracking" : "Standby"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {gpsPosition ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Latitude</p>
              <p className="font-mono font-semibold">{gpsPosition.latitude.toFixed(6)}°</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Longitude</p>
              <p className="font-mono font-semibold">{gpsPosition.longitude.toFixed(6)}°</p>
            </div>
            {gpsPosition.altitude && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Altitude</p>
                <p className="font-mono font-semibold">{Math.round(gpsPosition.altitude * 3.28084)} ft</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Accuracy</p>
              <p className="font-mono font-semibold">±{Math.round(gpsPosition.accuracy)} m</p>
            </div>
            {gpsPosition.speed !== null && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Speed</p>
                <p className="font-mono font-semibold">{Math.round(gpsPosition.speed * 1.94384)} kts</p>
              </div>
            )}
            {gpsPosition.heading !== null && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Heading</p>
                <p className="font-mono font-semibold">{Math.round(gpsPosition.heading)}°</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No GPS data available</p>
            <p className="text-xs mt-1">Enable tracking to get your position</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={toggleTracking}
            variant={isGPSTracking ? "destructive" : "default"}
            className="flex-1"
          >
            {isGPSTracking ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Stop Tracking
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Tracking
              </>
            )}
          </Button>
          <Button
            onClick={handleGetCurrentPosition}
            variant="outline"
            disabled={isGPSTracking}
          >
            <Crosshair className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
