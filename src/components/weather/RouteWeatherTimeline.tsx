import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Waypoint {
  id: string;
  identifier: string;
  coordinates: [number, number];
}

interface HourForecast {
  hour: number; // offset from now
  time: string;
  condition: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  visibility: number;
  ceiling: number | null;
  windSpeed: number;
  windDir: number;
  windGust: number | null;
  precipProb: number;
  weatherCode: number;
}

interface WaypointTimeline {
  waypointId: string;
  identifier: string;
  forecasts: HourForecast[];
  trend: 'improving' | 'deteriorating' | 'stable';
  worstCondition: string;
  worstHour: number;
}

const CATEGORY_CLASSES: Record<'VFR' | 'MVFR' | 'IFR' | 'LIFR', string> = {
  VFR: 'bg-emerald-500',
  MVFR: 'bg-blue-500',
  IFR: 'bg-red-500',
  LIFR: 'bg-purple-500',
};

const CATEGORY_TEXT_CLASSES: Record<'VFR' | 'MVFR' | 'IFR' | 'LIFR', string> = {
  VFR: 'text-emerald-500',
  MVFR: 'text-blue-500',
  IFR: 'text-red-500',
  LIFR: 'text-purple-500',
};

const CATEGORY_RANK: Record<string, number> = {
  VFR: 0, MVFR: 1, IFR: 2, LIFR: 3,
};

function categorizeFromForecast(visSM: number, ceilingFt: number | null): 'VFR' | 'MVFR' | 'IFR' | 'LIFR' {
  const ceil = ceilingFt ?? 99999;
  if (visSM < 1 || ceil < 500) return 'LIFR';
  if (visSM < 3 || ceil < 1000) return 'IFR';
  if (visSM <= 5 || ceil <= 3000) return 'MVFR';
  return 'VFR';
}

function weatherCodeToDesc(code: number): string {
  if (code === 0) return '';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Fog';
  if (code <= 59) return 'Drizzle';
  if (code <= 69) return 'Rain';
  if (code <= 79) return 'Snow';
  if (code <= 82) return 'Rain showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return '';
}

function weatherCodeToCeiling(code: number): number | null {
  // Approximate ceilings from weather codes
  if (code === 0) return null; // clear
  if (code <= 2) return null; // mostly clear
  if (code === 3) return 5000; // overcast
  if (code <= 49) return 200; // fog
  if (code <= 59) return 2000; // drizzle
  if (code <= 69) return 1500; // rain
  if (code <= 79) return 1000; // snow
  if (code <= 86) return 2500; // showers
  if (code <= 99) return 800; // thunderstorm
  return null;
}

interface RouteWeatherTimelineProps {
  waypoints: Waypoint[];
}

