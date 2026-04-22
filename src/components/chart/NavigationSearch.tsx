
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface NavPoint {
  identifier: string;
  name: string;
  lat: number;
  lng: number;
  type: 'airport' | 'vor' | 'fix';
}

interface NavigationSearchProps {
  navDatabase: NavPoint[];
  onNavPointSelect: (point: NavPoint) => void;
}

export const NavigationSearch: React.FC<NavigationSearchProps> = ({
  navDatabase,
  onNavPointSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNavPoints = navDatabase.filter(point =>
    point.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <Label className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Airports, VORs, Fixes
          </Label>
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter identifier or name..."
          />
        </div>
      </div>

      {searchTerm && filteredNavPoints.length > 0 && (
        <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
          {filteredNavPoints.map((point) => (
            <div
              key={point.identifier}
              className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer rounded"
              onClick={() => onNavPointSelect(point)}
            >
              <div className="flex items-center gap-3">
                <Badge variant={point.type === 'airport' ? 'default' : point.type === 'vor' ? 'secondary' : 'outline'}>
                  {point.type.toUpperCase()}
                </Badge>
                <div>
                  <div className="font-medium">{point.identifier}</div>
                  <div className="text-sm text-muted-foreground">{point.name}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
