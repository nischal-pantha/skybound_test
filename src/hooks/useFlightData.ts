import { useLocalStorage } from './useLocalStorage';

export interface FlightEntry {
  id: string;
  date: string;
  aircraft: string;
  departure: string;
  destination: string;
  route: string;
  flightTime: number;
  landings: number;
  approaches: number;
  holds: number;
  crossCountry: number;
  night: number;
  instrument: number;
  solo: boolean;
  dual: boolean;
  pic: boolean;
  instructor: string;
  remarks: string;
  waypoints?: Array<{
    identifier: string;
    lat: number;
    lng: number;
    type: "airport" | "vor" | "fix" | "gps";
    altitude?: number;
    notes?: string;
  }>;
  createdAt: string;
}

export interface FlightSchedule {
  id: string;
  date: string;
  time: string;
  aircraft: string;
  instructor: string;
  type: string;
  duration: number;
  notes: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export function useFlightData() {
  const [flightEntries, setFlightEntries] = useLocalStorage<FlightEntry[]>('flightEntries', []);
  const [flightSchedules, setFlightSchedules] = useLocalStorage<FlightSchedule[]>('flightSchedules', []);
  
  const addFlightEntry = (entry: Omit<FlightEntry, 'id' | 'createdAt'>) => {
    const newEntry: FlightEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setFlightEntries(prev => [...prev, newEntry]);
    return newEntry;
  };

  const updateFlightEntry = (id: string, updates: Partial<FlightEntry>) => {
    setFlightEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  };

  const deleteFlightEntry = (id: string) => {
    setFlightEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const addFlightSchedule = (schedule: Omit<FlightSchedule, 'id' | 'createdAt'>) => {
    const newSchedule: FlightSchedule = {
      ...schedule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setFlightSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  };

  const updateFlightSchedule = (id: string, updates: Partial<FlightSchedule>) => {
    setFlightSchedules(prev => prev.map(schedule => 
      schedule.id === id ? { ...schedule, ...updates } : schedule
    ));
  };

  const deleteFlightSchedule = (id: string) => {
    setFlightSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };

  const getTotalFlightTime = () => {
    return flightEntries.reduce((total, entry) => total + entry.flightTime, 0);
  };

  const getCrossCountryTime = () => {
    return flightEntries.reduce((total, entry) => total + entry.crossCountry, 0);
  };

  const getSoloTime = () => {
    return flightEntries
      .filter(entry => entry.solo)
      .reduce((total, entry) => total + entry.flightTime, 0);
  };

  return {
    flightEntries,
    flightSchedules,
    addFlightEntry,
    updateFlightEntry,
    deleteFlightEntry,
    addFlightSchedule,
    updateFlightSchedule,
    deleteFlightSchedule,
    getTotalFlightTime,
    getCrossCountryTime,
    getSoloTime,
  };
}
