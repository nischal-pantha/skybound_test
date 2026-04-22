
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition, StaggerChildren } from "@/components/ui/page-transition";
import { Plane, Plus, Search, Download, BookOpen, Clock, Navigation, Moon, ArrowLeft } from "lucide-react";
import { FlightLogForm } from "./FlightLogForm";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";
import { useNotifications } from "@/contexts/NotificationContext";

export const Logbook = () => {
  const { flightLogs: flightEntries, getTotalFlightTime, getCrossCountryTime, getSoloTime, loading } = useSupabaseFlightData();
  const { notify } = useNotifications();
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'solo' | 'dual' | 'cross-country'>('all');

  const totalTime = getTotalFlightTime();
  const crossCountryTime = getCrossCountryTime();
  const soloTime = getSoloTime();
  const dualTime = flightEntries
    .filter(entry => entry.dual)
    .reduce((total, entry) => total + entry.flight_time, 0);

  const filteredEntries = flightEntries.filter(entry => {
    const matchesSearch =
      entry.aircraft.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.departure.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.remarks && entry.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'solo' && entry.solo) ||
      (filterType === 'dual' && entry.dual) ||
      (filterType === 'cross-country' && entry.cross_country > 0);
    return matchesSearch && matchesFilter;
  });

  const handleExportLogbook = () => {
    const csvContent = [
      'Date,Aircraft,Departure,Destination,Route,Flight Time,Landings,Cross Country,Night,Instrument,Solo,Dual,PIC,Instructor,Remarks',
      ...flightEntries.map(entry => [
        entry.date, entry.aircraft, entry.departure, entry.destination, entry.route || '',
        entry.flight_time, entry.landings, entry.cross_country, entry.night, entry.instrument,
        entry.solo ? 'Yes' : 'No', entry.dual ? 'Yes' : 'No', entry.pic ? 'Yes' : 'No',
        entry.instructor || '', `"${entry.remarks || ''}"`
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight-logbook-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    notify.success("Logbook Exported", "CSV file downloaded successfully.");
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
              <h2 className="text-xl font-semibold tracking-tight">Add Flight Entry</h2>
              <p className="text-sm text-muted-foreground">Log your flight time and experience</p>
            </div>
          </div>
          <FlightLogForm onClose={() => setShowAddForm(false)} />
        </div>
      </PageTransition>
    );
  }

  const stats = [
    { label: 'Total Hours', value: totalTime.toFixed(1), icon: <Clock className="h-4 w-4" />, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Solo Hours', value: soloTime.toFixed(1), icon: <Plane className="h-4 w-4" />, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Cross Country', value: crossCountryTime.toFixed(1), icon: <Navigation className="h-4 w-4" />, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Dual Hours', value: dualTime.toFixed(1), icon: <Moon className="h-4 w-4" />, color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  const progressItems = [
    { label: 'Total Flight Time', current: totalTime, required: 40 },
    { label: 'Cross Country', current: crossCountryTime, required: 10 },
    { label: 'Solo Flight', current: soloTime, required: 10 },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Flight Logbook</h2>
            <p className="text-sm text-muted-foreground mt-1">Track your flight time and progress</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportLogbook} className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" onClick={() => setShowAddForm(true)} className="gap-2">
              <Plus className="h-3.5 w-3.5" /> Add Flight
            </Button>
          </div>
        </div>

        {/* Stats */}
        <StaggerChildren className="grid grid-cols-2 md:grid-cols-4 gap-3" staggerMs={80}>
          {stats.map(stat => (
            <Card key={stat.label} className="glass-card hover-lift border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </StaggerChildren>

        {/* PPL Progress */}
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Private Pilot Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progressItems.map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.current.toFixed(1)} / {item.required} hrs</span>
                </div>
                <Progress value={Math.min((item.current / item.required) * 100, 100)} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search flights…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 glass-input h-9"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'solo', 'dual', 'cross-country'] as const).map(type => (
              <Button
                key={type}
                variant={filterType === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType(type)}
                className="text-xs capitalize h-9"
              >
                {type === 'cross-country' ? 'XC' : type}
              </Button>
            ))}
          </div>
        </div>

        {/* Flight Entries */}
        <div className="space-y-2">
          {filteredEntries.length === 0 ? (
            <Card className="glass-card border-border/40">
              <CardContent className="py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {loading ? "Loading flight logs..." : (flightEntries.length === 0 ? "No flights logged yet" : "No matches found")}
                </p>
                {!loading && flightEntries.length === 0 && (
                  <Button size="sm" onClick={() => setShowAddForm(true)}>Add Your First Flight</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredEntries
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map(entry => (
                <Card key={entry.id} className="glass-card hover-lift border-border/40 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{entry.date}</span>
                          <Badge variant="outline" className="text-[10px] h-5">{entry.aircraft}</Badge>
                          {entry.solo && <Badge className="text-[10px] h-5 bg-success/15 text-success border-0">Solo</Badge>}
                          {entry.dual && <Badge className="text-[10px] h-5 bg-primary/15 text-primary border-0">Dual</Badge>}
                          {entry.pic && <Badge className="text-[10px] h-5 bg-warning/15 text-warning border-0">PIC</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.departure} → {entry.destination}
                          {entry.route && <span className="text-muted-foreground/60"> via {entry.route}</span>}
                        </p>
                        {entry.remarks && <p className="text-xs text-muted-foreground/70 mt-1 italic truncate">{entry.remarks}</p>}
                      </div>
                      <div className="text-right pl-4 shrink-0">
                        <div className="text-base font-semibold">{entry.flight_time.toFixed(1)}h</div>
                        <div className="text-xs text-muted-foreground space-x-1">
                          {entry.landings > 0 && <span>{entry.landings} ldg</span>}
                          {entry.cross_country > 0 && <span>• {entry.cross_country.toFixed(1)}h XC</span>}
                        </div>
                        {entry.instructor && <div className="text-[11px] text-muted-foreground mt-0.5">CFI: {entry.instructor}</div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    </PageTransition>
  );
};
