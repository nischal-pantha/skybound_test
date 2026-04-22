
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { AircraftChecklist } from "@/data/aircraftChecklists";

interface ChecklistTabProps {
  checklistKey: string;
  checklist: AircraftChecklist;
  completionStatus: { completed: number; total: number };
  isActive: boolean;
  onSelect: (key: string) => void;
}

const iconMap = {
  Settings: () => <div className="h-4 w-4 bg-current rounded" />,
  Zap: () => <div className="h-4 w-4 bg-current" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />,
  Plane: () => <div className="h-4 w-4 bg-current rounded-full" />,
  ClipboardCheck: () => <div className="h-4 w-4 bg-current rounded-sm" />,
  AlertTriangle: () => <div className="h-4 w-4 bg-current" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
};

export const ChecklistTab = ({ 
  checklistKey, 
  checklist, 
  completionStatus, 
  isActive, 
  onSelect 
}: ChecklistTabProps) => {
  const isComplete = completionStatus.completed === completionStatus.total;
  const IconComponent = iconMap[checklist.icon as keyof typeof iconMap] || iconMap.ClipboardCheck;
  
  return (
    <button
      onClick={() => onSelect(checklistKey)}
      className={`flex items-center gap-2 relative hover:bg-accent transition-all p-3 rounded-md ${
        isActive ? 'bg-primary text-primary-foreground' : 'bg-background'
      }`}
    >
      <IconComponent />
      <span className="hidden sm:inline font-medium">{checklist.title.split(' ')[0]}</span>
      <span className="sm:hidden font-medium">{checklist.title.split(' ')[0].slice(0, 3)}</span>
      {isComplete && <CheckCircle className="h-4 w-4 text-green-600" />}
      <Badge 
        variant={isComplete ? "default" : "secondary"} 
        className={`ml-1 ${
          isComplete ? 'bg-green-100 text-green-800' : 'bg-muted text-muted-foreground'
        }`}
      >
        {completionStatus.completed}/{completionStatus.total}
      </Badge>
    </button>
  );
};
