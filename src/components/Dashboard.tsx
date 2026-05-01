import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plane, Clock, TrendingUp, Target, Award, MapPin, BookOpen, Gauge, Activity } from "lucide-react";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";
import { GPSTracker } from "./GPSTracker";
import { useAppContext } from "@/contexts/AppContext";
import { DashboardGridSkeleton, WeatherPanelSkeleton } from "@/components/ui/loading-skeleton";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const { flightEntries, flightSchedules, getTotalFlightTime, getCrossCountryTime, getSoloTime, loading } = useSupabaseFlightData();
  const { isOnline } = useAppContext();

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const stats = useMemo(() => ({
    totalFlights: flightEntries.length,
    totalHours: getTotalFlightTime(),
    crossCountryHours: getCrossCountryTime(),
    soloHours: getSoloTime(),
    dualHours: flightEntries.filter(e => e.dual).reduce((sum, e) => sum + e.flightTime, 0),
    nightHours: flightEntries.reduce((sum, e) => sum + e.night, 0),
    instrumentHours: flightEntries.reduce((sum, e) => sum + e.instrument, 0),
    totalLandings: flightEntries.reduce((sum, e) => sum + e.landings, 0),
    totalApproaches: flightEntries.reduce((sum, e) => sum + e.approaches, 0),
    upcomingFlights: flightSchedules.filter(s => s.status === 'scheduled').length,
    completedFlights: flightSchedules.filter(s => s.status === 'completed').length
  }), [flightEntries, flightSchedules, getTotalFlightTime, getCrossCountryTime, getSoloTime]);

  const recentFlights = useMemo(() => [...flightEntries]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3), [flightEntries]);

  const upcomingSchedules = useMemo(() => flightSchedules
    .filter(s => s.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3), [flightSchedules]);

  const ppProgress = {
    total: { current: stats.totalHours, required: 40 },
    xc: { current: stats.crossCountryHours, required: 10 },
    solo: { current: stats.soloHours, required: 10 },
  };

  const handleNavigate = (tab: string) => onNavigate?.(tab);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <DashboardGridSkeleton />
      </div>
    );
  }

  const pct = (cur: number, req: number) => Math.min((cur / req) * 100, 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Good {getGreeting()}</h1>
        <p className="text-muted-foreground mt-1">Here's your flight training overview.</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Hours"
          value={stats.totalHours.toFixed(1)}
          sub={`${stats.totalFlights} flights`}
          icon={<Clock className="h-5 w-5" />}
          color="primary"
          delay={0}
        />
        <StatCard
          label="Cross Country"
          value={stats.crossCountryHours.toFixed(1)}
          sub="hours"
          icon={<MapPin className="h-5 w-5" />}
          color="success"
          delay={0.05}
        />
        <StatCard
          label="Solo Time"
          value={stats.soloHours.toFixed(1)}
          sub="hours"
          icon={<Target className="h-5 w-5" />}
          color="warning"
          delay={0.1}
        />
        <StatCard
          label="Upcoming"
          value={String(stats.upcomingFlights)}
          sub="scheduled"
          icon={<CalendarDays className="h-5 w-5" />}
          color="primary"
          delay={0.15}
        />
      </div>

      {/* Progress + Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* PPL Progress */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" />
              Private Pilot Progress
            </CardTitle>
            <CardDescription className="text-xs">FAR 61.109 requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressRow label="Total Flight Time" current={ppProgress.total.current} required={ppProgress.total.required} />
            <ProgressRow label="Cross Country" current={ppProgress.xc.current} required={ppProgress.xc.required} />
            <ProgressRow label="Solo Time" current={ppProgress.solo.current} required={ppProgress.solo.required} />
            <div className="pt-4 border-t border-border/40 text-center">
              <div className="text-3xl font-bold text-primary">{Math.round(pct(ppProgress.total.current, ppProgress.total.required))}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">Overall Progress</div>
            </div>
          </CardContent>
        </Card>

        {/* Flight Stats */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-primary" />
              Flight Statistics
            </CardTitle>
            <CardDescription className="text-xs">Experience breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat label="Night" value={stats.nightHours.toFixed(1)} unit="hrs" />
              <MiniStat label="Instrument" value={stats.instrumentHours.toFixed(1)} unit="hrs" />
              <MiniStat label="Landings" value={String(stats.totalLandings)} />
              <MiniStat label="Approaches" value={String(stats.totalApproaches)} />
              <MiniStat label="Dual" value={stats.dualHours.toFixed(1)} unit="hrs" />
              <MiniStat label="Completed" value={String(stats.completedFlights)} unit="lessons" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* GPS Tracker */}
      <GPSTracker />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-5 w-5 text-primary" />
              Recent Flights
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFlights.length > 0 ? (
              <div className="space-y-3">
                {recentFlights.map((flight) => (
                  <div key={flight.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{flight.departure} → {flight.destination}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(flight.date).toLocaleDateString()} · {flight.aircraft}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-semibold">{flight.flightTime.toFixed(1)}h</Badge>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-sm text-muted-foreground hover:text-foreground" onClick={() => handleNavigate("logbook")}>
                  View All →
                </Button>
              </div>
            ) : (
              <EmptyState icon={<Plane className="h-8 w-8" />} message="No flights logged yet" action="Log First Flight" onAction={() => handleNavigate("logbook")} />
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Upcoming Lessons
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingSchedules.length > 0 ? (
              <div className="space-y-3">
                {upcomingSchedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{s.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.date).toLocaleDateString()} · {s.time} · {s.aircraft}
                      </p>
                    </div>
                    <Badge className="text-xs bg-primary/10 text-primary border-0">{s.duration}h</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<CalendarDays className="h-8 w-8" />} message="No upcoming lessons" action="Schedule Lesson" onAction={() => handleNavigate("flight-planning")} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function StatCard({ label, value, sub, icon, color, delay }: {
  label: string; value: string; sub: string; icon: React.ReactNode; color: string; delay: number;
}) {
  return (
    <Card
      className="border-border/50 shadow-sm hover:shadow-md transition-shadow animate-slide-in-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
          <div className={`p-2 rounded-xl bg-${color}/10`}>
            <span className={`text-${color}`}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressRow({ label, current, required }: { label: string; current: number; required: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{current.toFixed(1)} / {required}h</span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden bg-muted">
        <progress
          value={Math.min(current, required)}
          max={required}
          className="w-full h-2 appearance-none rounded-full bg-muted overflow-hidden"
        />
      </div>
    </div>
  );
}

function MiniStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="p-3 rounded-xl bg-muted/40">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
      {unit && <p className="text-[11px] text-muted-foreground">{unit}</p>}
    </div>
  );
}

function EmptyState({ icon, message, action, onAction }: {
  icon: React.ReactNode; message: string; action: string; onAction: () => void;
}) {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <div className="mx-auto mb-3 opacity-30">{icon}</div>
      <p className="text-sm">{message}</p>
      <Button size="sm" className="mt-3" onClick={onAction}>{action}</Button>
    </div>
  );
}
