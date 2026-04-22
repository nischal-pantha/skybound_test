import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, RefreshCw, MapPin, Plane, Radio } from 'lucide-react';
import { useAutoWeatherRefresh, type NearestAirportWeather } from '@/hooks/useAutoWeatherRefresh';
import { useAppContext } from '@/contexts/AppContext';

// ATIS/AWOS frequencies for major US airports
const ATIS_FREQUENCIES: Record<string, { freq: string; type: 'ATIS' | 'AWOS' | 'ASOS' }> = {
  'KSFO': { freq: '118.85', type: 'ATIS' },
  'KLAX': { freq: '133.80', type: 'ATIS' },
  'KJFK': { freq: '128.72', type: 'ATIS' },
  'KORD': { freq: '135.40', type: 'ATIS' },
  'KATL': { freq: '125.55', type: 'ATIS' },
  'KDEN': { freq: '134.42', type: 'ATIS' },
  'KDFW': { freq: '134.90', type: 'ATIS' },
  'KMIA': { freq: '132.45', type: 'ATIS' },
  'KBOS': { freq: '127.87', type: 'ATIS' },
  'KSEA': { freq: '118.00', type: 'ATIS' },
  'KPHX': { freq: '120.95', type: 'ATIS' },
  'KMSP': { freq: '135.35', type: 'ATIS' },
  'KDTW': { freq: '135.00', type: 'ATIS' },
  'KLAS': { freq: '132.40', type: 'ATIS' },
  'KSAN': { freq: '134.80', type: 'ATIS' },
  'KSNA': { freq: '126.00', type: 'ATIS' },
  'KSJC': { freq: '114.10', type: 'ATIS' },
  'KOAK': { freq: '128.50', type: 'ATIS' },
  'KSMF': { freq: '125.70', type: 'ATIS' },
  'KPDX': { freq: '128.35', type: 'ATIS' },
  'KMCO': { freq: '124.80', type: 'ATIS' },
  'KFLL': { freq: '135.00', type: 'ATIS' },
  'KTPA': { freq: '127.50', type: 'ATIS' },
  'KIAD': { freq: '134.85', type: 'ATIS' },
  'KDCA': { freq: '132.65', type: 'ATIS' },
  'KBWI': { freq: '115.10', type: 'ATIS' },
  'KEWR': { freq: '115.10', type: 'ATIS' },
  'KLGA': { freq: '125.95', type: 'ATIS' },
  'KPHL': { freq: '133.40', type: 'ATIS' },
  'KCLT': { freq: '127.55', type: 'ATIS' },
  'KSLC': { freq: '124.75', type: 'ATIS' },
  'KABQ': { freq: '127.20', type: 'ATIS' },
  'KAUS': { freq: '132.95', type: 'ATIS' },
  'KSAT': { freq: '125.80', type: 'ATIS' },
  'KIAH': { freq: '131.45', type: 'ATIS' },
  'KHOU': { freq: '117.40', type: 'ATIS' },
  'KMSY': { freq: '128.45', type: 'ATIS' },
  'KBNA': { freq: '118.70', type: 'ATIS' },
  'KSTL': { freq: '125.07', type: 'ATIS' },
  'KMCI': { freq: '128.35', type: 'ATIS' },
  'KPIT': { freq: '127.25', type: 'ATIS' },
  'KCLE': { freq: '127.85', type: 'ATIS' },
  'KPAO': { freq: '125.60', type: 'AWOS' },
  'KSQL': { freq: '127.85', type: 'AWOS' },
  'KRHV': { freq: '124.60', type: 'AWOS' },
  'KLVK': { freq: '126.10', type: 'ATIS' },
  'KCCR': { freq: '124.20', type: 'ATIS' },
  'KHAF': { freq: '134.50', type: 'AWOS' },
  'KCOS': { freq: '128.37', type: 'ATIS' },
  'KONT': { freq: '127.75', type: 'ATIS' },
  'KBUR': { freq: '113.60', type: 'ATIS' },
  'KVNY': { freq: '118.45', type: 'ATIS' },
  'KSMO': { freq: '119.15', type: 'ATIS' },
};

const flightCatColor = (metar: string) => {
  if (!metar) return 'bg-muted text-muted-foreground';
  const vis = metar.match(/(\d+)SM/);
  const visMi = vis ? parseInt(vis[1]) : 10;
  if (visMi < 1) return 'bg-purple-600 text-white';
  if (visMi < 3) return 'bg-red-600 text-white';
  if (visMi < 5) return 'bg-blue-600 text-white';
  return 'bg-green-600 text-white';
};

const formatAge = (ts: number) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.round(mins / 60)}h ago`;
};

export const AutoWeatherRefreshPanel = () => {
  const { nearestWeather, isRefreshing, enabled, setEnabled } = useAutoWeatherRefresh();
  const { isGPSTracking } = useAppContext();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Navigation className="h-4 w-4 text-primary" />
          Auto ATIS / Weather
          {isRefreshing && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
          <div className="ml-auto flex items-center gap-2">
            <Label className="text-xs">Auto</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {isGPSTracking
            ? 'Fetches weather for nearest airports as you fly (every 5nm / 2min)'
            : 'Start GPS tracking to enable automatic weather refresh'}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {!isGPSTracking && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
            <Plane className="h-3.5 w-3.5" />
            GPS tracking is not active
          </div>
        )}

        {nearestWeather.length === 0 && isGPSTracking && (
          <div className="text-xs text-muted-foreground text-center py-3">
            Waiting for position change to fetch weather…
          </div>
        )}

        {nearestWeather.map((nw) => {
          const atis = ATIS_FREQUENCIES[nw.icao];
          return (
            <div key={nw.icao} className="rounded-lg border bg-card p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="font-bold text-sm">{nw.icao}</span>
                <Badge variant="secondary" className="text-[10px]">{nw.distance} nm</Badge>
                <Badge className={`text-[10px] ml-auto ${flightCatColor(nw.rawMetar)}`}>
                  {nw.rawMetar ? 'LIVE' : 'N/A'}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{formatAge(nw.fetchedAt)}</span>
              </div>

              {/* ATIS Frequency */}
              {atis && (
                <div className="flex items-center gap-2 bg-primary/5 rounded px-2 py-1">
                  <Radio className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">{atis.type}</span>
                  <span className="text-sm font-mono font-bold">{atis.freq}</span>
                </div>
              )}

              {nw.rawMetar && (
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">METAR</div>
                  <div className="text-xs font-mono break-all">{nw.rawMetar}</div>
                </div>
              )}

              {nw.rawTaf && (
                <div className="bg-muted/50 rounded p-2">
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">TAF</div>
                  <div className="text-xs font-mono break-all">{nw.rawTaf}</div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
