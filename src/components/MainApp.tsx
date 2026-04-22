import { useState, useEffect } from 'react';
import { MobileNavigation } from './MobileNavigation';
import { ProfessionalWeightBalance } from './ProfessionalWeightBalance';
import { WeatherBriefing } from './WeatherBriefing';
import { Performance } from './Performance';
import { IntegratedFlightPlanning } from './IntegratedFlightPlanning';
import { Checklists } from './Checklists';
import { Logbook } from './Logbook';
import { ScratchPad } from './ScratchPad';
import { UTCClock } from './UTCClock';
import { AircraftManager } from './AircraftManager';
import { Profile } from './Profile';

import { Dashboard } from './Dashboard';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useCustomAircraft } from '@/hooks/useCustomAircraft';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plane,
  Scale,
  CloudRain,
  MapPin,
  FileText,
  Clock,
  Settings,
  User,
  BookOpen,
  Fuel,
  Radio,
  Navigation,
  Gauge,
  Wifi,
  WifiOff
} from 'lucide-react';

interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps";
  altitude?: number;
  notes?: string;
}

export const MainApp = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedWaypoints, setSelectedWaypoints] = useState<Waypoint[]>([]);
  const { weatherData, loading: weatherLoading, fetchWeatherData } = useRealTimeData();
  const { customAircraft } = useCustomAircraft();

  // Monitor online status
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

  // Auto-fetch weather for common airports on startup
  useEffect(() => {
    const commonAirports = ['KORD', 'KLAX', 'KJFK', 'KDEN', 'KATL'];
    commonAirports.forEach(airport => {
      fetchWeatherData(airport);
    });
  }, [fetchWeatherData]);

  const handleWaypointAdd = (waypoint: Waypoint) => {
    setSelectedWaypoints(prev => [...prev, waypoint]);
  };

  const handleWaypointUpdate = (index: number, updates: Partial<Waypoint>) => {
    setSelectedWaypoints(prev => 
      prev.map((waypoint, i) => i === index ? { ...waypoint, ...updates } : waypoint)
    );
  };

  const handleWaypointRemove = (index: number) => {
    setSelectedWaypoints(prev => prev.filter((_, i) => i !== index));
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'weight-balance':
        return <ProfessionalWeightBalance />;
      case 'weather':
        return <WeatherBriefing />;
      case 'performance':
        return <Performance />;
      case 'flight-planning':
        return <IntegratedFlightPlanning />;
      case 'checklists':
        return <Checklists />;
      case 'logbook':
        return <Logbook />;
      case 'scratch-pad':
        return <ScratchPad />;
      case 'utc-clock':
        return <UTCClock />;
      case 'aircraft-manager':
        return <AircraftManager />;
      case 'profile':
        return <Profile />;
      case 'sectional':
        return <div>Charts section consolidated into Flight Planning</div>;
      case 'fuel-calculator':
        return <FuelCalculator />;
      case 'frequencies':
        return <RadioFrequencies />;
      default:
        return <Dashboard />;
    }
  };

  const desktopNavItems = [
    { id: 'dashboard', title: 'Dashboard', icon: <Gauge className="h-4 w-4" /> },
    { id: 'weight-balance', title: 'W&B', icon: <Scale className="h-4 w-4" /> },
    { id: 'weather', title: 'Weather', icon: <CloudRain className="h-4 w-4" />, badge: 'Live' },
    { id: 'flight-planning', title: 'Planning', icon: <MapPin className="h-4 w-4" /> },
    { id: 'performance', title: 'Performance', icon: <Plane className="h-4 w-4" /> },
    { id: 'checklists', title: 'Checklists', icon: <FileText className="h-4 w-4" /> },
    { id: 'logbook', title: 'Logbook', icon: <BookOpen className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile Navigation */}
      <MobileNavigation 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />

      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <nav className="bg-white/90 backdrop-blur-sm border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg">
                  <Plane className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">SkyBound Pilot</h1>
                  <p className="text-xs text-gray-500">Professional Aviation Suite</p>
                </div>
              </div>

              {/* Desktop Navigation Tabs */}
              <Tabs value={activeSection} onValueChange={setActiveSection} className="flex-1 max-w-4xl mx-8">
                <TabsList className="grid w-full grid-cols-7 bg-gray-100">
                  {desktopNavItems.map((item) => (
                    <TabsTrigger
                      key={item.id}
                      value={item.id}
                      className="flex items-center gap-2 text-xs font-medium"
                    >
                      {item.icon}
                      <span className="hidden xl:inline">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Status Indicators */}
              <div className="flex items-center gap-3">
                <UTCClock />
                <div className="flex items-center gap-1">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-600">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <Badge variant={weatherLoading ? "secondary" : "default"} className="text-xs">
                  {weatherLoading ? 'Updating...' : `${weatherData.size} Airports`}
                </Badge>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {renderMainContent()}
        </div>
      </main>

      {/* Mobile Status Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t px-4 py-2 z-30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <UTCClock />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {isOnline ? (
                <Wifi className="h-3 w-3 text-green-500" />
              ) : (
                <WifiOff className="h-3 w-3 text-red-500" />
              )}
              <span className="text-gray-600">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant="outline" className="text-[10px]">
              {Object.keys(customAircraft).length} Aircraft
            </Badge>
            <Badge variant={weatherLoading ? "secondary" : "default"} className="text-[10px]">
              Weather: {weatherLoading ? 'Updating...' : 'Live'}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple components for missing features
const FuelCalculator = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Fuel className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Fuel Calculator</h2>
      </div>
      <p className="text-gray-600">Advanced fuel planning and consumption calculator coming soon...</p>
    </CardContent>
  </Card>
);

const RadioFrequencies = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <Radio className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Radio Frequencies</h2>
      </div>
      <p className="text-gray-600">Airport frequencies and radio navigation aids database coming soon...</p>
    </CardContent>
  </Card>
);
