import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageTransition, StaggerChildren } from "@/components/ui/page-transition";
import { User, Calendar, Plane, Award, Plus, Save, Target, Trophy, Clock, Shield, BookOpen, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSupabaseFlightData } from "@/hooks/useSupabaseFlightData";

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  category: 'license' | 'endorsement' | 'milestone' | 'safety';
}

export const Profile = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [studentInfo, setStudentInfo] = useState({
    name: "", certificateNumber: "",
    medicalClass: "", medicalExpires: "",
    instructorRating: "", school: "",
    startDate: "", homeAirport: "",
    phoneNumber: "", email: "",
    emergencyContact: "",
  });

  const [goals, setGoals] = useState({
    shortTerm: "",
    longTerm: "",
    improvements: "",
  });

  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata?.pilot_profile;
      if (metadata) {
        if (metadata.studentInfo) setStudentInfo(metadata.studentInfo);
        if (metadata.goals) setGoals(metadata.goals);
        if (metadata.achievements) setAchievements(metadata.achievements);
      } else {
        // Fallback to localStorage for migration or initial state
        const localProfile = localStorage.getItem('studentProfile');
        const localGoals = localStorage.getItem('studentGoals');
        if (localProfile) setStudentInfo(JSON.parse(localProfile));
        if (localGoals) setGoals(JSON.parse(localGoals));
      }
      setLoading(false);
    }
  }, [user]);

  const [isAddingAchievement, setIsAddingAchievement] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ title: '', description: '', date: '', category: 'milestone' as Achievement['category'] });

  const { flightEntries } = useSupabaseFlightData();

  const stats = useMemo(() => {
    const totalHours = flightEntries.reduce((sum, e) => sum + (e.flightTime || 0), 0);
    const soloHours = flightEntries.filter(e => e.solo).reduce((sum, e) => sum + (e.flightTime || 0), 0);
    const xcHours = flightEntries.reduce((sum, e) => sum + (e.crossCountry || 0), 0);
    const nightHours = flightEntries.reduce((sum, e) => sum + (e.night || 0), 0);
    const instrumentHours = flightEntries.reduce((sum, e) => sum + (e.instrument || 0), 0);
    const landings = flightEntries.reduce((sum, e) => sum + (e.landings || 0), 0);
    const uniqueAirports = new Set(flightEntries.flatMap(e => [e.departure, e.destination])).size;

    return {
      totalHours, soloHours, xcHours, nightHours, instrumentHours, landings, uniqueAirports
    };
  }, [flightEntries]);

  const flightStats = [
    { label: 'Total Hours', value: stats.totalHours.toFixed(1), color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Solo', value: stats.soloHours.toFixed(1), color: 'text-success', bg: 'bg-success/10' },
    { label: 'Cross Country', value: stats.xcHours.toFixed(1), color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Landings', value: stats.landings.toString(), color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: 'Airports', value: stats.uniqueAirports.toString(), color: 'text-muted-foreground', bg: 'bg-muted' },
  ];

  const certProgress = [
    { name: "Total Flight Time", completed: stats.totalHours, required: 40, status: stats.totalHours >= 40 ? "Complete" : `${(40 - stats.totalHours).toFixed(1)}h remaining` },
    { name: "Cross Country", completed: stats.xcHours, required: 10, status: stats.xcHours >= 10 ? "Complete" : `${(10 - stats.xcHours).toFixed(1)}h remaining` },
    { name: "Solo Flight Time", completed: stats.soloHours, required: 10, status: stats.soloHours >= 10 ? "Complete" : `${(10 - stats.soloHours).toFixed(1)}h remaining` },
    { name: "Instrument Training", completed: stats.instrumentHours, required: 3, status: stats.instrumentHours >= 3 ? "Complete" : `${(3 - stats.instrumentHours).toFixed(1)}h remaining` },
    { name: "Night Flying", completed: stats.nightHours, required: 3, status: stats.nightHours >= 3 ? "Complete" : `${(3 - stats.nightHours).toFixed(1)}h remaining` },
  ];

  const endorsements = [
    { type: "Pre-Solo Written Exam", date: "2024-04-20", instructor: "John Smith, CFI", regulation: "§61.87(b)" },
    { type: "Solo Flight", date: "2024-05-15", instructor: "John Smith, CFI", regulation: "§61.87(c)" },
    { type: "Cross Country Solo", date: "2024-06-01", instructor: "Sarah Johnson, CFII", regulation: "§61.93(c)(1)" },
    { type: "Night Flying", date: "2024-06-20", instructor: "Mike Davis, CFI", regulation: "§61.109(a)(2)" },
  ];

  const catConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    license: { icon: <Award className="h-3 w-3" />, color: 'bg-primary/15 text-primary' },
    endorsement: { icon: <Shield className="h-3 w-3" />, color: 'bg-success/15 text-success' },
    milestone: { icon: <Target className="h-3 w-3" />, color: 'bg-warning/15 text-warning' },
    safety: { icon: <Trophy className="h-3 w-3" />, color: 'bg-destructive/15 text-destructive' },
  };

  const saveToSupabase = async (updatedData: any) => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        pilot_profile: {
          studentInfo,
          goals,
          achievements,
          ...updatedData
        }
      }
    });

    if (error) {
      toast({ title: "Error", description: "Failed to save profile: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile synchronized with cloud storage." });
    }
    setSaving(false);
  };

  const handleSaveProfile = () => {
    saveToSupabase({ studentInfo });
  };

  const handleAddAchievement = () => {
    if (newAchievement.title && newAchievement.date) {
      const updatedAchievements = [{ id: Date.now(), ...newAchievement }, ...achievements];
      setAchievements(updatedAchievements);
      saveToSupabase({ achievements: updatedAchievements });
      setNewAchievement({ title: '', description: '', date: '', category: 'milestone' });
      setIsAddingAchievement(false);
    }
  };

  const handleSaveGoals = () => {
    saveToSupabase({ goals });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pilot Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Training progress, achievements, and certifications</p>
        </div>

        {/* Stats */}
        <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" staggerMs={60}>
          {flightStats.map(stat => (
            <Card key={stat.label} className="glass-card hover-lift border-border/40">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </StaggerChildren>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* Personal Info */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                ['name', 'Full Name'], ['certificateNumber', 'Certificate #'], ['medicalClass', 'Medical Class'],
                ['medicalExpires', 'Medical Expires', 'date'], ['school', 'Flight School'], ['homeAirport', 'Home Airport'],
                ['phoneNumber', 'Phone'], ['email', 'Email', 'email'], ['emergencyContact', 'Emergency Contact'],
              ] as const).reduce((rows, [field, label, type], i, arr) => {
                if (i % 2 === 0) {
                  const next = arr[i + 1];
                  rows.push(
                    <div key={field} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input value={studentInfo[field]} onChange={e => setStudentInfo(p => ({ ...p, [field]: e.target.value }))} type={type || 'text'} className="glass-input h-9 text-sm mt-1" />
                      </div>
                      {next && (
                        <div>
                          <Label className="text-xs text-muted-foreground">{next[1]}</Label>
                          <Input value={studentInfo[next[0]]} onChange={e => setStudentInfo(p => ({ ...p, [next[0]]: e.target.value }))} type={next[2] || 'text'} className="glass-input h-9 text-sm mt-1" />
                        </div>
                      )}
                    </div>
                  );
                }
                return rows;
              }, [] as React.ReactNode[])}
              <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="w-full gap-2 mt-2">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Cert Progress */}
          <Card className="glass-card border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Certification Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {certProgress.map(req => {
                const pct = Math.min((req.completed / req.required) * 100, 100);
                return (
                  <div key={req.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm text-muted-foreground">{req.name}</span>
                      <Badge variant={pct >= 100 ? 'default' : 'secondary'} className="text-[10px] h-5">{req.status}</Badge>
                    </div>
                    <Progress value={pct} className="h-2" />
                    <div className="flex justify-between text-[11px] text-muted-foreground/60 mt-1">
                      <span>{req.completed} / {req.required} hrs</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-warning" /> Achievements</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setIsAddingAchievement(true)} className="gap-1.5 text-xs">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAddingAchievement && (
              <Card className="mb-4 border-primary/20 bg-primary/5">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">New Achievement</span>
                    <Button size="icon" variant="ghost" onClick={() => setIsAddingAchievement(false)} className="h-7 w-7"><X className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input value={newAchievement.title} onChange={e => setNewAchievement(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="glass-input h-9 text-sm" />
                    <Input type="date" value={newAchievement.date} onChange={e => setNewAchievement(p => ({ ...p, date: e.target.value }))} className="glass-input h-9 text-sm" />
                  </div>
                  <Input value={newAchievement.description} onChange={e => setNewAchievement(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="glass-input h-9 text-sm" />
                  <Button onClick={handleAddAchievement} size="sm" className="w-full">Save Achievement</Button>
                </CardContent>
              </Card>
            )}
            <div className="space-y-2">
              {achievements.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${catConfig[a.category].color} flex items-center justify-center shrink-0`}>
                    {catConfig[a.category].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{a.title}</span>
                      <Badge className={`text-[9px] h-4 border-0 ${catConfig[a.category].color}`}>{a.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    <span className="text-[11px] text-muted-foreground/60">{a.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Endorsements */}
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-success" /> Endorsements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {endorsements.map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{e.type}</div>
                    <div className="text-xs text-muted-foreground">{e.instructor} • {e.date}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">{e.regulation}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="glass-card border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Training Goals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(['shortTerm', 'longTerm', 'improvements'] as const).map(key => (
              <div key={key}>
                <Label className="text-xs text-muted-foreground capitalize">{key === 'shortTerm' ? 'Short Term' : key === 'longTerm' ? 'Long Term' : 'Areas for Improvement'}</Label>
                <Textarea value={goals[key]} onChange={e => setGoals(p => ({ ...p, [key]: e.target.value }))} className="mt-1 text-sm resize-none h-20" />
              </div>
            ))}
            <Button size="sm" onClick={handleSaveGoals} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving..." : "Save Goals"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};
