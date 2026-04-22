import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, RotateCcw } from "lucide-react";
import { getChecklistsForAircraft } from "@/data/aircraftChecklists";
import { AircraftChecklistSelector } from "./AircraftChecklistSelector";
import { ChecklistSection } from "./checklist/ChecklistSection";
import { ChecklistProgress } from "./checklist/ChecklistProgress";

export const Checklists = () => {
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [selectedAircraft, setSelectedAircraft] = useState<string>('generic');
  const checklists = getChecklistsForAircraft(selectedAircraft);

  const toggleItem = (checklistKey: string, sectionIndex: number, itemIndex: number) => {
    const key = `${selectedAircraft}-${checklistKey}-${sectionIndex}-${itemIndex}`;
    setCompletedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetChecklist = (checklistKey: string) => {
    setCompletedItems(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(k => { if (k.startsWith(`${selectedAircraft}-${checklistKey}`)) delete n[k]; });
      return n;
    });
  };

  const resetAllChecklists = () => {
    setCompletedItems(prev => {
      const n = { ...prev };
      Object.keys(n).forEach(k => { if (k.startsWith(`${selectedAircraft}-`)) delete n[k]; });
      return n;
    });
  };

  const getCompletionStatus = (checklistKey: string) => {
    const cl = checklists[checklistKey];
    if (!cl) return { completed: 0, total: 0 };
    let total = 0, done = 0;
    cl.sections.forEach((s, si) => s.items.forEach((_, ii) => {
      total++;
      if (completedItems[`${selectedAircraft}-${checklistKey}-${si}-${ii}`]) done++;
    }));
    return { completed: done, total };
  };

  const totalItems = Object.keys(checklists).reduce((sum, k) => sum + getCompletionStatus(k).total, 0);
  const totalDone = Object.keys(checklists).reduce((sum, k) => sum + getCompletionStatus(k).completed, 0);
  const overallPercent = totalItems > 0 ? Math.round((totalDone / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Checklists</h2>
          <p className="text-sm text-muted-foreground mt-0.5">POH-based flight procedures</p>
        </div>
        <Button variant="outline" size="sm" onClick={resetAllChecklists} className="gap-2 rounded-xl h-9 text-xs border-border/60 hover:text-destructive hover:border-destructive/30">
          <RotateCcw className="h-3.5 w-3.5" />Reset All
        </Button>
      </div>

      {/* Overall progress strip */}
      <div className="flex items-center gap-4 px-5 py-3.5 rounded-2xl border border-border/40 bg-muted/30">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <ClipboardCheck className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-semibold text-foreground">{overallPercent}%</span>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${overallPercent === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${overallPercent}%` }} />
          </div>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{totalDone}/{totalItems}</span>
      </div>

      {/* Aircraft selector */}
      <AircraftChecklistSelector selectedAircraft={selectedAircraft} onAircraftChange={setSelectedAircraft} />

      {/* Checklist tabs */}
      <Tabs defaultValue="preflight" className="space-y-4">
        <TabsList className="h-auto p-1 bg-muted/50 rounded-xl gap-1 flex flex-wrap">
          {Object.entries(checklists).map(([key, cl]) => {
            const status = getCompletionStatus(key);
            const pct = status.total > 0 ? Math.round((status.completed / status.total) * 100) : 0;
            const isDone = pct === 100;
            return (
              <TabsTrigger key={key} value={key} className="rounded-lg text-xs font-medium gap-2 data-[state=active]:shadow-sm px-3 py-2">
                <span className={isDone ? 'text-success' : ''}>{cl.title}</span>
                {status.total > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${isDone ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {pct}%
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(checklists).map(([checklistKey, checklist]) => (
          <TabsContent key={checklistKey} value={checklistKey} className="space-y-4">
            <Card className="border-border/50 shadow-sm rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{checklist.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{checklist.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => resetChecklist(checklistKey)} className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-8">
                    <RotateCcw className="h-3 w-3" />Reset
                  </Button>
                </div>

                <div className="space-y-6">
                  {checklist.sections.map((section, sectionIndex) => (
                    <ChecklistSection
                      key={sectionIndex}
                      section={section}
                      sectionIndex={sectionIndex}
                      checklistKey={checklistKey}
                      selectedAircraft={selectedAircraft}
                      completedItems={completedItems}
                      onItemToggle={toggleItem}
                    />
                  ))}
                </div>

                <ChecklistProgress {...getCompletionStatus(checklistKey)} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Safety note */}
      <div className="px-5 py-3.5 rounded-2xl border border-border/40 bg-muted/20">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Safety:</span> Based on {selectedAircraft === 'generic' ? 'generic POH procedures' : 'selected aircraft POH'}. Always refer to your specific POH and instructor guidance.
        </p>
      </div>
    </div>
  );
};
