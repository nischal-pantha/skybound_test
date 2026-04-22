import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Satellite, Eye, Globe } from 'lucide-react';

type SatelliteChannel = 'visible' | 'infrared' | 'water-vapor';
type SatelliteSource = 'east' | 'west' | 'auto';

interface SatelliteOverlayProps {
  map: L.Map | null;
  show: boolean;
  channel: SatelliteChannel;
  opacity: number;
  source?: SatelliteSource;
}

// Real-time GOES-16 (East) satellite imagery via Iowa State Mesonet
const GOES_EAST_URLS: Record<SatelliteChannel, string> = {
  'visible': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-vis-1km-900913/{z}/{x}/{y}.png',
  'infrared': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-ir-4km-900913/{z}/{x}/{y}.png',
  'water-vapor': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-east-wv-4km-900913/{z}/{x}/{y}.png',
};

// Real-time GOES-17/18 (West) satellite imagery
const GOES_WEST_URLS: Record<SatelliteChannel, string> = {
  'visible': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-vis-1km-900913/{z}/{x}/{y}.png',
  'infrared': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-ir-4km-900913/{z}/{x}/{y}.png',
  'water-vapor': 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/goes-west-wv-4km-900913/{z}/{x}/{y}.png',
};

// Longitude threshold: west of -105° uses GOES-West in auto mode
const AUTO_WEST_THRESHOLD = -105;

function resolveSource(source: SatelliteSource, map: L.Map | null): 'east' | 'west' {
  if (source !== 'auto') return source;
  if (!map) return 'east';
  const centerLng = map.getCenter().lng;
  return centerLng < AUTO_WEST_THRESHOLD ? 'west' : 'east';
}

export const useSatelliteOverlay = ({ map, show, channel, opacity, source = 'auto' }: SatelliteOverlayProps) => {
  const layerRef = useRef<L.TileLayer | null>(null);
  const [loading, setLoading] = useState(false);
  const [resolvedSource, setResolvedSource] = useState<'east' | 'west'>('east');

  // Track map movement to auto-switch source
  useEffect(() => {
    if (!map || source !== 'auto') return;
    const onMoveEnd = () => {
      setResolvedSource(resolveSource('auto', map));
    };
    onMoveEnd(); // initial
    map.on('moveend', onMoveEnd);
    return () => { map.off('moveend', onMoveEnd); };
  }, [map, source]);

  // Update resolved source when manual
  useEffect(() => {
    if (source !== 'auto') setResolvedSource(source);
  }, [source]);

  useEffect(() => {
    if (!map) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    if (!show) return;

    setLoading(true);

    try {
      const urls = resolvedSource === 'west' ? GOES_WEST_URLS : GOES_EAST_URLS;
      const url = urls[channel];
      const cacheBuster = Math.floor(Date.now() / 300000);

      const layer = L.tileLayer(`${url}?cb=${cacheBuster}`, {
        opacity,
        maxZoom: 12,
        minZoom: 3,
        attribution: `&copy; Iowa State Mesonet / NOAA GOES-${resolvedSource === 'west' ? '18' : '16'}`,
        errorTileUrl: '',
      });

      layer.on('load', () => setLoading(false));
      layer.on('tileerror', () => {
        console.warn(`[Satellite] Tile error for ${channel} (${resolvedSource})`);
      });

      layer.addTo(map);
      layerRef.current = layer;
    } catch (error) {
      console.error('[Satellite] Failed to add layer:', error);
      setLoading(false);
    }

    return () => {
      if (layerRef.current && map) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, show, channel, resolvedSource]);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(opacity);
    }
  }, [opacity]);

  return { loading, resolvedSource };
};

// Control component
export const SatelliteControls = ({
  show,
  onToggle,
  channel,
  onChannelChange,
  opacity,
  onOpacityChange,
  loading,
  source,
  onSourceChange,
  resolvedSource,
}: {
  show: boolean;
  onToggle: (show: boolean) => void;
  channel: SatelliteChannel;
  onChannelChange: (channel: SatelliteChannel) => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
  loading: boolean;
  source?: SatelliteSource;
  onSourceChange?: (source: SatelliteSource) => void;
  resolvedSource?: 'east' | 'west';
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <Switch id="satellite-toggle" checked={show} onCheckedChange={onToggle} />
      <Label htmlFor="satellite-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
        <Satellite className="h-4 w-4 text-cyan-500" />
        Satellite Imagery
        {loading && <span className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
      </Label>
    </div>
    {show && (
      <div className="ml-6 space-y-2">
        <Select value={channel} onValueChange={(v) => onChannelChange(v as SatelliteChannel)}>
          <SelectTrigger className="h-8 text-xs w-[160px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="visible">Visible (Day)</SelectItem>
            <SelectItem value="infrared">Infrared (IR)</SelectItem>
            <SelectItem value="water-vapor">Water Vapor</SelectItem>
          </SelectContent>
        </Select>
        {/* GOES Source Selector */}
        {onSourceChange && (
          <Select value={source || 'auto'} onValueChange={(v) => onSourceChange(v as SatelliteSource)}>
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <Globe className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (by position)</SelectItem>
              <SelectItem value="east">GOES-East (16)</SelectItem>
              <SelectItem value="west">GOES-West (18)</SelectItem>
            </SelectContent>
          </Select>
        )}
        {resolvedSource && (
          <div className="text-[10px] text-muted-foreground">
            Active: GOES-{resolvedSource === 'west' ? 'West (18)' : 'East (16)'}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Eye className="h-3 w-3 text-muted-foreground" />
          <Slider
            value={[opacity]}
            onValueChange={([v]) => onOpacityChange(v)}
            min={0.1}
            max={1}
            step={0.05}
            className="w-24"
          />
          <span className="text-[10px] text-muted-foreground w-8">{Math.round(opacity * 100)}%</span>
        </div>
      </div>
    )}
  </div>
);

export const SatelliteLegend = ({ show, channel, resolvedSource }: { show: boolean; channel: SatelliteChannel; resolvedSource?: 'east' | 'west' }) => {
  if (!show) return null;

  const channelInfo: Record<SatelliteChannel, { label: string; description: string }> = {
    'visible': { label: 'Visible (Band 2)', description: 'Daytime cloud patterns & fog' },
    'infrared': { label: 'Infrared (Band 13)', description: 'Cloud top temperatures – brighter = colder/higher clouds' },
    'water-vapor': { label: 'Water Vapor (Band 8)', description: 'Upper-level moisture – brighter = more moisture' },
  };

  const info = channelInfo[channel];
  const satName = resolvedSource === 'west' ? 'GOES-18 (West)' : 'GOES-16 (East)';

  return (
    <div className="border-t pt-3">
      <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
        <Satellite className="h-3 w-3 text-cyan-500" />
        {satName} {info.label}
      </div>
      <p className="text-[10px] text-muted-foreground">{info.description}</p>
      {channel === 'infrared' && (
        <div className="mt-2 flex gap-0.5">
          {['#000', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#ff6b6b', '#ffd93d', '#fff'].map((c, i) => (
            <div key={i} className="h-2 flex-1 rounded-sm" style={{ backgroundColor: c }} />
          ))}
        </div>
      )}
    </div>
  );
};