export const RouteWeatherTimeline = ({ waypoints }: RouteWeatherTimelineProps) => {
  const [timelines, setTimelines] = useState<WaypointTimeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchForecasts = useCallback(async () => {
    if (waypoints.length === 0) return;
    setLoading(true);
    try {
      const results: WaypointTimeline[] = [];

      for (const wp of waypoints) {
        const [lng, lat] = wp.coordinates;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,weather_code&forecast_hours=7&timezone=auto`
        );
        if (!res.ok) continue;
        const data = await res.json();
        const hourly = data.hourly;
        if (!hourly) continue;

        const forecasts: HourForecast[] = [];
        const count = Math.min(7, hourly.time?.length || 0);
        for (let i = 0; i < count; i++) {
          const visMeter = hourly.visibility?.[i] ?? 16000;
          const visSM = Math.round((visMeter / 1609.34) * 10) / 10;
          const wCode = hourly.weather_code?.[i] ?? 0;
          const ceiling = weatherCodeToCeiling(wCode);
          const condition = categorizeFromForecast(visSM, ceiling);
          const windKt = Math.round((hourly.wind_speed_10m?.[i] ?? 0) * 0.539957);
          const gustKt = hourly.wind_gusts_10m?.[i] ? Math.round(hourly.wind_gusts_10m[i] * 0.539957) : null;

          forecasts.push({
            hour: i,
            time: hourly.time[i],
            condition,
            visibility: visSM,
            ceiling,
            windSpeed: windKt,
            windDir: Math.round(hourly.wind_direction_10m?.[i] ?? 0),
            windGust: gustKt,
            precipProb: hourly.precipitation_probability?.[i] ?? 0,
            weatherCode: wCode,
          });
        }

        // Determine trend
        const firstRank = CATEGORY_RANK[forecasts[0]?.condition || 'VFR'];
        const lastRank = CATEGORY_RANK[forecasts[forecasts.length - 1]?.condition || 'VFR'];
        const trend = lastRank > firstRank ? 'deteriorating' : lastRank < firstRank ? 'improving' : 'stable';

        // Worst condition
        let worstIdx = 0;
        let worstRank = 0;
        forecasts.forEach((f, i) => {
          const r = CATEGORY_RANK[f.condition];
          if (r > worstRank) { worstRank = r; worstIdx = i; }
        });

        results.push({
          waypointId: wp.id,
          identifier: wp.identifier,
          forecasts,
          trend,
          worstCondition: forecasts[worstIdx]?.condition || 'VFR',
          worstHour: worstIdx,
        });
      }

      setTimelines(results);
    } catch (err) {
      console.warn('[RouteTimeline] Forecast fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [waypoints]);

  useEffect(() => {
    if (waypoints.length >= 2) fetchForecasts();
  }, [waypoints.length, fetchForecasts]);

  if (waypoints.length < 2) return null;

  const trendIcon = (trend: string) => {
    if (trend === 'improving') return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (trend === 'deteriorating') return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const hasWarning = timelines.some(t => CATEGORY_RANK[t.worstCondition] >= 2);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div className="bg-muted/30 rounded-lg border">
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-primary" />
              Route Weather Timeline (6h)
              {hasWarning && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
              {loading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={(e) => { e.stopPropagation(); fetchForecasts(); }}>
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Timeline grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-1 text-muted-foreground font-medium sticky left-0 bg-muted/30 z-10 min-w-[60px]">WPT</th>
                    {timelines[0]?.forecasts.map((f, i) => (
                      <th key={i} className="p-1 text-muted-foreground font-medium text-center min-w-[56px]">
                        {i === 0 ? 'Now' : `+${i}h`}
                      </th>
                    ))}
                    <th className="p-1 text-muted-foreground font-medium text-center min-w-[50px]">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {timelines.map((tl) => (
                    <tr key={tl.waypointId} className="border-t border-border/30">
                      <td className="p-1 font-mono font-bold sticky left-0 bg-muted/30 z-10">{tl.identifier}</td>
                      {tl.forecasts.map((f, i) => {
                        const wxDesc = weatherCodeToDesc(f.weatherCode);
                        return (
                          <td key={i} className="p-1 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-white font-bold text-[10px] ${CATEGORY_CLASSES[f.condition]}`}
                                title={`${f.visibility}SM, ${f.ceiling ? f.ceiling + 'ft' : 'CLR'}, ${f.windSpeed}kt${f.windGust ? ' G' + f.windGust : ''}`}
                              >
                                {f.condition}
                              </span>
                              <span className="text-[9px] text-muted-foreground">{f.visibility}SM</span>
                              {f.precipProb > 30 && (
                                <span className="text-[9px] text-blue-400">{f.precipProb}%</span>
                              )}
                              {wxDesc && (
                                <span className="text-[8px] text-amber-400 truncate max-w-[52px]">{wxDesc}</span>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {trendIcon(tl.trend)}
                          <span className="text-[10px] capitalize">{tl.trend}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {timelines.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30 text-xs">
                {timelines.filter(t => CATEGORY_RANK[t.worstCondition] >= 2).map(t => (
                  <div key={t.waypointId} className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-destructive" />
                    <span className="font-medium">{t.identifier}</span>
                    <span className={CATEGORY_TEXT_CLASSES[t.worstCondition]}>{t.worstCondition}</span>
                    <span className="text-muted-foreground">at +{t.worstHour}h</span>
                  </div>
                ))}
                {!hasWarning && (
                  <span className="text-green-500 font-medium">✓ VFR/MVFR conditions expected along route for next 6h</span>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
