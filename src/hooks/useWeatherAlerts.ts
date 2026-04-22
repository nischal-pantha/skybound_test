import { useState, useCallback, useEffect, useMemo } from 'react';
import type { WeatherAlert } from '@/components/weather/AlertBanner';

interface AlertConfig {
  tfrProximityNM?: number;
  lightningProximityNM?: number;
  precipIntensityThreshold?: number; // mm/hr
  visibilityMinimumSM?: number;
  windThresholdKts?: number;
}

interface RouteWaypoint {
  lat: number;
  lng: number;
  identifier: string;
}

interface WeatherCondition {
  type: string;
  lat: number;
  lng: number;
  intensity?: number;
  details?: Record<string, unknown>;
}

const DEFAULT_CONFIG: AlertConfig = {
  tfrProximityNM: 10,
  lightningProximityNM: 25,
  precipIntensityThreshold: 8, // Heavy rain
  visibilityMinimumSM: 3,
  windThresholdKts: 35,
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isNearRoute = (
  condition: { lat: number; lng: number },
  waypoints: RouteWaypoint[],
  thresholdNM: number
): boolean => {
  for (const wp of waypoints) {
    const dist = calculateDistance(wp.lat, wp.lng, condition.lat, condition.lng);
    if (dist <= thresholdNM) return true;
  }
  return false;
};

export const useWeatherAlerts = (
  routeWaypoints: RouteWaypoint[] = [],
  weatherConditions: WeatherCondition[] = [],
  config: AlertConfig = DEFAULT_CONFIG
) => {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedAlerts, setSnoozedAlerts] = useState<Record<string, Date>>({});

  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // Generate alerts based on weather conditions
  const generateAlerts = useCallback((): WeatherAlert[] => {
    const newAlerts: WeatherAlert[] = [];
    const now = new Date();

    weatherConditions.forEach((condition, index) => {
      const alertId = `${condition.type}-${index}-${condition.lat.toFixed(2)}-${condition.lng.toFixed(2)}`;
      
      // Skip if dismissed
      if (dismissedIds.has(alertId)) return;
      
      // Skip if snoozed and not expired
      if (snoozedAlerts[alertId] && snoozedAlerts[alertId] > now) return;

      const affectsRoute = routeWaypoints.length > 0 && isNearRoute(
        condition,
        routeWaypoints,
        condition.type === 'lightning' ? mergedConfig.lightningProximityNM! :
        condition.type === 'tfr' ? mergedConfig.tfrProximityNM! : 20
      );

      switch (condition.type) {
        case 'tfr':
          newAlerts.push({
            id: alertId,
            type: 'tfr',
            severity: affectsRoute ? 'critical' : 'warning',
            title: 'TFR Proximity',
            message: `Temporary Flight Restriction ${affectsRoute ? 'along your route' : 'nearby'}. Check NOTAMs for details.`,
            timestamp: now,
            dismissable: true,
            snoozeable: true,
            affectsRoute,
          });
          break;

        case 'lightning':
          if (affectsRoute || mergedConfig.lightningProximityNM! <= 15) {
            newAlerts.push({
              id: alertId,
              type: 'lightning',
              severity: affectsRoute ? 'warning' : 'info',
              title: 'Lightning Activity',
              message: `Lightning detected ${affectsRoute ? 'along route' : 'in area'}. Consider alternate routing.`,
              timestamp: now,
              dismissable: true,
              snoozeable: true,
              affectsRoute,
            });
          }
          break;

        case 'precip': {
          const intensity = condition.intensity || 0;
          if (intensity >= mergedConfig.precipIntensityThreshold!) {
            newAlerts.push({
              id: alertId,
              type: 'precip',
              severity: intensity >= 16 ? 'critical' : 'warning',
              title: 'Heavy Precipitation',
              message: `${intensity >= 16 ? 'Severe' : 'Heavy'} precipitation (${intensity.toFixed(1)} mm/hr) ${affectsRoute ? 'along route' : 'in area'}.`,
              timestamp: now,
              dismissable: true,
              snoozeable: true,
              affectsRoute,
            });
          }
          break;
        }

        case 'sigmet':
          newAlerts.push({
            id: alertId,
            type: 'sigmet',
            severity: 'critical',
            title: 'SIGMET Active',
            message: `Significant meteorological activity ${affectsRoute ? 'affects your route' : 'in area'}. Review before departure.`,
            timestamp: now,
            dismissable: false,
            snoozeable: true,
            affectsRoute,
          });
          break;

        case 'airmet':
          newAlerts.push({
            id: alertId,
            type: 'airmet',
            severity: 'warning',
            title: 'AIRMET Active',
            message: `Airmen's meteorological advisory ${affectsRoute ? 'along route' : 'in area'}.`,
            timestamp: now,
            dismissable: true,
            snoozeable: true,
            affectsRoute,
          });
          break;

        case 'icing':
          newAlerts.push({
            id: alertId,
            type: 'icing',
            severity: condition.intensity && condition.intensity >= 3 ? 'critical' : 'warning',
            title: 'Icing Reported',
            message: `${condition.intensity && condition.intensity >= 3 ? 'Severe' : 'Moderate'} icing conditions reported ${affectsRoute ? 'along route' : 'in area'}.`,
            timestamp: now,
            dismissable: true,
            snoozeable: true,
            affectsRoute,
          });
          break;

        case 'turbulence':
          newAlerts.push({
            id: alertId,
            type: 'turbulence',
            severity: condition.intensity && condition.intensity >= 4 ? 'critical' : 'warning',
            title: 'Turbulence Reported',
            message: `${condition.intensity && condition.intensity >= 4 ? 'Severe' : 'Moderate'} turbulence reported ${affectsRoute ? 'along route' : 'in area'}.`,
            timestamp: now,
            dismissable: true,
            snoozeable: true,
            affectsRoute,
          });
          break;

        case 'crosswind': {
          const xwSpeed = condition.intensity || 0;
          const xwDetails = condition.details as { identifier?: string; runway?: string; limit?: number; percentage?: number } | undefined;
          const exceeded = xwDetails?.percentage ? xwDetails.percentage >= 100 : false;
          const pct = xwDetails?.percentage ?? 0;
          newAlerts.push({
            id: alertId,
            type: 'crosswind',
            severity: exceeded ? 'critical' : pct >= 85 ? 'warning' : 'info',
            title: `Crosswind ${exceeded ? 'EXCEEDED' : 'Advisory'} — ${xwDetails?.identifier || ''}`,
            message: `${xwSpeed}kt crosswind on ${xwDetails?.runway || 'best runway'} (${pct}% of ${xwDetails?.limit || 15}kt limit).${exceeded ? ' Consider alternate airport or wait for conditions to improve.' : ''}`,
            timestamp: now,
            dismissable: true,
            snoozeable: true,
            affectsRoute: true,
          });
          break;
        }
      }
    });

    // Sort by severity and route relevance
    return newAlerts.sort((a, b) => {
      // Route alerts first
      if (a.affectsRoute && !b.affectsRoute) return -1;
      if (!a.affectsRoute && b.affectsRoute) return 1;
      
      // Then by severity
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }, [weatherConditions, routeWaypoints, mergedConfig, dismissedIds, snoozedAlerts]);

  // Update alerts when conditions change
  useEffect(() => {
    const newAlerts = generateAlerts();
    setAlerts(newAlerts);
  }, [generateAlerts]);

  // Dismiss an alert
  const dismissAlert = useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  // Snooze an alert
  const snoozeAlert = useCallback((id: string, minutes: number) => {
    const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    setSnoozedAlerts(prev => ({ ...prev, [id]: snoozeUntil }));
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, snoozeUntil } : a
    ));
  }, []);

  // Dismiss all dismissable alerts
  const dismissAllAlerts = useCallback(() => {
    const dismissableIds = alerts.filter(a => a.dismissable).map(a => a.id);
    setDismissedIds(prev => new Set([...prev, ...dismissableIds]));
    setAlerts(prev => prev.filter(a => !a.dismissable));
  }, [alerts]);

  // Clear expired snoozes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const expired = Object.entries(snoozedAlerts)
        .filter(([_, expiry]) => expiry <= now)
        .map(([id]) => id);
      
      if (expired.length > 0) {
        setSnoozedAlerts(prev => {
          const updated = { ...prev };
          expired.forEach(id => delete updated[id]);
          return updated;
        });
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [snoozedAlerts]);

  return {
    alerts,
    dismissAlert,
    snoozeAlert,
    dismissAllAlerts,
    criticalCount: alerts.filter(a => a.severity === 'critical').length,
    warningCount: alerts.filter(a => a.severity === 'warning').length,
    routeAlertCount: alerts.filter(a => a.affectsRoute).length,
  };
};

export default useWeatherAlerts;
