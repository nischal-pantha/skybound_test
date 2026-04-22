
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageTransition, StaggerChildren } from "@/components/ui/page-transition";
import { Calendar, Plus, Clock, Plane, User, CheckCircle, XCircle, Trash2, ArrowLeft } from "lucide-react";
import { FlightSchedulingForm } from "./FlightSchedulingForm";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";
import { useToast } from "@/hooks/use-toast";

export const FlightScheduling = () => {
  const { flightSchedules, updateFlightSchedule, deleteFlightSchedule, loading } = useSupabaseFlightData();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const upcomingFlights = flightSchedules.filter(f => f.date >= today && f.status === 'scheduled');
  const pastFlights = flightSchedules.filter(f => f.date < today || f.status !== 'scheduled');

  const handleUpdateStatus = (id: string, status: 'completed' | 'cancelled') => {
    updateFlightSchedule(id, { status });
    toast({ title: "Updated", description: `Flight marked as ${status}` });
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    completed: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-success/15 text-success' },
    cancelled: { icon: <XCircle className="h-3 w-3" />, color: 'bg-destructive/15 text-destructive' },
    scheduled: { icon: <Clock className="h-3 w-3" />, color: 'bg-primary/15 text-primary' },
  };

  if (showAddForm) {
    return (
      <PageTransition>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="h-9 w-9 rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Schedule Flight</h2>
              <p className="text-sm text-muted-foreground">Book a training session</p>
            </div>
          </div>
          <FlightSchedulingForm onClose={() => setShowAddForm(false)} />
        </div>
      </PageTransition>
    );
  }

  const stats = [
    { label: 'Upcoming', value: upcomingFlights.length, icon: <Clock className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Completed', value: flightSchedules.filter(f => f.status === 'completed').length, icon: <CheckCircle className="h-4 w-4" />, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Hours Booked', value: flightSchedules.reduce((t, f) => f.status === 'completed' ? t + f.duration : t, 0).toFixed(1), icon: <Plane className="h-4 w-4" />, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Flight Schedule</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your training sessions</p>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-3.5 w-3.5" /> Schedule
          </Button>
        </div>

        {/* Stats */}
        <StaggerChildren className="grid grid-cols-3 gap-3" staggerMs={60}>
          {stats.map(s => (
            <Card key={s.label} className="glass-card hover-lift border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <div>
                  <div className="text-xl font-semibold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </StaggerChildren>

        {/* Upcoming */}
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Upcoming ({upcomingFlights.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-10 text-muted-foreground">Loading schedules...</div>
            ) : upcomingFlights.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">No upcoming flights</p>
                <Button size="sm" onClick={() => setShowAddForm(true)}>Schedule First Flight</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingFlights
                  .sort((a, b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime())
                  .map(flight => (
                    <div key={flight.id} className="p-4 rounded-xl border border-border/40 hover-lift transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-sm font-medium">{new Date(flight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="text-xs text-muted-foreground">{flight.time}</div>
                          </div>
                          <div className="w-px h-10 bg-border/60" />
                          <div>
                            <div className="text-sm font-medium flex items-center gap-1.5">
                              <Plane className="h-3.5 w-3.5 text-primary" /> {flight.aircraft}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <User className="h-3 w-3" /> {flight.instructor || 'Solo'}
                            </div>
                          </div>
                        </div>
                        <Badge className={`text-[10px] h-5 border-0 ${statusConfig[flight.status]?.color || statusConfig.scheduled.color}`}>
                          {statusConfig[flight.status]?.icon || statusConfig.scheduled.icon}
                          <span className="ml-1 capitalize">{flight.status}</span>
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                        <div><span className="text-muted-foreground">Type</span><div className="font-medium capitalize">{flight.type}</div></div>
                        <div><span className="text-muted-foreground">Duration</span><div className="font-medium">{flight.duration}h</div></div>
                        <div><span className="text-muted-foreground">Status</span><div className="font-medium capitalize">{flight.status}</div></div>
                      </div>
                      {flight.notes && <p className="text-xs text-muted-foreground mb-3">{flight.notes}</p>}
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateStatus(flight.id, 'completed')}>Complete</Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleUpdateStatus(flight.id, 'cancelled')}>Cancel</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => { deleteFlightSchedule(flight.id); toast({ title: "Deleted" }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        {pastFlights.length > 0 && (
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {pastFlights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(flight => (
                  <div key={flight.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xs">
                        <div className="font-medium">{new Date(flight.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div className="text-muted-foreground">{flight.time}</div>
                      </div>
                      <div className="w-px h-8 bg-border/40" />
                      <div className="text-xs">
                        <div className="font-medium">{flight.aircraft}</div>
                        <div className="text-muted-foreground capitalize">{flight.type}</div>
                      </div>
                    </div>
                    <Badge className={`text-[10px] h-5 border-0 ${statusConfig[flight.status]?.color || 'bg-muted text-muted-foreground'}`}>
                      {statusConfig[flight.status]?.icon}
                      <span className="ml-1 capitalize">{flight.status}</span>
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
};
