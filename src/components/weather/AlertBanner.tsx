import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Bell, 
  BellOff,
  Zap,
  CloudRain,
  Wind,
  Snowflake,
  Shield,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WeatherAlert {
  id: string;
  type: 'tfr' | 'sigmet' | 'airmet' | 'lightning' | 'precip' | 'visibility' | 'icing' | 'turbulence' | 'winds' | 'crosswind';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  dismissable?: boolean;
  snoozeable?: boolean;
  snoozeUntil?: Date;
  affectsRoute?: boolean;
}

interface AlertBannerProps {
  alerts: WeatherAlert[];
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string, minutes: number) => void;
  onDismissAll?: () => void;
  className?: string;
  compact?: boolean;
}

const getAlertIcon = (type: WeatherAlert['type']) => {
  switch (type) {
    case 'tfr': return <Shield className="h-4 w-4" />;
    case 'sigmet': return <AlertTriangle className="h-4 w-4" />;
    case 'airmet': return <Wind className="h-4 w-4" />;
    case 'lightning': return <Zap className="h-4 w-4" />;
    case 'precip': return <CloudRain className="h-4 w-4" />;
    case 'icing': return <Snowflake className="h-4 w-4" />;
    case 'turbulence': return <Wind className="h-4 w-4" />;
    case 'winds': return <Wind className="h-4 w-4" />;
    case 'crosswind': return <Wind className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getSeverityStyles = (severity: WeatherAlert['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-destructive/10 border-destructive/30',
        text: 'text-destructive',
        badge: 'bg-destructive text-destructive-foreground',
        icon: 'text-destructive'
      };
    case 'warning':
      return {
        bg: 'bg-warning/10 border-warning/30',
        text: 'text-warning',
        badge: 'bg-warning text-warning-foreground',
        icon: 'text-warning'
      };
    default:
      return {
        bg: 'bg-primary/10 border-primary/30',
        text: 'text-primary',
        badge: 'bg-primary text-primary-foreground',
        icon: 'text-primary'
      };
  }
};

export const AlertBanner = ({
  alerts,
  onDismiss,
  onSnooze,
  onDismissAll,
  className = '',
  compact = false,
}: AlertBannerProps) => {
  const [expanded, setExpanded] = useState(false);
  const [muted, setMuted] = useState(false);

  // Filter out snoozed alerts
  const activeAlerts = alerts.filter(a => !a.snoozeUntil || a.snoozeUntil < new Date());
  
  // Sort by severity and recency
  const sortedAlerts = [...activeAlerts].sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  const criticalCount = sortedAlerts.filter(a => a.severity === 'critical').length;
  const warningCount = sortedAlerts.filter(a => a.severity === 'warning').length;
  const routeAlerts = sortedAlerts.filter(a => a.affectsRoute);

  if (sortedAlerts.length === 0) {
    return null;
  }

  // Compact single-line banner
  if (compact && sortedAlerts.length > 0) {
    const topAlert = sortedAlerts[0];
    const styles = getSeverityStyles(topAlert.severity);

    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg border animate-fade-in",
        styles.bg,
        className
      )}>
        <div className={cn("shrink-0", styles.icon)}>
          {getAlertIcon(topAlert.type)}
        </div>
        <span className={cn("text-sm font-medium flex-1 truncate", styles.text)}>
          {topAlert.title}
        </span>
        {sortedAlerts.length > 1 && (
          <Badge variant="secondary" className="text-[10px]">
            +{sortedAlerts.length - 1} more
          </Badge>
        )}
        {topAlert.dismissable && onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onDismiss(topAlert.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-lg border overflow-hidden animate-fade-in",
      criticalCount > 0 ? 'bg-destructive/5 border-destructive/20' : 
      warningCount > 0 ? 'bg-warning/5 border-warning/20' : 
      'bg-primary/5 border-primary/20',
      className
    )}>
      {/* Header */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={cn(
                "relative",
                criticalCount > 0 ? "text-destructive" : 
                warningCount > 0 ? "text-warning" : 
                "text-primary"
              )}>
                <Bell className="h-5 w-5" />
                {sortedAlerts.length > 0 && (
                  <span className={cn(
                    "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                    criticalCount > 0 ? "bg-destructive text-destructive-foreground" :
                    warningCount > 0 ? "bg-warning text-warning-foreground" :
                    "bg-primary text-primary-foreground"
                  )}>
                    {sortedAlerts.length}
                  </span>
                )}
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm">Weather Alerts</div>
                <div className="text-xs text-muted-foreground">
                  {criticalCount > 0 && <span className="text-destructive font-medium">{criticalCount} critical</span>}
                  {criticalCount > 0 && warningCount > 0 && ' • '}
                  {warningCount > 0 && <span className="text-warning">{warningCount} warning</span>}
                  {routeAlerts.length > 0 && (
                    <span className="ml-2 text-muted-foreground">({routeAlerts.length} along route)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted(!muted);
                }}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t">
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-2">
                {sortedAlerts.map((alert) => {
                  const styles = getSeverityStyles(alert.severity);
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        styles.bg
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <div className={cn("mt-0.5 shrink-0", styles.icon)}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("font-semibold text-sm", styles.text)}>
                                {alert.title}
                              </span>
                              <Badge className={cn("text-[10px]", styles.badge)}>
                                {alert.severity}
                              </Badge>
                              {alert.affectsRoute && (
                                <Badge variant="outline" className="text-[10px]">
                                  Along Route
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {alert.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {alert.snoozeable && onSnooze && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2"
                              onClick={() => onSnooze(alert.id, 30)}
                            >
                              <BellOff className="h-3 w-3 mr-1" />
                              30m
                            </Button>
                          )}
                          {alert.dismissable && onDismiss && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onDismiss(alert.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between p-2 border-t">
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
              {onDismissAll && sortedAlerts.some(a => a.dismissable) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px]"
                  onClick={onDismissAll}
                >
                  Dismiss All
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AlertBanner;
