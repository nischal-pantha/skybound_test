import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { DarkModeToggle } from '@/components/ui/dark-mode-toggle';
import { MobileNavigation } from './MobileNavigation';
import { CommandPalette } from './CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { LoadingSpinner } from './LoadingSpinner';

// Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard').then(m => ({ default: m.Dashboard })));
const ProfessionalWeightBalance = lazy(() => import('./ProfessionalWeightBalance').then(m => ({ default: m.ProfessionalWeightBalance })));
const WeatherBriefing = lazy(() => import('./WeatherBriefing').then(m => ({ default: m.WeatherBriefing })));
const Performance = lazy(() => import('./Performance').then(m => ({ default: m.Performance })));
const IntegratedFlightPlanning = lazy(() => import('./IntegratedFlightPlanning').then(m => ({ default: m.IntegratedFlightPlanning })));
const Checklists = lazy(() => import('./Checklists').then(m => ({ default: m.Checklists })));
const Logbook = lazy(() => import('./Logbook').then(m => ({ default: m.Logbook })));
const ScratchPad = lazy(() => import('./ScratchPad').then(m => ({ default: m.ScratchPad })));
const AircraftManager = lazy(() => import('./AircraftManager').then(m => ({ default: m.AircraftManager })));
const Profile = lazy(() => import('./Profile').then(m => ({ default: m.Profile })));
const LiveFlightTracker = lazy(() => import('./LiveFlightTracker').then(m => ({ default: m.LiveFlightTracker })));
const FlightScheduling = lazy(() => import('./FlightScheduling').then(m => ({ default: m.FlightScheduling })));
const FreeAviationChart = lazy(() => import('./FreeAviationChart'));

import { UTCClock } from './UTCClock';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useRealTimeWeather } from '@/hooks/useRealTimeWeather';
import { useSupabaseAircraft } from '@/hooks/useSupabaseAircraft';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plane, Scale, CloudRain, MapPin, FileText, Clock, Settings, BookOpen, 
  Fuel, Radio, Navigation, Gauge, Wifi, WifiOff, Activity, Bell, X,
  AlertCircle, CheckCircle2, Info, AlertTriangle, LogOut, User, ChevronRight, Search,
  Radar, CalendarDays
} from 'lucide-react';

// End of lazy loads

