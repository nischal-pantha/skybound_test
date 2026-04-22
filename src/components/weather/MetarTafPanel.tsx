import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Plane, Cloud, Wind, Eye, Thermometer, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Airport {
  icao: string;
  name: string;
  coordinates: [number, number];
}

interface MetarData {
  icaoId: string;
  rawOb: string;
  temp?: number;
  dewp?: number;
  wdir?: number;
  wspd?: number;
  wgst?: number;
  visib?: number;
  cldBas1?: number;
  cldCvg1?: string;
  wxString?: string;
  altim?: number;
  obsTime?: string;
}

interface TafData {
  icaoId: string;
  rawTAF: string;
  issueTime?: string;
  validTimeFrom?: string;
  validTimeTo?: string;
}

interface MetarTafPanelProps {
  airports: Airport[];
  className?: string;
}

export const MetarTafPanel = ({ airports, className = '' }: MetarTafPanelProps) => {
  const [metarData, setMetarData] = useState<Record<string, MetarData>>({});
  const [tafData, setTafData] = useState<Record<string, TafData>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<string>(airports[0]?.icao || '');

  const getFlightCategory = (metar: MetarData): { category: string; color: string } => {
    const vis = metar.visib ?? 10;
    const ceil = metar.cldBas1 ?? 99999;
    
    if (vis < 1 || ceil < 500) return { category: 'LIFR', color: '#a855f7' };
    if (vis < 3 || ceil < 1000) return { category: 'IFR', color: '#ef4444' };
    if (vis < 5 || ceil < 3000) return { category: 'MVFR', color: '#3b82f6' };
    return { category: 'VFR', color: '#22c55e' };
  };

  const fetchWeatherData = useCallback(async () => {
    if (airports.length === 0) return;
    
    setLoading(true);
    const newMetarData: Record<string, MetarData> = {};
    const newTafData: Record<string, TafData> = {};

    try {
      // Fetch METAR and TAF for all airports
      const icaoCodes = airports.map(a => a.icao).join(',');
      
      // Fetch via Supabase edge function
      const [metarResponse, tafResponse] = await Promise.all([
        supabase.functions.invoke('aviation-weather', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        }).then(() => 
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aviation-weather?type=metar&ids=${icaoCodes}`)
        ),
        supabase.functions.invoke('aviation-weather', {
          body: null,
          headers: { 'Content-Type': 'application/json' },
        }).then(() =>
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/aviation-weather?type=taf&ids=${icaoCodes}`)
        ),
      ]);

      if (metarResponse.ok) {
        const metars = await metarResponse.json();
        if (Array.isArray(metars)) {
          metars.forEach((metar: MetarData) => {
            if (metar.icaoId) {
              newMetarData[metar.icaoId] = metar;
            }
          });
        }
      }

      if (tafResponse.ok) {
        const tafs = await tafResponse.json();
        if (Array.isArray(tafs)) {
          tafs.forEach((taf: TafData) => {
            if (taf.icaoId) {
              newTafData[taf.icaoId] = taf;
            }
          });
        }
      }

      setMetarData(newMetarData);
      setTafData(newTafData);
      setLastUpdated(new Date());
      
      console.log('[MetarTaf] Loaded data for', Object.keys(newMetarData).length, 'airports');
    } catch (error) {
      console.error('[MetarTaf] Failed to fetch weather data:', error);
    } finally {
      setLoading(false);
    }
  }, [airports]);

  useEffect(() => {
    fetchWeatherData();
    
    // Auto-refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  useEffect(() => {
    if (airports[0]?.icao && !activeTab) {
      setActiveTab(airports[0].icao);
    }
  }, [airports, activeTab]);

  const formatTime = (timeStr?: string): string => {
    if (!timeStr) return 'N/A';
    try {
      return new Date(timeStr).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch {
      return timeStr;
    }
  };

  const formatWind = (metar: MetarData): string => {
    if (!metar.wdir && !metar.wspd) return 'Calm';
    const dir = metar.wdir?.toString().padStart(3, '0') || 'VRB';
    const spd = metar.wspd || 0;
    const gust = metar.wgst ? `G${metar.wgst}` : '';
    return `${dir}@${spd}${gust}KT`;
  };

  const getClouds = (metar: MetarData): string => {
    if (!metar.cldCvg1) return 'CLR';
    return `${metar.cldCvg1}${metar.cldBas1 ? ` @ ${metar.cldBas1}ft` : ''}`;
  };

  if (airports.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Plane className="h-4 w-4" />
            METAR/TAF Weather
          </span>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                {formatTime(lastUpdated.toISOString())}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchWeatherData}
              disabled={loading}
              className="h-7"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start mb-3 h-auto flex-wrap">
            {airports.map((airport) => {
              const metar = metarData[airport.icao];
              const fc = metar ? getFlightCategory(metar) : null;
              return (
                <TabsTrigger
                  key={airport.icao}
                  value={airport.icao}
                  className="flex items-center gap-1.5"
                >
                  {fc && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: fc.color }}
                    />
                  )}
                  {airport.icao}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {airports.map((airport) => {
            const metar = metarData[airport.icao];
            const taf = tafData[airport.icao];
            const fc = metar ? getFlightCategory(metar) : null;

            return (
              <TabsContent key={airport.icao} value={airport.icao} className="mt-0">
                <div className="space-y-4">
                  {/* Airport Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{airport.icao}</h3>
                      <p className="text-sm text-muted-foreground">{airport.name}</p>
                    </div>
                    {fc && (
                      <Badge
                        style={{ backgroundColor: fc.color }}
                        className="text-white font-bold"
                      >
                        {fc.category}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Stats */}
                  {metar && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Wind className="h-4 w-4 text-blue-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Wind</div>
                          <div className="text-sm font-medium">{formatWind(metar)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Eye className="h-4 w-4 text-green-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Visibility</div>
                          <div className="text-sm font-medium">{metar.visib ?? '10'}+ SM</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Cloud className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Ceiling</div>
                          <div className="text-sm font-medium">{getClouds(metar)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-xs text-muted-foreground">Temp/Dew</div>
                          <div className="text-sm font-medium">
                            {metar.temp ?? '--'}/{metar.dewp ?? '--'}°C
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Raw METAR */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">Raw METAR</h4>
                      {metar?.obsTime && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(metar.obsTime)}
                        </span>
                      )}
                    </div>
                    <ScrollArea className="h-[60px]">
                      <div className="p-2 bg-muted/50 rounded-md font-mono text-xs break-all">
                        {metar?.rawOb || 'No METAR data available'}
                      </div>
                    </ScrollArea>

                    {/* Weather phenomena */}
                    {metar?.wxString && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Weather: {metar.wxString}</span>
                      </div>
                    )}
                  </div>

                  {/* Raw TAF */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">Raw TAF</h4>
                      {taf?.validTimeFrom && taf?.validTimeTo && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Valid: {formatTime(taf.validTimeFrom)} - {formatTime(taf.validTimeTo)}
                        </span>
                      )}
                    </div>
                    <ScrollArea className="h-[100px]">
                      <div className="p-2 bg-muted/50 rounded-md font-mono text-xs break-all whitespace-pre-wrap">
                        {taf?.rawTAF || 'No TAF data available'}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
};
