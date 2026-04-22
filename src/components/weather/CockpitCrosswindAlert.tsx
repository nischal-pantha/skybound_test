import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Volume2, VolumeX, Shield } from 'lucide-react';
import { evaluateCrosswindWarnings, type CrosswindWarning } from '@/utils/windComponents';
import { useAppContext } from '@/contexts/AppContext';

interface CockpitCrosswindAlertProps {
  waypoints: Array<{ identifier: string; windDir: number; windSpeed: number }>;
  aircraftName: string;
}

// Audio generation using Web Audio API (no external files needed)
const createAudioContext = () => {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
};

const playWarningTone = (ctx: AudioContext, type: 'caution' | 'warning' | 'exceeded') => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'exceeded') {
    // Rapid high-pitch triple beep (like GPWS)
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.27);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.30);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } else if (type === 'warning') {
    // Double mid-pitch beep
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.45);
  } else {
    // Single low chime
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);
  }
};

export const CockpitCrosswindAlert = ({ waypoints, aircraftName }: CockpitCrosswindAlertProps) => {
  const { isGPSTracking } = useAppContext();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastAlertRef = useRef<string>('');
  const lastAlertTimeRef = useRef<number>(0);

  const warnings = useMemo(
    () => evaluateCrosswindWarnings(waypoints, aircraftName),
    [waypoints, aircraftName]
  );

  const activeWarnings = useMemo(
    () => warnings.filter(w => (w.severity === 'warning' || w.severity === 'exceeded') && !dismissed.has(w.identifier)),
    [warnings, dismissed]
  );

  // Play audio alerts when GPS tracking and warnings change
  useEffect(() => {
    if (!isGPSTracking || !alertsEnabled || !audioEnabled || activeWarnings.length === 0) return;

    const worst = activeWarnings.reduce((a, b) => (b.percentage > a.percentage ? b : a), activeWarnings[0]);
    const alertKey = `${worst.identifier}-${worst.severity}`;
    const now = Date.now();

    // Don't repeat same alert within 30 seconds
    if (alertKey === lastAlertRef.current && now - lastAlertTimeRef.current < 30000) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = createAudioContext();
    }

    if (audioCtxRef.current) {
      const tone = worst.severity === 'exceeded' ? 'exceeded' : 'warning';
      playWarningTone(audioCtxRef.current, tone);
      lastAlertRef.current = alertKey;
      lastAlertTimeRef.current = now;
    }
  }, [activeWarnings, isGPSTracking, alertsEnabled, audioEnabled]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  const handleDismiss = useCallback((identifier: string) => {
    setDismissed(prev => new Set([...prev, identifier]));
  }, []);

  if (!isGPSTracking || !alertsEnabled) {
    // Compact toggle when not tracking
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/30">
        <Shield className="h-4 w-4 text-muted-foreground" />
        <Label className="text-xs text-muted-foreground flex-1">Cockpit Crosswind Alerts</Label>
        <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Controls */}
      <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium flex-1">Cockpit Alerts</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setAudioEnabled(!audioEnabled)}
        >
          {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />}
        </Button>
        <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
      </div>

      {/* Active warnings overlay */}
      {activeWarnings.map(w => (
        <div
          key={w.identifier}
          className={`relative overflow-hidden rounded-lg border-2 p-3 animate-pulse ${
            w.severity === 'exceeded'
              ? 'border-destructive bg-destructive/10'
              : 'border-orange-500 bg-orange-500/10'
          }`}
        >
          {/* Flashing stripe for exceeded */}
          {w.severity === 'exceeded' && (
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-destructive/15 to-destructive/5 animate-pulse" />
          )}
          <div className="relative flex items-start gap-2">
            <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${
              w.severity === 'exceeded' ? 'text-destructive' : 'text-orange-500'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {w.severity === 'exceeded' ? 'CROSSWIND LIMIT EXCEEDED' : 'CROSSWIND WARNING'}
                </span>
                <Badge variant={w.severity === 'exceeded' ? 'destructive' : 'outline'} className="text-[10px] px-1.5">
                  {w.identifier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {w.crosswindAbs}kt from {w.crosswindDir} on {w.runway} — {w.percentage}% of {w.limit}kt limit
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2 shrink-0"
              onClick={() => handleDismiss(w.identifier)}
            >
              ACK
            </Button>
          </div>
        </div>
      ))}

      {activeWarnings.length === 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-green-500/30 bg-green-500/5">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-xs text-green-600 font-medium">Crosswind within limits</span>
        </div>
      )}
    </div>
  );
};
