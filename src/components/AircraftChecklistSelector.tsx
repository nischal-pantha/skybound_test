
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plane, Plus, Settings, ChevronDown, Check, ChevronRight } from "lucide-react";
import { getAvailableAircraftForChecklists } from "@/data/aircraftChecklists";
import { useAircraftIntegration } from "@/hooks/useAircraftIntegration";
import { cn } from "@/lib/utils";

interface AircraftChecklistSelectorProps {
  selectedAircraft: string;
  onAircraftChange: (aircraftId: string) => void;
  onAddCustomChecklist?: () => void;
}

export const AircraftChecklistSelector = ({ 
  selectedAircraft, 
  onAircraftChange,
  onAddCustomChecklist 
}: AircraftChecklistSelectorProps) => {
  const { aircraftList } = useAircraftIntegration();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const standardAircraft = getAvailableAircraftForChecklists();
  
  const getAircraftDisplayName = (aircraftId: string) => {
    if (aircraftId === 'generic') return 'Generic Aircraft';
    
    const standard = standardAircraft.find(a => a.id === aircraftId);
    if (standard) return `${standard.manufacturer} ${standard.model}`;
    
    const custom = aircraftList.find(a => a.id === aircraftId);
    if (custom) return custom.fullIdentifier;
    
    return 'Unknown Aircraft';
  };

  const getAircraftType = (aircraftId: string) => {
    if (aircraftId === 'generic') return 'Universal';
    
    const standard = standardAircraft.find(a => a.id === aircraftId);
    if (standard) return 'Standard';
    
    const custom = aircraftList.find(a => a.id === aircraftId);
    if (custom) return 'Custom';
    
    return 'Unknown';
  };

  const selectedAircraftData = {
    id: selectedAircraft,
    name: getAircraftDisplayName(selectedAircraft),
    type: getAircraftType(selectedAircraft)
  };

  return (
    <>
      <div className={cn(
        "fixed top-4 right-4 z-50 transition-all duration-500 ease-in-out",
        isExpanded ? "w-96" : "w-auto"
      )}>
        {!isExpanded ? (
          <Button
            onClick={() => setIsExpanded(true)}
            className="group bg-gradient-to-r from-primary to-primary/60 hover:from-primary/90 hover:to-primary/50 text-primary-foreground shadow-lg hover:shadow-xl border-0 rounded-full p-3 transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Aircraft</span>
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Button>
        ) : (
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background/95 via-background/95 to-primary/5 backdrop-blur-sm shadow-2xl animate-fade-in">
            <CardHeader className="">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="p-2 bg-gradient-to-br from-primary to-primary/60 rounded-lg shadow-md">
                      <Plane className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      Aircraft
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Select for tailored procedures
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-2 py-1 text-xs font-medium shadow-sm",
                      selectedAircraftData.type === 'Standard' && "bg-primary/10 border-primary/20 text-primary",
                      selectedAircraftData.type === 'Custom' && "bg-purple-50 border-purple-200 text-purple-700",
                      selectedAircraftData.type === 'Universal' && "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    {selectedAircraftData.type}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0 hover:bg-accent rounded-full"
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 pt-0">
              <div className="p-3 bg-gradient-to-r from-muted/50 to-primary/5 rounded-lg border border-border">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Currently Selected</p>
                    <p className="text-sm font-bold text-foreground truncate">{selectedAircraftData.name}</p>
                  </div>
                </div>
              </div>

              <Separator className="my-3" />
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
                  <h3 className="text-xs font-semibold text-foreground">Certified Aircraft</h3>
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  <button
                    onClick={() => onAircraftChange('generic')}
                    className={cn(
                      "w-full flex items-center justify-between p-2 rounded-md border transition-all duration-200",
                      selectedAircraft === 'generic' 
                        ? "border-primary bg-primary/10 shadow-sm" 
                        : "border-border hover:border-primary/30 hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-muted rounded">
                        <Plane className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-medium text-foreground">Generic Aircraft</p>
                        <p className="text-xs text-muted-foreground">Universal procedures</p>
                      </div>
                    </div>
                    {selectedAircraft === 'generic' && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>

                  {standardAircraft.map((aircraft) => (
                    <button
                      key={aircraft.id}
                      onClick={() => onAircraftChange(aircraft.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2 rounded-md border transition-all duration-200",
                        selectedAircraft === aircraft.id 
                          ? "border-primary bg-primary/10 shadow-sm" 
                          : "border-border hover:border-primary/30 hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-primary/10 rounded">
                          <Plane className="h-3 w-3 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-medium text-foreground truncate">
                            {aircraft.manufacturer} {aircraft.model}
                          </p>
                          <p className="text-xs text-muted-foreground">POH-specific</p>
                        </div>
                      </div>
                      {selectedAircraft === aircraft.id && (
                        <Check className="h-3 w-3 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {aircraftList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1 w-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" />
                    <h3 className="text-xs font-semibold text-foreground">Your Aircraft</h3>
                  </div>
                  
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {aircraftList.map((aircraft) => (
                      <button
                        key={aircraft.id}
                        onClick={() => onAircraftChange(aircraft.id)}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-md border transition-all duration-200",
                          selectedAircraft === aircraft.id 
                            ? "border-purple-500 bg-purple-50 shadow-sm" 
                            : "border-border hover:border-purple-300 hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-purple-100 rounded">
                            <Plane className="h-3 w-3 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-medium text-foreground truncate">{aircraft.fullIdentifier}</p>
                            <p className="text-xs text-muted-foreground">Custom config</p>
                          </div>
                        </div>
                        {selectedAircraft === aircraft.id && (
                          <Check className="h-3 w-3 text-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Settings className="h-3 w-3" />
                  <span>Auto-adapt checklists</span>
                </div>
                {onAddCustomChecklist && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddCustomChecklist}
                    className="h-7 px-2 text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {isExpanded && (
        <div 
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
};
