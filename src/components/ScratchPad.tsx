
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PageTransition } from "@/components/ui/page-transition";
import { 
  StickyNote, Calculator, Clock, Save, Trash2, 
  Download, Plus, Plane, Wind, Navigation, Compass, Fuel
} from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: Date;
  category: "general" | "flight" | "calculation" | "weather";
}

interface Calculation {
  id: string;
  name: string;
  formula: string;
  result: number;
  variables: Record<string, number>;
  timestamp: Date;
}

export const ScratchPad = () => {
  const { notify } = useNotifications();
  const [notes, setNotes] = useState<Note[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [currentNote, setCurrentNote] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteCategory, setNoteCategory] = useState<Note["category"]>("general");

  const calcTemplates = [
    { name: "Ground Speed", formula: "TAS + HeadwindComponent", variables: { TAS: 105, HeadwindComponent: -10 } },
    { name: "Wind Correction Angle", formula: "atan(Crosswind / TAS) × 57.3", variables: { Crosswind: 15, TAS: 105 } },
    { name: "Fuel Required", formula: "FlightTime × FuelFlow + Reserve", variables: { FlightTime: 1.5, FuelFlow: 8.5, Reserve: 4.0 } },
    { name: "Density Altitude", formula: "PressureAlt + (120 × (OAT − ISA))", variables: { PressureAlt: 3500, OAT: 25, ISA: 9 } },
    { name: "True Airspeed", formula: "IAS × √(1.225 / AirDensity)", variables: { IAS: 100, AirDensity: 0.9 } },
  ];

  const [selectedTemplate, setSelectedTemplate] = useState(calcTemplates[0]);
  const [calcVariables, setCalcVariables] = useState(selectedTemplate.variables);

  useEffect(() => {
    const savedNotes = localStorage.getItem("aviation_notes");
    const savedCalcs = localStorage.getItem("aviation_calculations");
    if (savedNotes) try { setNotes(JSON.parse(savedNotes).map((n: any) => ({ ...n, timestamp: new Date(n.timestamp) }))); } catch {}
    if (savedCalcs) try { setCalculations(JSON.parse(savedCalcs).map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) }))); } catch {}
  }, []);

  useEffect(() => { localStorage.setItem("aviation_notes", JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem("aviation_calculations", JSON.stringify(calculations)); }, [calculations]);

  const addNote = () => {
    if (!noteTitle.trim() || !currentNote.trim()) {
      notify.error("Missing Info", "Provide both title and content.");
      return;
    }
    setNotes(prev => [{ id: Date.now().toString(), title: noteTitle.trim(), content: currentNote.trim(), timestamp: new Date(), category: noteCategory }, ...prev]);
    setNoteTitle(""); setCurrentNote("");
    notify.success("Note Saved", `${noteTitle} added.`);
  };

  const calculateResult = () => {
    try {
      let result = 0;
      const v = calcVariables;
      switch (selectedTemplate.name) {
        case "Ground Speed": result = v.TAS + v.HeadwindComponent; break;
        case "Wind Correction Angle": result = Math.atan(v.Crosswind / v.TAS) * 57.2958; break;
        case "Fuel Required": result = v.FlightTime * v.FuelFlow + v.Reserve; break;
        case "Density Altitude": result = v.PressureAlt + (120 * (v.OAT - v.ISA)); break;
        case "True Airspeed": result = v.IAS * Math.sqrt(1.225 / v.AirDensity); break;
      }
      setCalculations(prev => [{ id: Date.now().toString(), name: selectedTemplate.name, formula: selectedTemplate.formula, result: Math.round(result * 100) / 100, variables: { ...v }, timestamp: new Date() }, ...prev]);
      notify.success("Calculated", `${selectedTemplate.name}: ${Math.round(result * 100) / 100}`);
    } catch { notify.error("Error", "Check your inputs."); }
  };

  const exportNotes = () => {
    const blob = new Blob([JSON.stringify({ notes, calculations, exportDate: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `aviation_notes_${new Date().toISOString().split('T')[0]}.json`; a.click();
    URL.revokeObjectURL(url);
    notify.success("Exported", "Notes and calculations exported.");
  };

  const categoryConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    flight: { icon: <Plane className="h-3 w-3" />, color: 'bg-primary/15 text-primary' },
    calculation: { icon: <Calculator className="h-3 w-3" />, color: 'bg-success/15 text-success' },
    weather: { icon: <Wind className="h-3 w-3" />, color: 'bg-warning/15 text-warning' },
    general: { icon: <StickyNote className="h-3 w-3" />, color: 'bg-muted text-muted-foreground' },
  };

  const references = [
    { title: 'Navigation', icon: <Navigation className="h-5 w-5 text-primary" />, items: ['1 nm = 1.15 sm', '1 nm = 1.852 km', '1° lat ≈ 60 nm', 'Mag Var: West Best, East Least'] },
    { title: 'Fuel', icon: <Fuel className="h-5 w-5 text-warning" />, items: ['AvGas: 6 lbs/gal', 'Jet-A: 6.7 lbs/gal', '1 US gal = 3.785 L', 'VFR Reserve: 30 min day, 45 min night'] },
    { title: 'Weather', icon: <Wind className="h-5 w-5 text-success" />, items: ['Temp lapse: 2°C/1000ft', 'Std pressure: 29.92" Hg', 'Freezing level ≈ 7,500ft std', 'VFR: 3sm vis, 1000ft ceiling'] },
    { title: 'Performance', icon: <Compass className="h-5 w-5 text-destructive" />, items: ['DA↑ = Perf↓', 'Headwind: ×1.5 for landing', '+10°C ISA = +600ft DA', 'Wet runway: ×1.15 landing'] },
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Scratch Pad</h2>
            <p className="text-sm text-muted-foreground mt-1">Notes, calculations, and quick references</p>
          </div>
          <Button variant="outline" size="sm" onClick={exportNotes} className="gap-2">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>

        <Tabs defaultValue="notes" className="space-y-5">
          <TabsList className="grid w-full grid-cols-3 h-10">
            <TabsTrigger value="notes" className="text-sm">Notes</TabsTrigger>
            <TabsTrigger value="calculations" className="text-sm">Calculator</TabsTrigger>
            <TabsTrigger value="references" className="text-sm">References</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="glass-card border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" /> New Note
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input value={noteTitle} onChange={e => setNoteTitle(e.target.value)} placeholder="Note title…" className="glass-input h-9 text-sm" />
                  <select
                    value={noteCategory}
                    onChange={e => setNoteCategory(e.target.value as Note["category"])}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background"
                  >
                    <option value="general">General</option>
                    <option value="flight">Flight Planning</option>
                    <option value="calculation">Calculations</option>
                    <option value="weather">Weather</option>
                  </select>
                  <Textarea value={currentNote} onChange={e => setCurrentNote(e.target.value)} placeholder="Write your notes…" className="h-28 text-sm resize-none" />
                  <Button onClick={addNote} size="sm" className="w-full gap-2">
                    <Save className="h-3.5 w-3.5" /> Save Note
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-2">
                {notes.length === 0 ? (
                  <Card className="glass-card border-border/40">
                    <CardContent className="py-10 text-center">
                      <StickyNote className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No notes yet</p>
                    </CardContent>
                  </Card>
                ) : notes.map(note => (
                  <Card key={note.id} className="glass-card hover-lift border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold truncate">{note.title}</h4>
                            <Badge className={`text-[10px] h-5 border-0 ${categoryConfig[note.category].color}`}>
                              {categoryConfig[note.category].icon}
                              <span className="ml-1">{note.category}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{note.content}</p>
                          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-1.5">
                            <Clock className="h-3 w-3" /> {note.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => setNotes(p => p.filter(n => n.id !== note.id))} className="h-7 w-7 text-destructive/60 hover:text-destructive shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calculations" className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <Card className="glass-card border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" /> Aviation Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <select
                    value={selectedTemplate.name}
                    onChange={e => { const t = calcTemplates.find(t => t.name === e.target.value)!; setSelectedTemplate(t); setCalcVariables(t.variables); }}
                    className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-background"
                  >
                    {calcTemplates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                  <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm text-muted-foreground">{selectedTemplate.formula}</div>
                  <div className="space-y-2">
                    {Object.entries(calcVariables).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <Label className="w-32 text-sm text-muted-foreground">{key}</Label>
                        <Input type="number" step="0.1" value={value} onChange={e => setCalcVariables(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))} className="flex-1 glass-input h-9 text-sm" />
                      </div>
                    ))}
                  </div>
                  <Button onClick={calculateResult} size="sm" className="w-full gap-2">
                    <Calculator className="h-3.5 w-3.5" /> Calculate
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">History</CardTitle>
                </CardHeader>
                <CardContent>
                  {calculations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calculator className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No calculations yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {calculations.map(calc => (
                        <div key={calc.id} className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-semibold text-primary">{calc.name}</span>
                            <Button size="icon" variant="ghost" onClick={() => setCalculations(p => p.filter(c => c.id !== calc.id))} className="h-6 w-6 text-destructive/50">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-lg font-bold">{calc.result}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {Object.entries(calc.variables).map(([k, v]) => `${k}=${v}`).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="references">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {references.map(ref => (
                <Card key={ref.title} className="glass-card hover-lift border-border/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">{ref.icon} {ref.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {ref.items.map((item, i) => (
                        <div key={i} className="text-sm text-muted-foreground font-mono">{item}</div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};
