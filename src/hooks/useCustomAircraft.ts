
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AircraftPerformanceData {
  name: string;
  tailNumber?: string;
  make?: string;
  model?: string;
  year?: string;
  emptyWeight: number;
  emptyMoment: number;
  maxWeight: number;
  cgLimits: { forward: number; aft: number };
  stations: {
    pilot: { arm: number; maxWeight?: number };
    frontPassenger: { arm: number; maxWeight?: number };
    rearPassenger?: { arm: number; maxWeight?: number };
    baggage: { arm: number; maxWeight?: number };
    fuel: { arm: number; maxWeight: number };
  };
  maxBaggageWeight?: number;
  fuelCapacity?: number;
  usableFuel?: number;
  performance?: {
    takeoffGroundRoll: number;
    takeoffOver50ft: number;
    landingGroundRoll: number;
    landingOver50ft: number;
    bestGlideSpeed: number;
    stallSpeedClean: number;
    stallSpeedLanding: number;
    vr: number;
    vx: number;
    vy: number;
    cruiseSpeed: number;
    serviceCeiling: number;
    fuelFlow: {
      cruise65: number;
      cruise75: number;
    };
  };
}

const STORAGE_KEY = 'custom_aircraft_data';

export const useCustomAircraft = () => {
  const [customAircraft, setCustomAircraft] = useState<Record<string, AircraftPerformanceData>>({});
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCustomAircraft(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load custom aircraft data:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customAircraft));
    } catch (error) {
      console.error('Failed to save custom aircraft data:', error);
    }
  }, [customAircraft]);

  const addAircraft = (id: string, aircraftData: AircraftPerformanceData) => {
    setCustomAircraft(prev => ({
      ...prev,
      [id]: aircraftData
    }));
    
    toast({
      title: "Aircraft Added",
      description: `${aircraftData.name} has been added successfully.`,
    });
  };

  const updateAircraft = (id: string, aircraftData: Partial<AircraftPerformanceData>) => {
    setCustomAircraft(prev => ({
      ...prev,
      [id]: { ...prev[id], ...aircraftData }
    }));
    
    toast({
      title: "Aircraft Updated",
      description: "Aircraft data has been updated successfully.",
    });
  };

  const deleteAircraft = (id: string) => {
    const aircraftName = customAircraft[id]?.name;
    setCustomAircraft(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    
    toast({
      title: "Aircraft Deleted",
      description: `${aircraftName} has been removed.`,
      variant: "destructive",
    });
  };

  const getAircraft = (id: string) => customAircraft[id];

  const getAllAircraft = () => customAircraft;

  return {
    customAircraft,
    addAircraft,
    updateAircraft,
    deleteAircraft,
    getAircraft,
    getAllAircraft
  };
};
