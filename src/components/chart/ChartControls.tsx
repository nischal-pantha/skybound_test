
import React from 'react';
import { Button } from '@/components/ui/button';
import { Target, ZoomIn, ZoomOut } from 'lucide-react';

interface ChartControlsProps {
  isAddingWaypoint: boolean;
  zoomLevel: number;
  onToggleWaypoint: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
  isAddingWaypoint,
  zoomLevel,
  onToggleWaypoint,
  onZoomIn,
  onZoomOut
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-between items-center">
      <div className="flex gap-2">
        <Button
          variant={isAddingWaypoint ? "default" : "outline"}
          size="sm"
          onClick={onToggleWaypoint}
        >
          <Target className="w-4 h-4 mr-2" />
          {isAddingWaypoint ? 'Cancel' : 'Add Waypoint'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomIn}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onZoomOut}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>
      <div className="text-sm text-muted-foreground">
        Zoom: {(zoomLevel * 100).toFixed(0)}%
      </div>
    </div>
  );
};
