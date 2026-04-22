import { useCallback, useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Snowflake, Wind } from 'lucide-react';

interface PIREP {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  type: 'UA' | 'UUA'; // Urgent or routine
  reportTime: string;
  aircraft?: string;
  icingIntensity?: 'NEG' | 'TRACE' | 'LGT' | 'MOD' | 'SEV';
  icingType?: string;
  icingBase?: number;
  icingTop?: number;
  turbIntensity?: 'NEG' | 'LGT' | 'MOD' | 'SEV' | 'EXTRM';
  turbType?: string;
  turbBase?: number;
  turbTop?: number;
  rawText: string;
  remarks?: string;
}

interface PIREPsOverlayProps {
  map: L.Map | null;
  bounds?: L.LatLngBounds;
  showIcing: boolean;
  showTurbulence: boolean;
  onToggleIcing: (show: boolean) => void;
  onToggleTurbulence: (show: boolean) => void;
}

const ICING_COLORS: Record<string, string> = {
  'NEG': '#22c55e',
  'TRACE': '#60a5fa',
  'LGT': '#3b82f6',
  'MOD': '#f59e0b',
  'SEV': '#ef4444',
};

const TURB_COLORS: Record<string, string> = {
  'NEG': '#22c55e',
  'LGT': '#60a5fa',
  'MOD': '#f59e0b',
  'SEV': '#ef4444',
  'EXTRM': '#9333ea',
};

const getIcingLabel = (intensity: string): string => {
  switch (intensity) {
    case 'NEG': return 'None';
    case 'TRACE': return 'Trace';
    case 'LGT': return 'Light';
    case 'MOD': return 'Moderate';
    case 'SEV': return 'Severe';
    default: return intensity;
  }
};

const getTurbLabel = (intensity: string): string => {
  switch (intensity) {
    case 'NEG': return 'None';
    case 'LGT': return 'Light';
    case 'MOD': return 'Moderate';
    case 'SEV': return 'Severe';
    case 'EXTRM': return 'Extreme';
    default: return intensity;
  }
};

