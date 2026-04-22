import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wind, AlertTriangle, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { evaluateCrosswindWarnings, type CrosswindWarning } from '@/utils/windComponents';

interface CrosswindWarningPanelProps {
  waypoints: Array<{ identifier: string; windDir: number; windSpeed: number }>;
  aircraftName: string;
}

const SEVERITY_STYLES: Record<CrosswindWarning['severity'], { bg: string; text: string; border: string }> = {
  safe: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30' },
  caution: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', border: 'border-yellow-500/30' },
  warning: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/30' },
  exceeded: { bg: 'bg-destructive/10', text: 'text-destructive', border: 'border-destructive/30' },
};

export const CrosswindWarningPanel = ({ waypoints, aircraftName }: CrosswindWarningPanelProps) => {
  const warnings = useMemo(
    () => evaluateCrosswindWarnings(waypoints, aircraftName),
    [waypoints, aircraftName]
  );

  if (warnings.length === 0) return null;

  const hasExceeded = warnings.some(w => w.exceeded);
  const hasWarning = warnings.some(w => w.severity === 'warning' || w.severity === 'caution');

  return (
    <Collapsible defaultOpen={hasExceeded}>
      <div className={`rounded-lg border ${hasExceeded ? 'border-destructive/30 bg-destructive/5' : hasWarning ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-border bg-muted/30'}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wind className="h-4 w-4 text-primary" />
              Crosswind Analysis
              {hasExceeded && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  LIMIT EXCEEDED
                </Badge>
              )}
              {!hasExceeded && hasWarning && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-yellow-500 text-yellow-600">
                  CAUTION
                </Badge>
              )}
              {!hasExceeded && !hasWarning && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-600">
                  OK
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{aircraftName || 'Default limits'}</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {warnings.map((w) => {
              const styles = SEVERITY_STYLES[w.severity];
              return (
                <div
                  key={w.identifier}
                  className={`flex items-center justify-between p-2 rounded-md border ${styles.bg} ${styles.border}`}
                >
                  <div className="flex items-center gap-2">
                    {w.exceeded ? (
                      <AlertTriangle className={`h-4 w-4 ${styles.text}`} />
                    ) : (
                      <CheckCircle className={`h-4 w-4 ${styles.text}`} />
                    )}
                    <div>
                      <span className="font-mono font-bold text-sm">{w.identifier}</span>
                      <span className="text-xs text-muted-foreground ml-2">{w.runway}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="text-right">
                      <div className={`font-bold ${styles.text}`}>
                        {w.crosswindAbs}kt {w.crosswindDir}
                      </div>
                      <div className="text-muted-foreground">
                        {w.percentage}% of {w.limit}kt limit
                      </div>
                    </div>
                    {/* Visual bar */}
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          w.severity === 'exceeded' ? 'bg-destructive' :
                          w.severity === 'warning' ? 'bg-orange-500' :
                          w.severity === 'caution' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, w.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