export const ModernMainApp = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications();
  const { weatherData, loading: weatherLoading, fetchMultipleStations } = useRealTimeWeather();
  const { aircraft: customAircraft } = useSupabaseAircraft();
  const { user, signOut } = useAuth();
  
  usePerformanceOptimization();
  useKeyboardShortcuts({
    onNavigate: (section) => handleSectionChange(section),
    onSearch: () => setCommandOpen(true),
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchMultipleStations(['KORD', 'KLAX', 'KJFK', 'KDEN', 'KATL']);
  }, [fetchMultipleStations]);

  const [transitionKey, setTransitionKey] = useState(0);
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section);
    setTransitionKey(k => k + 1);
  }, []);

  const renderMainContent = () => {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-[60vh]"><LoadingSpinner /></div>}>
        <PageTransition key={transitionKey}>
          {(() => {
            switch (activeSection) {
              case 'dashboard': return <Dashboard onNavigate={handleSectionChange} />;
              case 'weight-balance': return <ProfessionalWeightBalance />;
              case 'weather': return <WeatherBriefing />;
              case 'performance': return <Performance />;
              case 'flight-planning': return <IntegratedFlightPlanning />;
              case 'sectional': return <FreeAviationChart />;
              case 'checklists': return <Checklists />;
              case 'logbook': return <Logbook />;
              case 'scratch-pad': return <ScratchPad />;
              case 'utc-clock': return <UTCClock />;
              case 'aircraft-manager': return <AircraftManager />;
              case 'profile': return <Profile />;
              case 'fuel-calculator': return <Performance />;
              case 'frequencies': return <IntegratedFlightPlanning />;
              case 'flight-tracker': return <LiveFlightTracker />;
              case 'scheduling': return <FlightScheduling />;
              default: return <Dashboard onNavigate={handleSectionChange} />;
            }
          })()}
        </PageTransition>
      </Suspense>
    );
  };

  const navSections = [
    { 
      id: 'flight', title: 'Operations',
      items: [
        { id: 'dashboard', title: 'Dashboard', icon: <Gauge className="h-[18px] w-[18px]" /> },
        { id: 'flight-planning', title: 'Flight Planning', icon: <MapPin className="h-[18px] w-[18px]" /> },
        { id: 'sectional', title: 'Charts', icon: <Navigation className="h-[18px] w-[18px]" /> },
        { id: 'weather', title: 'Weather', icon: <CloudRain className="h-[18px] w-[18px]" />, badge: isOnline ? 'Live' : undefined },
        { id: 'flight-tracker', title: 'Flight Tracker', icon: <Radar className="h-[18px] w-[18px]" />, badge: 'Live' },
        { id: 'scheduling', title: 'Schedule', icon: <CalendarDays className="h-[18px] w-[18px]" /> },
      ]
    },
    {
      id: 'aircraft', title: 'Aircraft',
      items: [
        { id: 'weight-balance', title: 'Weight & Balance', icon: <Scale className="h-[18px] w-[18px]" /> },
        { id: 'performance', title: 'Performance', icon: <Plane className="h-[18px] w-[18px]" /> },
        { id: 'fuel-calculator', title: 'Fuel Planning', icon: <Fuel className="h-[18px] w-[18px]" /> },
        { id: 'aircraft-manager', title: 'Aircraft', icon: <Settings className="h-[18px] w-[18px]" /> },
      ]
    },
    {
      id: 'records', title: 'Records',
      items: [
        { id: 'checklists', title: 'Checklists', icon: <FileText className="h-[18px] w-[18px]" /> },
        { id: 'logbook', title: 'Logbook', icon: <BookOpen className="h-[18px] w-[18px]" /> },
        { id: 'frequencies', title: 'Frequencies', icon: <Radio className="h-[18px] w-[18px]" /> },
        { id: 'scratch-pad', title: 'Scratch Pad', icon: <Clock className="h-[18px] w-[18px]" /> },
      ]
    }
  ];

  const activeSectionTitle = navSections
    .flatMap(s => s.items)
    .find(i => i.id === activeSection)?.title || 'Dashboard';

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary relative flex flex-col lg:h-screen lg:overflow-hidden overflow-y-auto">
      {/* Aesthetic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[120px] animate-float animate-delay-negative-2s" />
      </div>

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={handleSectionChange} />

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNavigation activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 h-screen overflow-hidden relative z-10">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'} flex-shrink-0 h-full border-r border-border/60 bg-card/50 backdrop-blur-xl transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className={`h-16 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'} border-b border-border/40`}>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="flex items-center gap-3 group"
              aria-label="Toggle sidebar"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fade-in">
                  <span className="text-[15px] font-semibold tracking-tight text-foreground">SkyBound</span>
                  <span className="text-[15px] font-light text-muted-foreground ml-1">Pro</span>
                </div>
              )}
            </button>
          </div>

          {/* Nav */}
          <ScrollArea className="flex-1 py-4">
            <nav className={`${sidebarCollapsed ? 'px-2' : 'px-3'} space-y-6`}>
              {navSections.map((section) => (
                <div key={section.id}>
                  {!sidebarCollapsed && (
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                      {section.title}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSectionChange(item.id)}
                          className={`w-full flex items-center gap-3 rounded-lg text-[13px] font-medium transition-all duration-200
                            ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
                            ${isActive
                              ? 'bg-primary/10 text-primary shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                          title={sidebarCollapsed ? item.title : undefined}
                        >
                          <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                          {!sidebarCollapsed && (
                            <>
                              <span className="flex-1 text-left">{item.title}</span>
                              {item.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-success/15 text-success font-semibold">
                                  {item.badge}
                                </span>
                              )}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>

          {/* Sidebar Footer */}
          <div className={`border-t border-border/40 ${sidebarCollapsed ? 'p-2' : 'p-3'}`}>
            <button
              onClick={() => handleSectionChange('profile')}
              className={`w-full flex items-center gap-3 rounded-lg text-[13px] transition-all duration-200 hover:bg-muted/60 
                ${sidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'}
                ${activeSection === 'profile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
            >
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              {!sidebarCollapsed && (
                <span className="flex-1 text-left truncate">{user?.email?.split('@')[0] || 'Profile'}</span>
              )}
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          {/* Top Bar */}
          <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-background/80 backdrop-blur-xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">{activeSectionTitle}</h2>
              {isOnline && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[11px] text-muted-foreground font-medium">Live</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-2 h-8 px-3 text-xs text-muted-foreground border-border/60 rounded-lg"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Search</span>
                <kbd className="ml-2 pointer-events-none inline-flex h-5 items-center gap-0.5 rounded border border-border/80 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
                  ⌘K
                </kbd>
              </Button>
              <div className="hidden xl:block">
                <UTCClock embedded />
              </div>

              <Badge variant="outline" className="text-[11px] font-medium hidden xl:flex gap-1 border-border/60">
                <Activity className="w-3 h-3" />
                {weatherLoading ? 'Syncing…' : `${Object.keys(weatherData).length} Stations`}
              </Badge>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
                    <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-xl shadow-lg border-border/60" align="end">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <span className="text-sm font-semibold">Notifications</span>
                    <div className="flex gap-1">
                      {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>Mark read</Button>
                      )}
                      {notifications.length > 0 && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearAll}>Clear</Button>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="max-h-[360px]">
                    {notifications.length === 0 ? (
                      <div className="text-center py-10 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">All caught up</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1">
                        {notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/60 ${!n.read ? 'bg-primary/5' : ''}`}
                          >
                            {getNotificationIcon(n.type)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium leading-tight">{n.title}</p>
                              {n.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.description}</p>}
                              <p className="text-[11px] text-muted-foreground mt-1">{formatTime(n.timestamp)}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <DarkModeToggle />

              <div className="w-px h-6 bg-border/60 mx-1" />

              <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2 text-muted-foreground hover:text-destructive h-9 px-3 text-[13px]">
                <LogOut className="h-4 w-4" />
                <span className="hidden xl:inline">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1400px] mx-auto p-6">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Content */}
      <main className="lg:hidden flex-1 pb-20 overflow-y-auto min-h-[calc(100vh-5rem)]">
        <div className="p-4">
          {renderMainContent()}
        </div>
      </main>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border/40 px-4 py-2 z-30 safe-area-bottom">
        <div className="flex items-center justify-between text-xs">
          <UTCClock embedded />
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            <div className="flex items-center gap-1.5">
              {isOnline ? <Wifi className="h-3 w-3 text-success" /> : <WifiOff className="h-3 w-3 text-destructive" />}
              <span className="text-muted-foreground">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FuelCalculator = () => (
  <Card className="border-border/50 shadow-sm">
    <CardContent className="p-8">
      <div className="text-center space-y-5">
        <div className="mx-auto w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Fuel className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-1">Fuel Planning Calculator</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Advanced fuel consumption and range calculations with weather considerations.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Configure
        </Button>
      </div>
    </CardContent>
  </Card>
);

const RadioFrequencies = () => (
  <Card className="border-border/50 shadow-sm">
    <CardContent className="p-8">
      <div className="text-center space-y-5">
        <div className="mx-auto w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center">
          <Radio className="h-7 w-7 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-1">Radio Frequencies</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Comprehensive database of airport frequencies, approach control, and navigation aids.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Navigation className="h-4 w-4" />
          Browse Database
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default ModernMainApp;