export const usePIREPsOverlay = ({
  map,
  bounds,
  showIcing,
  showTurbulence,
}: Omit<PIREPsOverlayProps, 'onToggleIcing' | 'onToggleTurbulence'>) => {
  const [pireps, setPireps] = useState<PIREP[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const icingLayerRef = useRef<L.LayerGroup | null>(null);
  const turbLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch real PIREPs from AviationWeather.gov via edge function proxy
  const fetchPIREPs = useCallback(async () => {
    if (!bounds) return;

    setLoading(true);
    try {
      const north = bounds.getNorth();
      const south = bounds.getSouth();
      const east = bounds.getEast();
      const west = bounds.getWest();
      const bbox = `${west.toFixed(2)},${south.toFixed(2)},${east.toFixed(2)},${north.toFixed(2)}`;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(
        `${supabaseUrl}/functions/v1/aviation-weather?type=pirep&bbox=${encodeURIComponent(bbox)}&age=2`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const parsed: PIREP[] = data.map((p: any, i: number) => {
            const pirep: PIREP = {
              id: `pirep-${i}-${p.obsTime || Date.now()}`,
              lat: p.lat || 0,
              lng: p.lon || 0,
              altitude: (p.fltlvl || 0) * 100,
              type: p.pirepType === 'UUA' ? 'UUA' : 'UA',
              reportTime: p.obsTime ? new Date(p.obsTime * 1000).toISOString() : new Date().toISOString(),
              aircraft: p.acType || p.aircraft || undefined,
              rawText: p.rawOb || p.rawText || '',
              remarks: p.rawOb || '',
            };

            // Parse icing
            if (p.icgInt1 || p.iceType) {
              const icingMap: Record<number, PIREP['icingIntensity']> = { 0: 'NEG', 1: 'TRACE', 2: 'LGT', 3: 'MOD', 4: 'SEV', 5: 'SEV', 8: 'SEV' };
              pirep.icingIntensity = icingMap[p.icgInt1] || (p.iceIntensity as any) || 'LGT';
              pirep.icingType = p.icgType1 || p.iceType || '';
              pirep.icingBase = p.icgBase1 ? p.icgBase1 * 100 : pirep.altitude - 1000;
              pirep.icingTop = p.icgTop1 ? p.icgTop1 * 100 : pirep.altitude + 2000;
            }

            // Parse turbulence
            if (p.tbInt1 || p.turbType) {
              const turbMap: Record<number, PIREP['turbIntensity']> = { 0: 'NEG', 1: 'LGT', 2: 'LGT', 3: 'MOD', 4: 'MOD', 5: 'SEV', 6: 'SEV', 7: 'EXTRM', 8: 'EXTRM' };
              pirep.turbIntensity = turbMap[p.tbInt1] || (p.turbIntensity as any) || 'LGT';
              pirep.turbType = p.tbType1 || p.turbType || 'CAT';
              pirep.turbBase = p.tbBase1 ? p.tbBase1 * 100 : pirep.altitude - 2000;
              pirep.turbTop = p.tbTop1 ? p.tbTop1 * 100 : pirep.altitude + 2000;
            }

            return pirep;
          }).filter((p: PIREP) => p.lat !== 0 && p.lng !== 0);

          setPireps(parsed);
          console.log('[PIREPs] Loaded', parsed.length, 'real PIREPs from API');
          return;
        }
      }

      // If no real data, show empty
      setPireps([]);
      console.log('[PIREPs] No PIREPs found in current area');
    } catch (error) {
      console.error('[PIREPs] Failed to fetch:', error);
      setPireps([]);
    } finally {
      setLoading(false);
    }
  }, [bounds]);

  // Initialize layer groups
  useEffect(() => {
    if (!map) return;

    if (!icingLayerRef.current) {
      icingLayerRef.current = L.layerGroup().addTo(map);
    }
    if (!turbLayerRef.current) {
      turbLayerRef.current = L.layerGroup().addTo(map);
    }

    return () => {
      if (icingLayerRef.current) {
        map.removeLayer(icingLayerRef.current);
        icingLayerRef.current = null;
      }
      if (turbLayerRef.current) {
        map.removeLayer(turbLayerRef.current);
        turbLayerRef.current = null;
      }
    };
  }, [map]);

  // Fetch PIREPs when bounds change
  useEffect(() => {
    if (map && bounds) {
      fetchPIREPs();
    }
  }, [map, bounds, fetchPIREPs]);

  // Render icing overlay
  useEffect(() => {
    if (!icingLayerRef.current || !map) return;

    icingLayerRef.current.clearLayers();

    if (!showIcing) return;

    pireps.filter(p => p.icingIntensity && p.icingIntensity !== 'NEG').forEach((pirep) => {
      const color = ICING_COLORS[pirep.icingIntensity || 'LGT'];
      const size = pirep.icingIntensity === 'SEV' ? 28 : pirep.icingIntensity === 'MOD' ? 24 : 20;

      const icon = L.divIcon({
        className: 'pirep-icing-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 2px solid white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            transform: rotate(45deg);
          ">
            <svg viewBox="0 0 24 24" width="${size * 0.5}" height="${size * 0.5}" fill="white" style="transform: rotate(-45deg);">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93H13v-.93zM13 7h5.24c.25.31.48.65.68 1H13V7zm0 3h6.74c.08.33.15.66.19 1H13v-1zm0 9.93V19h2.87c-.87.48-1.84.8-2.87.93zM18.24 17H13v-1h5.92c-.2.35-.43.69-.68 1zm1.5-3H13v-1h6.93c-.04.34-.11.67-.19 1z"/>
            </svg>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([pirep.lat, pirep.lng], { icon });
      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span style="background: ${color}; padding: 2px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 11px;">
              ICING: ${getIcingLabel(pirep.icingIntensity || '')}
            </span>
            ${pirep.type === 'UUA' ? '<span class="text-red-600 font-bold text-xs">URGENT</span>' : ''}
          </div>
          <div class="text-xs space-y-1.5">
            <div><strong>Type:</strong> ${pirep.icingType || 'Unknown'}</div>
            <div><strong>Altitude:</strong> FL${Math.floor(pirep.altitude / 100)} (${pirep.altitude.toLocaleString()} ft)</div>
            ${pirep.icingBase && pirep.icingTop ? `<div><strong>Layer:</strong> FL${Math.floor(pirep.icingBase / 100)} - FL${Math.floor(pirep.icingTop / 100)}</div>` : ''}
            <div><strong>Aircraft:</strong> ${pirep.aircraft || 'Unknown'}</div>
            <div><strong>Time:</strong> ${new Date(pirep.reportTime).toLocaleTimeString()}</div>
            <hr class="my-2 border-border" />
            <div class="font-mono text-[10px] bg-muted/50 p-1 rounded break-all">${pirep.rawText}</div>
          </div>
        </div>
      `);

      icingLayerRef.current?.addLayer(marker);
    });
  }, [map, pireps, showIcing]);

  // Render turbulence overlay
  useEffect(() => {
    if (!turbLayerRef.current || !map) return;

    turbLayerRef.current.clearLayers();

    if (!showTurbulence) return;

    pireps.filter(p => p.turbIntensity && p.turbIntensity !== 'NEG').forEach((pirep) => {
      const color = TURB_COLORS[pirep.turbIntensity || 'LGT'];
      const size = pirep.turbIntensity === 'EXTRM' ? 30 : pirep.turbIntensity === 'SEV' ? 26 : pirep.turbIntensity === 'MOD' ? 22 : 18;

      const icon = L.divIcon({
        className: 'pirep-turb-marker',
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.4);
            ${pirep.turbIntensity === 'SEV' || pirep.turbIntensity === 'EXTRM' ? 'animation: pulse 1.5s ease-in-out infinite;' : ''}
          ">
            <svg viewBox="0 0 24 24" width="${size * 0.55}" height="${size * 0.55}" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
            </svg>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([pirep.lat, pirep.lng], { icon });
      marker.bindPopup(`
        <div class="p-3 min-w-[200px]">
          <div class="flex items-center gap-2 mb-2">
            <span style="background: ${color}; padding: 2px 8px; border-radius: 4px; color: white; font-weight: bold; font-size: 11px;">
              TURB: ${getTurbLabel(pirep.turbIntensity || '')}
            </span>
            ${pirep.type === 'UUA' ? '<span class="text-red-600 font-bold text-xs">URGENT</span>' : ''}
          </div>
          <div class="text-xs space-y-1.5">
            <div><strong>Type:</strong> ${pirep.turbType || 'Unknown'}</div>
            <div><strong>Altitude:</strong> FL${Math.floor(pirep.altitude / 100)} (${pirep.altitude.toLocaleString()} ft)</div>
            ${pirep.turbBase && pirep.turbTop ? `<div><strong>Layer:</strong> FL${Math.floor(pirep.turbBase / 100)} - FL${Math.floor(pirep.turbTop / 100)}</div>` : ''}
            <div><strong>Aircraft:</strong> ${pirep.aircraft || 'Unknown'}</div>
            <div><strong>Time:</strong> ${new Date(pirep.reportTime).toLocaleTimeString()}</div>
            <hr class="my-2 border-border" />
            <div class="font-mono text-[10px] bg-muted/50 p-1 rounded break-all">${pirep.rawText}</div>
          </div>
        </div>
      `);

      turbLayerRef.current?.addLayer(marker);
    });
  }, [map, pireps, showTurbulence]);

  return {
    pireps,
    loading,
    icingCount: pireps.filter(p => p.icingIntensity && p.icingIntensity !== 'NEG').length,
    turbCount: pireps.filter(p => p.turbIntensity && p.turbIntensity !== 'NEG').length,
    refresh: fetchPIREPs,
  };
};

// Control component for PIREPs toggles
export const PIREPsControls = ({
  showIcing,
  showTurbulence,
  onToggleIcing,
  onToggleTurbulence,
  icingCount,
  turbCount,
}: {
  showIcing: boolean;
  showTurbulence: boolean;
  onToggleIcing: (show: boolean) => void;
  onToggleTurbulence: (show: boolean) => void;
  icingCount: number;
  turbCount: number;
}) => {
  return (
    <>
      <div className="flex items-center gap-2">
        <Switch
          id="icing-toggle"
          checked={showIcing}
          onCheckedChange={onToggleIcing}
        />
        <Label htmlFor="icing-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Snowflake className="h-4 w-4 text-blue-400" />
          Icing PIREPs
          <span className="text-xs text-muted-foreground">({icingCount})</span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="turb-toggle"
          checked={showTurbulence}
          onCheckedChange={onToggleTurbulence}
        />
        <Label htmlFor="turb-toggle" className="flex items-center gap-1.5 text-sm cursor-pointer">
          <Wind className="h-4 w-4 text-amber-500" />
          Turbulence PIREPs
          <span className="text-xs text-muted-foreground">({turbCount})</span>
        </Label>
      </div>
    </>
  );
};

// Legend component for PIREPs
export const PIREPsLegend = ({ showIcing, showTurbulence }: { showIcing: boolean; showTurbulence: boolean }) => {
  if (!showIcing && !showTurbulence) return null;

  return (
    <>
      {showIcing && (
        <div className="border-t pt-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
            <Snowflake className="h-3 w-3 text-blue-400" />
            Icing PIREPs
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: ICING_COLORS.TRACE, transform: 'rotate(45deg)' }}></div>
              <span className="text-xs">Trace</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: ICING_COLORS.LGT, transform: 'rotate(45deg)' }}></div>
              <span className="text-xs">Light</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: ICING_COLORS.MOD, transform: 'rotate(45deg)' }}></div>
              <span className="text-xs">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: ICING_COLORS.SEV, transform: 'rotate(45deg)' }}></div>
              <span className="text-xs font-medium text-red-600">Severe</span>
            </div>
          </div>
        </div>
      )}
      {showTurbulence && (
        <div className="border-t pt-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
            <Wind className="h-3 w-3 text-amber-500" />
            Turbulence PIREPs
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TURB_COLORS.LGT }}></div>
              <span className="text-xs">Light</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TURB_COLORS.MOD }}></div>
              <span className="text-xs">Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TURB_COLORS.SEV }}></div>
              <span className="text-xs font-medium text-red-600">Severe</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: TURB_COLORS.EXTRM }}></div>
              <span className="text-xs font-medium text-purple-600">Extreme</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
