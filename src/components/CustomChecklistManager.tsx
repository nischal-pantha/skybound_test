
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  text: string;
  critical?: boolean;
  note?: string;
}

interface ChecklistSection {
  name: string;
  items: ChecklistItem[];
}

interface CustomChecklist {
  title: string;
  description: string;
  sections: ChecklistSection[];
}

interface CustomAircraftChecklists {
  aircraftId: string;
  aircraftName: string;
  checklists: {
    preflight: CustomChecklist;
    runup: CustomChecklist;
    takeoff: CustomChecklist;
    approach: CustomChecklist;
    emergency: CustomChecklist;
  };
}

export const CustomChecklistManager = () => {
  const [customChecklists, setCustomChecklists] = useState<Record<string, CustomAircraftChecklists>>({});
  const [editingAircraft, setEditingAircraft] = useState<string>('');
  const [newAircraftName, setNewAircraftName] = useState('');
  const [activeChecklist, setActiveChecklist] = useState<'preflight' | 'runup' | 'takeoff' | 'approach' | 'emergency'>('preflight');
  const { toast } = useToast();

  const createNewAircraft = () => {
    if (!newAircraftName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an aircraft name",
        variant: "destructive",
      });
      return;
    }

    const aircraftId = newAircraftName.toLowerCase().replace(/\s+/g, '-');
    
    if (customChecklists[aircraftId]) {
      toast({
        title: "Error",
        description: "Aircraft already exists",
        variant: "destructive",
      });
      return;
    }

    const newAircraft: CustomAircraftChecklists = {
      aircraftId,
      aircraftName: newAircraftName,
      checklists: {
        preflight: {
          title: "Pre-Flight Inspection",
          description: `Pre-flight inspection for ${newAircraftName}`,
          sections: [
            {
              name: "Cabin Interior",
              items: [
                { text: "Required documents - CHECK", critical: true },
                { text: "Weight and balance - CALCULATED", critical: true }
              ]
            }
          ]
        },
        runup: {
          title: "Engine Run-Up",
          description: `Engine start and run-up for ${newAircraftName}`,
          sections: [
            {
              name: "Before Engine Start",
              items: [
                { text: "Preflight inspection - COMPLETE", critical: true }
              ]
            }
          ]
        },
        takeoff: {
          title: "Before Takeoff",
          description: `Before takeoff checks for ${newAircraftName}`,
          sections: [
            {
              name: "Final Checks",
              items: [
                { text: "Flight controls - FREE AND CORRECT", critical: true }
              ]
            }
          ]
        },
        approach: {
          title: "Approach & Landing",
          description: `Approach and landing for ${newAircraftName}`,
          sections: [
            {
              name: "Before Landing",
              items: [
                { text: "Approach briefing - COMPLETE" }
              ]
            }
          ]
        },
        emergency: {
          title: "Emergency Procedures",
          description: `Emergency procedures for ${newAircraftName}`,
          sections: [
            {
              name: "Engine Failure",
              items: [
                { text: "Airspeed - BEST GLIDE", critical: true }
              ]
            }
          ]
        }
      }
    };

    setCustomChecklists(prev => ({
      ...prev,
      [aircraftId]: newAircraft
    }));

    setEditingAircraft(aircraftId);
    setNewAircraftName('');

    toast({
      title: "Success",
      description: `Created checklist for ${newAircraftName}`,
    });
  };

  const addSection = (checklistType: string) => {
    if (!editingAircraft) return;

    const newSection: ChecklistSection = {
      name: "New Section",
      items: [{ text: "New item - CHECK" }]
    };

    setCustomChecklists(prev => ({
      ...prev,
      [editingAircraft]: {
        ...prev[editingAircraft],
        checklists: {
          ...prev[editingAircraft].checklists,
          [checklistType]: {
            ...prev[editingAircraft].checklists[checklistType],
            sections: [...prev[editingAircraft].checklists[checklistType].sections, newSection]
          }
        }
      }
    }));
  };

  const addItem = (checklistType: string, sectionIndex: number) => {
    if (!editingAircraft) return;

    const newItem: ChecklistItem = {
      text: "New item - CHECK"
    };

    setCustomChecklists(prev => {
      const updated = { ...prev };
      updated[editingAircraft].checklists[checklistType].sections[sectionIndex].items.push(newItem);
      return updated;
    });
  };

  const updateItem = (checklistType: string, sectionIndex: number, itemIndex: number, updates: Partial<ChecklistItem>) => {
    if (!editingAircraft) return;

    setCustomChecklists(prev => {
      const updated = { ...prev };
      updated[editingAircraft].checklists[checklistType].sections[sectionIndex].items[itemIndex] = {
        ...updated[editingAircraft].checklists[checklistType].sections[sectionIndex].items[itemIndex],
        ...updates
      };
      return updated;
    });
  };

  const removeItem = (checklistType: string, sectionIndex: number, itemIndex: number) => {
    if (!editingAircraft) return;

    setCustomChecklists(prev => {
      const updated = { ...prev };
      updated[editingAircraft].checklists[checklistType].sections[sectionIndex].items.splice(itemIndex, 1);
      return updated;
    });
  };

  const saveChecklists = () => {
    // Here you would typically save to localStorage or send to a server
    localStorage.setItem('customAircraftChecklists', JSON.stringify(customChecklists));
    
    toast({
      title: "Success",
      description: "Custom checklists saved successfully",
    });
  };

  const currentChecklist = editingAircraft && customChecklists[editingAircraft] 
    ? customChecklists[editingAircraft].checklists[activeChecklist] 
    : null;

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Checklist Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter aircraft name (e.g., N12345 - Piper PA-28)"
              value={newAircraftName}
              onChange={(e) => setNewAircraftName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={createNewAircraft}>
              <Plus className="h-4 w-4 mr-2" />
              Create Aircraft
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={editingAircraft} onValueChange={setEditingAircraft}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select aircraft to edit" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(customChecklists).map(([id, aircraft]) => (
                  <SelectItem key={id} value={id}>
                    {aircraft.aircraftName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={saveChecklists} variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Save All
            </Button>
          </div>
        </CardContent>
      </Card>

      {editingAircraft && currentChecklist && (
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle>
              Editing: {customChecklists[editingAircraft].aircraftName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeChecklist} onValueChange={(value) => setActiveChecklist(value as any)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="preflight">Pre-Flight</TabsTrigger>
                <TabsTrigger value="runup">Run-Up</TabsTrigger>
                <TabsTrigger value="takeoff">Takeoff</TabsTrigger>
                <TabsTrigger value="approach">Approach</TabsTrigger>
                <TabsTrigger value="emergency">Emergency</TabsTrigger>
              </TabsList>

              <TabsContent value={activeChecklist} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{currentChecklist.title}</h3>
                  <Button
                    onClick={() => addSection(activeChecklist)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </Button>
                </div>

                {currentChecklist.sections.map((section, sectionIndex) => (
                  <Card key={sectionIndex} className="border border-gray-200">
                    <CardHeader className="pb-2">
                      <Input
                        value={section.name}
                        onChange={(e) => {
                          setCustomChecklists(prev => {
                            const updated = { ...prev };
                            updated[editingAircraft].checklists[activeChecklist].sections[sectionIndex].name = e.target.value;
                            return updated;
                          });
                        }}
                        className="font-medium"
                      />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start gap-2 p-2 border rounded">
                          <div className="flex-1 space-y-2">
                            <Input
                              value={item.text}
                              onChange={(e) => updateItem(activeChecklist, sectionIndex, itemIndex, { text: e.target.value })}
                              placeholder="Checklist item text"
                            />
                            <Input
                              value={item.note || ''}
                              onChange={(e) => updateItem(activeChecklist, sectionIndex, itemIndex, { note: e.target.value })}
                              placeholder="Optional note"
                              className="text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <Label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={item.critical || false}
                                  onChange={(e) => updateItem(activeChecklist, sectionIndex, itemIndex, { critical: e.target.checked })}
                                />
                                Critical Item
                              </Label>
                              {item.critical && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  CRITICAL
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => removeItem(activeChecklist, sectionIndex, itemIndex)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      <Button
                        onClick={() => addItem(activeChecklist, sectionIndex)}
                        size="sm"
                        variant="ghost"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-800">
          <strong>Important:</strong> Custom checklists should be based on your aircraft's specific POH procedures. 
          Always have them reviewed by a qualified instructor before use. These checklists are stored locally in your browser.
        </p>
      </div>
    </div>
  );
};
