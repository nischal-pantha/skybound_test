import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  Menu, Scale, MapPin, CloudRain, Plane, FileText, Clock, Settings, User,
  BookOpen, Fuel, Navigation, Radio, Gauge
} from 'lucide-react';

interface MobileNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const sections = [
  { title: 'Operations', items: [
    { id: 'dashboard', title: 'Dashboard', icon: <Gauge className="h-[18px] w-[18px]" /> },
    { id: 'flight-planning', title: 'Flight Planning', icon: <MapPin className="h-[18px] w-[18px]" /> },
    { id: 'sectional', title: 'Charts', icon: <Navigation className="h-[18px] w-[18px]" /> },
    { id: 'weather', title: 'Weather', icon: <CloudRain className="h-[18px] w-[18px]" /> },
  ]},
  { title: 'Aircraft', items: [
    { id: 'weight-balance', title: 'Weight & Balance', icon: <Scale className="h-[18px] w-[18px]" /> },
    { id: 'performance', title: 'Performance', icon: <Plane className="h-[18px] w-[18px]" /> },
    { id: 'fuel-calculator', title: 'Fuel Planning', icon: <Fuel className="h-[18px] w-[18px]" /> },
    { id: 'aircraft-manager', title: 'Aircraft', icon: <Settings className="h-[18px] w-[18px]" /> },
  ]},
  { title: 'Records', items: [
    { id: 'checklists', title: 'Checklists', icon: <FileText className="h-[18px] w-[18px]" /> },
    { id: 'logbook', title: 'Logbook', icon: <BookOpen className="h-[18px] w-[18px]" /> },
    { id: 'frequencies', title: 'Frequencies', icon: <Radio className="h-[18px] w-[18px]" /> },
    { id: 'scratch-pad', title: 'Scratch Pad', icon: <Clock className="h-[18px] w-[18px]" /> },
    { id: 'profile', title: 'Profile', icon: <User className="h-[18px] w-[18px]" /> },
  ]},
];

export const MobileNavigation = ({ activeSection, onSectionChange }: MobileNavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-50 lg:hidden h-10 w-10 rounded-xl bg-background/80 backdrop-blur-xl border border-border/50 shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[280px] p-0 border-r border-border/40">
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-border/40">
          <SheetTitle className="flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-[15px] font-semibold">SkyBound</span>
              <span className="text-[15px] font-light text-muted-foreground ml-1">Pro</span>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                        }`}
                      onClick={() => { onSectionChange(item.id); setIsOpen(false); }}
                    >
                      <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                      {item.title}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
