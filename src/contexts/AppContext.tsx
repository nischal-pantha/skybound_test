import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useGPSLocation, GPSPosition } from '@/hooks/useGPSLocation';
import { useRealTimeData } from '@/hooks/useRealTimeData';
import { useSupabaseAircraft } from '@/hooks/useSupabaseAircraft';
import { FlightCalculator } from '@/utils/flightCalculations';
export interface Waypoint {
  identifier: string;
  lat: number;
  lng: number;
  type: "airport" | "vor" | "fix" | "gps" | "custom";
  altitude?: number;
  notes?: string;
  distance?: number;
  heading?: number;
  groundSpeed?: number;
  timeEnroute?: number;
  fuelUsed?: number;
}

export interface FlightPlan {
  id?: string;
  aircraft: string;
  departure: string;
  destination: string;
  alternate: string;
  route: string;
  altitude: string;
  airspeed: string;
  fuel: string;
  fuelReserve: string;
  fuelFlow?: string;
  passengers: string;
  flightRules: 'VFR' | 'IFR';
  remarks: string;
  waypoints: Waypoint[];
  totalDistance?: number;
  totalTime?: number;
  totalFuel?: number;
  departureTime?: string;
  estimatedArrival?: string;
}

export interface NOTAM {
  id: string;
  location: string;
  type: string;
  effective: string;
  expires: string;
  description: string;
}

export interface AirportInfo {
  icao: string;
  name: string;
  elevation: number;
  runways: Array<{
    designation: string;
    length: number;
    width: number;
    surface: string;
  }>;
  frequencies: {
    tower?: string;
    ground?: string;
    atis?: string;
    unicom?: string;
  };
}

interface AppContextType {
  // GPS
  gpsPosition: GPSPosition | null;
  isGPSTracking: boolean;
  startGPSTracking: () => void;
  stopGPSTracking: () => void;
  getCurrentGPSPosition: () => Promise<GPSPosition>;
  
  // Flight Planning
  currentFlightPlan: FlightPlan | null;
  savedFlightPlans: FlightPlan[];
  updateFlightPlan: (plan: Partial<FlightPlan>) => void;
  saveFlightPlan: (name?: string) => void;
  loadFlightPlan: (id: string) => void;
  deleteFlightPlan: (id: string) => void;
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (index: number) => void;
  updateWaypoint: (index: number, updates: Partial<Waypoint>) => void;
  clearFlightPlan: () => void;
  calculateFlightPlan: () => void;
  
  // Real-time Data
  weatherData: any;
  airports: Map<string, AirportInfo>;
  notams: NOTAM[];
  fetchWeatherData: (icao: string) => Promise<void>;
  fetchAirportData: (icao: string) => Promise<void>;
  fetchNOTAMs: (icao: string) => Promise<void>;
  
  // Aircraft
  selectedAircraft: string | null;
  setSelectedAircraft: (aircraftId: string) => void;
  
  // System State
  isOnline: boolean;
  lastUpdate: number;
  syncStatus: 'synced' | 'syncing' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [currentFlightPlan, setCurrentFlightPlan] = useState<FlightPlan | null>(null);
  const [savedFlightPlans, setSavedFlightPlans] = useState<FlightPlan[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [airports, setAirports] = useState<Map<string, AirportInfo>>(new Map());
  const [notams, setNotams] = useState<NOTAM[]>([]);

  // Hooks
  const gps = useGPSLocation();
  const realTimeData = useRealTimeData();
  const { aircraft: allAircraft, loading: aircraftLoading } = useSupabaseAircraft();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastUpdate(Date.now());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved flight plans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedFlightPlans');
    if (saved) {
      try {
        setSavedFlightPlans(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved flight plans:', e);
      }
    }
  }, []);

  // Save flight plans to localStorage
  useEffect(() => {
    localStorage.setItem('savedFlightPlans', JSON.stringify(savedFlightPlans));
  }, [savedFlightPlans]);

  useEffect(() => {
    if (!selectedAircraft && !aircraftLoading && allAircraft.length > 0) {
      setSelectedAircraft(allAircraft[0].id);
    }
  }, [selectedAircraft, allAircraft, aircraftLoading]);

  // Flight Plan Management
  const updateFlightPlan = useCallback((updates: Partial<FlightPlan>) => {
    setCurrentFlightPlan(prev => {
      // If no plan exists, create a new one with default values
      if (!prev) {
        return {
          aircraft: '',
          departure: '',
          destination: '',
          alternate: '',
          route: '',
          altitude: '',
          airspeed: '',
          fuel: '',
          fuelReserve: '',
          passengers: '',
          flightRules: 'VFR' as const,
          remarks: '',
          waypoints: [],
          ...updates
        };
      }
      return { ...prev, ...updates };
    });
    setLastUpdate(Date.now());
  }, []);

