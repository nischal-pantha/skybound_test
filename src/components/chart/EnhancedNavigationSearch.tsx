import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plane, Navigation2, MapPin, Radio, Target, History, X, Locate, Route, Info, Star, ChevronRight } from 'lucide-react';
import { AIRPORT_DATA, type Airport } from '@/data/airportData';
import { VOR_DATA, NDB_DATA, FIX_DATA, getAllNavaids, getNavaidColor, type Navaid, type NavaidType } from '@/data/navaidData';
import { cn } from '@/lib/utils';

export interface SearchResult {
  id: string;
  type: 'airport' | 'vor' | 'ndb' | 'fix' | 'user-waypoint';
  identifier: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  frequency?: string;
  elevation?: number;
  distance?: number;
  bearing?: number;
  details?: string;
}

interface EnhancedNavigationSearchProps {
  onSelect: (result: SearchResult, action?: 'flyTo' | 'addToRoute' | 'setDeparture' | 'setDestination' | 'directTo') => void;
  userPosition?: { latitude: number; longitude: number } | null;
  className?: string;
  placeholder?: string;
  showCommandPalette?: boolean;
  compact?: boolean;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
};

const fuzzyMatch = (query: string, text: string): boolean => {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  
  // Check if query chars appear in order
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
};

export const EnhancedNavigationSearch = ({
  onSelect,
  userPosition,
  className = '',
  placeholder = 'Search airports, VORs, fixes...',
  showCommandPalette = true,
  compact = false,
}: EnhancedNavigationSearchProps) => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [filter, setFilter] = useState<'all' | 'airports' | 'vors' | 'fixes'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aviation-recent-searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load recent searches:', e);
    }
  }, []);

  // Keyboard shortcut for command palette
  useEffect(() => {
    if (!showCommandPalette) return;
    
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setDialogOpen(prev => !prev);
      }
    };
    
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showCommandPalette]);

  // Build search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!query.trim() && filter === 'all') return [];

    const results: SearchResult[] = [];
    const q = query.trim().toUpperCase();

    // Search airports
    if (filter === 'all' || filter === 'airports') {
      AIRPORT_DATA.forEach(airport => {
        const matchesICAO = airport.icao.includes(q);
        const matchesIATA = airport.iata?.includes(q);
        const matchesName = fuzzyMatch(q, airport.name);
        const matchesCity = fuzzyMatch(q, airport.city);

        if (matchesICAO || matchesIATA || matchesName || matchesCity || !q) {
          const result: SearchResult = {
            id: airport.icao,
            type: 'airport',
            identifier: airport.icao,
            name: airport.name,
            coordinates: [airport.coordinates[1], airport.coordinates[0]], // [lng, lat]
            elevation: airport.elevation,
            details: `${airport.city}, ${airport.state} • ${airport.type} • ${airport.elevation}ft`,
          };

          if (userPosition) {
            result.distance = calculateDistance(
              userPosition.latitude, userPosition.longitude,
              airport.coordinates[0], airport.coordinates[1]
            );
            result.bearing = calculateBearing(
              userPosition.latitude, userPosition.longitude,
              airport.coordinates[0], airport.coordinates[1]
            );
          }

          results.push(result);
        }
      });
    }

    // Search VORs
    if (filter === 'all' || filter === 'vors') {
      VOR_DATA.forEach(vor => {
        const matchesId = vor.id.includes(q);
        const matchesName = fuzzyMatch(q, vor.name);

        if (matchesId || matchesName || !q) {
          const result: SearchResult = {
            id: vor.id,
            type: 'vor',
            identifier: vor.id,
            name: vor.name,
            coordinates: vor.coordinates,
            frequency: vor.frequency,
            details: `${vor.type} • ${vor.frequency} MHz`,
          };

          if (userPosition) {
            result.distance = calculateDistance(
              userPosition.latitude, userPosition.longitude,
              vor.coordinates[1], vor.coordinates[0]
            );
            result.bearing = calculateBearing(
              userPosition.latitude, userPosition.longitude,
              vor.coordinates[1], vor.coordinates[0]
            );
          }

          results.push(result);
        }
      });

      NDB_DATA.forEach(ndb => {
        const matchesId = ndb.id.includes(q);
        const matchesName = fuzzyMatch(q, ndb.name);

        if (matchesId || matchesName || !q) {
          const result: SearchResult = {
            id: ndb.id,
            type: 'ndb',
            identifier: ndb.id,
            name: ndb.name,
            coordinates: ndb.coordinates,
            frequency: ndb.frequency,
            details: `NDB • ${ndb.frequency} kHz`,
          };

          if (userPosition) {
            result.distance = calculateDistance(
              userPosition.latitude, userPosition.longitude,
              ndb.coordinates[1], ndb.coordinates[0]
            );
            result.bearing = calculateBearing(
              userPosition.latitude, userPosition.longitude,
              ndb.coordinates[1], ndb.coordinates[0]
            );
          }

          results.push(result);
        }
      });
    }

    // Search Fixes
    if (filter === 'all' || filter === 'fixes') {
      FIX_DATA.forEach(fix => {
        const matchesId = fix.id.includes(q);
        const matchesName = fuzzyMatch(q, fix.name);

        if (matchesId || matchesName || !q) {
          const result: SearchResult = {
            id: fix.id,
            type: 'fix',
            identifier: fix.id,
            name: fix.name,
            coordinates: fix.coordinates,
            details: fix.description || fix.type,
          };

          if (userPosition) {
            result.distance = calculateDistance(
              userPosition.latitude, userPosition.longitude,
              fix.coordinates[1], fix.coordinates[0]
            );
            result.bearing = calculateBearing(
              userPosition.latitude, userPosition.longitude,
              fix.coordinates[1], fix.coordinates[0]
            );
          }

          results.push(result);
        }
      });
    }

    // Sort by distance if available, otherwise by identifier
    results.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // Prioritize exact matches
      if (a.identifier === q) return -1;
      if (b.identifier === q) return 1;
      return a.identifier.localeCompare(b.identifier);
    });

    return results.slice(0, 50); // Limit results
  }, [query, filter, userPosition]);

  const handleSelect = useCallback((result: SearchResult, action: 'flyTo' | 'addToRoute' | 'setDeparture' | 'setDestination' | 'directTo' = 'flyTo') => {
    // Add to recent searches
    const updated = [result, ...recentSearches.filter(r => r.id !== result.id)].slice(0, 10);
    setRecentSearches(updated);
    localStorage.setItem('aviation-recent-searches', JSON.stringify(updated));

    onSelect(result, action);
    setQuery('');
    setOpen(false);
    setDialogOpen(false);
  }, [recentSearches, onSelect]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('aviation-recent-searches');
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'airport': return <Plane className="h-4 w-4" />;
      case 'vor': return <Radio className="h-4 w-4" />;
      case 'ndb': return <Target className="h-4 w-4" />;
      case 'fix': return <Navigation2 className="h-4 w-4" />;
      case 'user-waypoint': return <MapPin className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'airport': return 'bg-primary text-primary-foreground';
      case 'vor': return 'bg-success text-success-foreground';
      case 'ndb': return 'bg-purple-500 text-white';
      case 'fix': return 'bg-blue-500 text-white';
      case 'user-waypoint': return 'bg-accent text-accent-foreground';
    }
  };

  const renderResultItem = (result: SearchResult) => (
    <CommandItem
      key={result.id}
      value={`${result.identifier} ${result.name}`}
      onSelect={() => handleSelect(result, 'flyTo')}
      className="flex items-center justify-between gap-2 p-2 cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={cn('p-1.5 rounded', getTypeBadgeColor(result.type))}>
          {getTypeIcon(result.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold font-mono">{result.identifier}</span>
            <span className="text-muted-foreground text-sm truncate">{result.name}</span>
          </div>
          {result.details && (
            <div className="text-xs text-muted-foreground truncate">{result.details}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {result.distance !== undefined && (
          <div className="text-right">
            <div className="text-sm font-medium">{result.distance.toFixed(1)} nm</div>
            {result.bearing !== undefined && (
              <div className="text-xs text-muted-foreground">{result.bearing.toFixed(0)}°</div>
            )}
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </CommandItem>
  );

  // Command Dialog (Cmd+K palette)
  if (showCommandPalette) {
    return (
      <>
        {/* Compact search trigger */}
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn(
            "justify-start gap-2 text-muted-foreground font-normal",
            compact ? "h-8 px-2" : "h-10 px-3",
            className
          )}
          onClick={() => setDialogOpen(true)}
        >
          <Search className={cn("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          <span className={cn("truncate", compact ? "text-xs" : "text-sm")}>{placeholder}</span>
          <kbd className="ml-auto pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium hidden sm:inline-flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Command Dialog */}
        <CommandDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 p-2 border-b">
              {(['all', 'airports', 'vors', 'fixes'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'vors' ? 'VORs/NDBs' : f}
                </Button>
              ))}
            </div>

            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {/* Recent searches */}
              {!query && recentSearches.length > 0 && (
                <CommandGroup heading={
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <History className="h-3 w-3" /> Recent
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] px-1"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </Button>
                  </div>
                }>
                  {recentSearches.slice(0, 5).map(renderResultItem)}
                </CommandGroup>
              )}

              {/* Search results */}
              {searchResults.length > 0 && (
                <>
                  {query && <CommandSeparator />}
                  <CommandGroup heading={
                    <span className="flex items-center gap-1.5">
                      <Locate className="h-3 w-3" /> Results ({searchResults.length})
                    </span>
                  }>
                    {searchResults.map(renderResultItem)}
                  </CommandGroup>
                </>
              )}
            </CommandList>

            {/* Quick actions footer */}
            <div className="flex items-center justify-between p-2 border-t text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 border rounded">↵</kbd> Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 border rounded">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1 border rounded">Esc</kbd> Close
                </span>
              </div>
              {userPosition && (
                <span className="text-green-500 flex items-center gap-1">
                  <Locate className="h-3 w-3" /> GPS Active
                </span>
              )}
            </div>
          </Command>
        </CommandDialog>
      </>
    );
  }

  // Inline popover search
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-start gap-2", className)}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate text-muted-foreground">{placeholder}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput
            ref={inputRef}
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {searchResults.length > 0 && (
              <CommandGroup heading="Results">
                {searchResults.slice(0, 10).map(renderResultItem)}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedNavigationSearch;
