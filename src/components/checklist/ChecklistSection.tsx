import { ChecklistSection as ChecklistSectionType } from "@/data/aircraftChecklists";
import { ChecklistItem } from "./ChecklistItem";

interface ChecklistSectionProps {
  section: ChecklistSectionType;
  sectionIndex: number;
  checklistKey: string;
  selectedAircraft: string;
  completedItems: Record<string, boolean>;
  onItemToggle: (checklistKey: string, sectionIndex: number, itemIndex: number) => void;
}

export const ChecklistSection = ({ section, sectionIndex, checklistKey, selectedAircraft, completedItems, onItemToggle }: ChecklistSectionProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 bg-primary rounded-full" />
        <h4 className="text-sm font-semibold text-foreground">{section.name}</h4>
      </div>
      <div className="space-y-2 pl-3.5">
        {section.items.map((item, itemIndex) => {
          const itemId = `${selectedAircraft}-${checklistKey}-${sectionIndex}-${itemIndex}`;
          return (
            <ChecklistItem
              key={itemIndex}
              item={item}
              isChecked={completedItems[itemId] || false}
              onToggle={() => onItemToggle(checklistKey, sectionIndex, itemIndex)}
              itemId={itemId}
            />
          );
        })}
      </div>
    </div>
  );
};