  const addWaypoint = useCallback((waypoint: Waypoint) => {
    setCurrentFlightPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        waypoints: [...prev.waypoints, waypoint]
      };
    });
    setLastUpdate(Date.now());
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setCurrentFlightPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        waypoints: prev.waypoints.filter((_, i) => i !== index)
      };
    });
    setLastUpdate(Date.now());
  }, []);

  const updateWaypoint = useCallback((index: number, updates: Partial<Waypoint>) => {
    setCurrentFlightPlan(prev => {
      if (!prev) return null;
      return {
        ...prev,
        waypoints: prev.waypoints.map((wp, i) => i === index ? { ...wp, ...updates } : wp)
      };
    });
    setLastUpdate(Date.now());
  }, []);

  const clearFlightPlan = useCallback(() => {
    setCurrentFlightPlan(null);
    setLastUpdate(Date.now());
  }, []);

  const saveFlightPlan = useCallback((name?: string) => {
    if (!currentFlightPlan) return;
    
    const planToSave: FlightPlan = {
      ...currentFlightPlan,
      id: currentFlightPlan.id || `fp-${Date.now()}`,
    };
    
    setSavedFlightPlans(prev => {
      const existing = prev.findIndex(p => p.id === planToSave.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = planToSave;
        return updated;
      }
      return [...prev, planToSave];
    });
    setLastUpdate(Date.now());
  }, [currentFlightPlan]);

  const loadFlightPlan = useCallback((id: string) => {
    const plan = savedFlightPlans.find(p => p.id === id);
    if (plan) {
      setCurrentFlightPlan(plan);
      setLastUpdate(Date.now());
    }
  }, [savedFlightPlans]);

  const deleteFlightPlan = useCallback((id: string) => {
    setSavedFlightPlans(prev => prev.filter(p => p.id !== id));
    if (currentFlightPlan?.id === id) {
      setCurrentFlightPlan(null);
    }
    setLastUpdate(Date.now());
  }, [currentFlightPlan]);

  const calculateFlightPlan = useCallback(() => {
    if (!currentFlightPlan || !currentFlightPlan.waypoints || currentFlightPlan.waypoints.length < 2) {
      console.warn('Not enough waypoints to calculate flight plan');
      return;
    }
    
    // FlightCalculator already imported at top
    let totalDistance = 0;
    let totalTime = 0;
    let totalFuel = 0;
    const airspeed = parseFloat(currentFlightPlan.airspeed || '120') || 120;
    const fuelFlow = parseFloat(currentFlightPlan.fuelFlow || '10') || 10; // gallons per hour
    
    const updatedWaypoints = currentFlightPlan.waypoints.map((wp, idx) => {
      if (idx === 0) return { ...wp, distance: 0, heading: 0, groundSpeed: airspeed, timeEnroute: 0, fuelUsed: 0 };
      
      const prev = currentFlightPlan.waypoints[idx - 1];
      const calc = FlightCalculator.calculateFlightLeg(
        { lat: prev.lat, lng: prev.lng },
        { lat: wp.lat, lng: wp.lng },
        airspeed,
        0, // wind direction
        0, // wind speed
        fuelFlow
      );
      
      totalDistance += calc.distance;
      totalTime += calc.timeEnroute;
      totalFuel += calc.fuelUsed;
      
      return {
        ...wp,
        distance: calc.distance,
        heading: calc.heading,
        groundSpeed: calc.groundSpeed,
        timeEnroute: calc.timeEnroute,
        fuelUsed: calc.fuelUsed
      };
    });
    
    setCurrentFlightPlan(prev => prev ? {
      ...prev,
      waypoints: updatedWaypoints,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: Math.round(totalTime),
      totalFuel: Math.round(totalFuel * 10) / 10
    } : null);
    setLastUpdate(Date.now());
  }, [currentFlightPlan]);

  const fetchAirportData = useCallback(async (icao: string) => {
    setSyncStatus('syncing');
    try {
      // Mock airport data - in production, fetch from FAA/aviation API
      const airportInfo: AirportInfo = {
        icao: icao.toUpperCase(),
        name: `${icao.toUpperCase()} Airport`,
        elevation: 0,
        runways: [
          { designation: '10/28', length: 5000, width: 100, surface: 'Asphalt' }
        ],
        frequencies: {
          tower: '118.3',
          ground: '121.9',
          atis: '126.05',
        }
      };
      
      setAirports(prev => new Map(prev).set(icao.toUpperCase(), airportInfo));
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to fetch airport data:', error);
      setSyncStatus('error');
    }
  }, []);

  const fetchNOTAMs = useCallback(async (icao: string) => {
    setSyncStatus('syncing');
    try {
      // Mock NOTAM data - in production, fetch from FAA NOTAM API
      const mockNotams: NOTAM[] = [
        {
          id: `${icao}-001`,
          location: icao.toUpperCase(),
          type: 'Runway',
          effective: new Date().toISOString(),
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Runway 10/28 taxiway edge lights out of service'
        }
      ];
      
      setNotams(mockNotams);
      setSyncStatus('synced');
    } catch (error) {
      console.error('Failed to fetch NOTAMs:', error);
      setSyncStatus('error');
    }
  }, []);

  const value: AppContextType = {
    // GPS
    gpsPosition: gps.position,
    isGPSTracking: gps.isTracking,
    startGPSTracking: gps.startTracking,
    stopGPSTracking: gps.stopTracking,
    getCurrentGPSPosition: gps.getCurrentPosition,
    
    // Flight Planning
    currentFlightPlan,
    savedFlightPlans,
    updateFlightPlan,
    saveFlightPlan,
    loadFlightPlan,
    deleteFlightPlan,
    addWaypoint,
    removeWaypoint,
    updateWaypoint,
    clearFlightPlan,
    calculateFlightPlan,
    
    // Real-time Data
    weatherData: realTimeData.weatherData,
    airports,
    notams,
    fetchWeatherData: realTimeData.fetchWeatherData,
    fetchAirportData,
    fetchNOTAMs,
    
    // Aircraft
    selectedAircraft,
    setSelectedAircraft,
    
    // System State
    isOnline,
    lastUpdate,
    syncStatus
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
