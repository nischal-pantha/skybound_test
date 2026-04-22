import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { ChecklistItem as ChecklistItemType } from "@/data/aircraftChecklists";

interface ChecklistItemProps {
  item: ChecklistItemType;
  isChecked: boolean;
  onToggle: () => void;
  itemId: string;
}

export const ChecklistItem = ({ item, isChecked, onToggle, itemId }: ChecklistItemProps) => {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 border ${
      isChecked
        ? 'bg-success/5 border-success/20'
        : 'bg-background border-border/40 hover:border-primary/30 hover:bg-muted/30'
    } ${item.critical ? 'border-l-[3px] border-l-destructive' : ''}`}>
      <Checkbox
        id={itemId}
        checked={isChecked}
        onCheckedChange={onToggle}
        className="mt-0.5 data-[state=checked]:bg-success data-[state=checked]:border-success rounded-md"
      />
      <div className="flex-1 min-w-0">
        <label
          htmlFor={itemId}
          className={`cursor-pointer text-sm leading-relaxed font-medium transition-colors flex items-start gap-2 ${
            isChecked ? 'text-success line-through opacity-70' : 'text-foreground'
          }`}
        >
          <span className="flex-1">{item.text}</span>
          {item.critical && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 rounded-md shrink-0">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              CRITICAL
            </Badge>
          )}
        </label>
        {item.note && (
          <p className="text-[11px] text-muted-foreground mt-1">{item.note}</p>
        )}
      </div>
    </div>
  );
};
