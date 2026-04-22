import { useState, useEffect } from 'react';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandShortcut
} from '@/components/ui/command';
import {
  Gauge, MapPin, Navigation, CloudRain, Scale, Plane, Fuel, Settings,
  FileText, BookOpen, Radio, Clock, User
} from 'lucide-react';

const sections = [
  { id: 'dashboard', title: 'Dashboard', icon: Gauge, shortcut: '1', group: 'Operations' },
  { id: 'flight-planning', title: 'Flight Planning', icon: MapPin, shortcut: '2', group: 'Operations' },
  { id: 'sectional', title: 'Charts', icon: Navigation, shortcut: '3', group: 'Operations' },
  { id: 'weather', title: 'Weather', icon: CloudRain, shortcut: '4', group: 'Operations' },
  { id: 'weight-balance', title: 'Weight & Balance', icon: Scale, shortcut: '5', group: 'Aircraft' },
  { id: 'performance', title: 'Performance', icon: Plane, shortcut: '6', group: 'Aircraft' },
  { id: 'fuel-calculator', title: 'Fuel Planning', icon: Fuel, group: 'Aircraft' },
  { id: 'aircraft-manager', title: 'Aircraft Manager', icon: Settings, group: 'Aircraft' },
  { id: 'checklists', title: 'Checklists', icon: FileText, shortcut: '7', group: 'Records' },
  { id: 'logbook', title: 'Logbook', icon: BookOpen, shortcut: '8', group: 'Records' },
  { id: 'frequencies', title: 'Frequencies', icon: Radio, group: 'Records' },
  { id: 'scratch-pad', title: 'Scratch Pad', icon: Clock, group: 'Records' },
  { id: 'profile', title: 'Profile', icon: User, group: 'Records' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (section: string) => void;
}

export const CommandPalette = ({ open, onOpenChange, onNavigate }: CommandPaletteProps) => {
  const groups = ['Operations', 'Aircraft', 'Records'];

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search sections… (⌘K)" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map(group => (
          <CommandGroup key={group} heading={group}>
            {sections.filter(s => s.group === group).map(item => (
              <CommandItem
                key={item.id}
                onSelect={() => { onNavigate(item.id); onOpenChange(false); }}
                className="gap-3 cursor-pointer"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
