
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Target, 
  ZoomIn, 
  ZoomOut, 
  Navigation, 
  Grid3x3,
  Compass,
  Ruler,
  RotateCcw
} from 'lucide-react';

interface EnhancedChartControlsProps {
  isAddingWaypoint: boolean;
  zoomLevel: number;
  onToggleWaypoint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomChange: (value: number) => void;
}

export const EnhancedChartControls: React.FC<EnhancedChartControlsProps> = ({
  isAddingWaypoint,
  zoomLevel,
  onToggleWaypoint,
  onZoomIn,
  onZoomOut,
  onZoomChange
}) => {
  const [showGrid, setShowGrid] = React.useState(true);
  const [showCompass, setShowCompass] = React.useState(true);
  const [showMeasurements, setShowMeasurements] = React.useState(true);
  const [chartType, setChartType] = React.useState('sectional');

  const resetView = () => {
    onZoomChange(1.0);
  };

  return (
    <div className="space-y-4">
      {/* Primary Controls */}
      <div className="flex flex-wrap gap-3 justify-between items-center p-4 bg-card rounded-lg border">
        <div className="flex gap-2">
          <Button
            variant={isAddingWaypoint ? "default" : "outline"}
            size="sm"
            onClick={onToggleWaypoint}
            className="transition-all"
          >
            <Target className="w-4 h-4 mr-2" />
            {isAddingWaypoint ? 'Cancel Add' : 'Add Waypoint'}
          </Button>
          
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={onZoomOut} disabled={zoomLevel <= 0.5}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onZoomIn} disabled={zoomLevel >= 3}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-mono">
            {(zoomLevel * 100).toFixed(0)}%
          </Badge>
          <Badge variant="outline">
            <Navigation className="w-3 h-3 mr-1" />
            VFR Chart
          </Badge>
        </div>
      </div>

      {/* Chart Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg border">
        {/* Chart Type Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Chart Type
          </Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sectional">VFR Sectional</SelectItem>
              <SelectItem value="terminal">Terminal Area</SelectItem>
              <SelectItem value="world">World Aeronautical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Zoom Control */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Zoom Level</Label>
          <div className="px-2 py-1">
            <Slider
              value={[zoomLevel]}
              onValueChange={(value) => onZoomChange(value[0])}
              max={3}
              min={0.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>50%</span>
              <span>300%</span>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Display Options</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="grid" className="text-xs flex items-center gap-2 cursor-pointer">
                <Grid3x3 className="w-3 h-3" />
                Coordinate Grid
              </Label>
              <Switch
                id="grid"
                checked={showGrid}
                onCheckedChange={setShowGrid}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="compass" className="text-xs flex items-center gap-2 cursor-pointer">
                <Compass className="w-3 h-3" />
                Compass Rose
              </Label>
              <Switch
                id="compass"
                checked={showCompass}
                onCheckedChange={setShowCompass}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="measurements" className="text-xs flex items-center gap-2 cursor-pointer">
                <Ruler className="w-3 h-3" />
                Distance/Bearing
              </Label>
              <Switch
                id="measurements"
                checked={showMeasurements}
                onCheckedChange={setShowMeasurements}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>• Click chart to add waypoints</span>
        <span>• Drag to pan</span>
        <span>• Scroll to zoom</span>
      </div>
    </div>
  );
};
