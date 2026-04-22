import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Layers, 
  CloudRain, 
  Zap, 
  AlertTriangle, 
  Route, 
  Shield, 
  Wind, 
  Snowflake,
  Radio,
  Plane,
  Navigation2,
  Satellite,
  ThermometerSun,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherLayerToggle {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  count?: number;
  color?: string;
  loading?: boolean;
}

interface WeatherSidebarProps {
  layers: WeatherLayerToggle[];
  radarOpacity?: number;
  onRadarOpacityChange?: (value: number) => void;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export const WeatherSidebar = ({
  layers,
  radarOpacity = 0.7,
  onRadarOpacityChange,
  collapsed = false,
  onCollapsedChange,
  className = '',
}: WeatherSidebarProps) => {
  const [weatherOpen, setWeatherOpen] = useState(true);
  const [overlaysOpen, setOverlaysOpen] = useState(true);
  const [flightOpen, setFlightOpen] = useState(true);

  // Group layers by category
  const weatherLayers = layers.filter(l => ['radar', 'satellite', 'lightning', 'precip'].some(k => l.id.includes(k)));
  const overlayLayers = layers.filter(l => ['tfr', 'airmet', 'sigmet', 'storm', 'icing', 'turb'].some(k => l.id.includes(k)));
  const flightLayers = layers.filter(l => ['route', 'winds', 'pirep'].some(k => l.id.includes(k)));

  if (collapsed) {
    return (
      <div className={cn(
        "glass-panel h-full flex flex-col items-center py-4 gap-2 w-12",
        className
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onCollapsedChange?.(false)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Separator className="my-2 w-6" />
        {layers.filter(l => l.enabled).slice(0, 6).map(layer => (
          <div
            key={layer.id}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              layer.enabled ? "bg-primary/20" : "bg-muted/50"
            )}
            title={layer.label}
          >
            {layer.icon}
          </div>
        ))}
      </div>
    );
  }

  const renderLayerToggle = (layer: WeatherLayerToggle) => (
    <div 
      key={layer.id}
      className={cn(
        "flex items-center justify-between p-2 rounded-lg transition-all",
        layer.enabled ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-center gap-2">
        <div 
          className={cn(
            "p-1.5 rounded",
            layer.enabled ? "text-primary" : "text-muted-foreground"
          )}
          style={layer.color ? { color: layer.color } : undefined}
        >
          {layer.icon}
        </div>
        <div className="flex flex-col">
          <Label 
            htmlFor={`layer-${layer.id}`}
            className={cn(
              "text-sm cursor-pointer",
              layer.enabled ? "font-medium" : ""
            )}
          >
            {layer.label}
          </Label>
          {layer.count !== undefined && (
            <span className="text-[10px] text-muted-foreground">
              {layer.count} {layer.count === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {layer.loading && (
          <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        <Switch
          id={`layer-${layer.id}`}
          checked={layer.enabled}
          onCheckedChange={layer.onToggle}
          className="scale-90"
        />
      </div>
    </div>
  );

  return (
    <div className={cn(
      "glass-panel h-full flex flex-col w-72",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Weather Layers</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onCollapsedChange?.(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {/* Radar Opacity */}
          {onRadarOpacityChange && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Radar Opacity: {Math.round(radarOpacity * 100)}%
              </Label>
              <Slider
                value={[radarOpacity]}
                onValueChange={([v]) => onRadarOpacityChange(v)}
                min={0}
                max={1}
                step={0.05}
                className="w-full"
              />
            </div>
          )}

          {/* Weather Layers */}
          {weatherLayers.length > 0 && (
            <Collapsible open={weatherOpen} onOpenChange={setWeatherOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <CloudRain className="h-3.5 w-3.5" />
                    Weather
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    weatherOpen ? "rotate-0" : "-rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {weatherLayers.map(renderLayerToggle)}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Overlays & Advisories */}
          {overlayLayers.length > 0 && (
            <Collapsible open={overlaysOpen} onOpenChange={setOverlaysOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Overlays & Advisories
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    overlaysOpen ? "rotate-0" : "-rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {overlayLayers.map(renderLayerToggle)}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Flight Planning */}
          {flightLayers.length > 0 && (
            <Collapsible open={flightOpen} onOpenChange={setFlightOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2 h-auto"
                >
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Route className="h-3.5 w-3.5" />
                    Flight Planning
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 transition-transform",
                    flightOpen ? "rotate-0" : "-rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 mt-1">
                {flightLayers.map(renderLayerToggle)}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>

      {/* Footer with enabled count */}
      <div className="p-3 border-t border-white/10 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{layers.filter(l => l.enabled).length} layers active</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px]"
            onClick={() => layers.forEach(l => l.onToggle(false))}
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WeatherSidebar;
