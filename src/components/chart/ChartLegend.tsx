
import React from 'react';
import { Plane, Navigation, MapPin } from 'lucide-react';

export const ChartLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 right-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-md border">
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
            <Plane className="w-2 h-2 text-white" />
          </div>
          <span>Airports</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
            <Navigation className="w-2 h-2 text-white" />
          </div>
          <span>VORs</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
            <MapPin className="w-2 h-2 text-white" />
          </div>
          <span>Selected Waypoints</span>
        </div>
      </div>
    </div>
  );
};
