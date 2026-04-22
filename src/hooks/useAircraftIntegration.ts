
import { useEffect } from 'react';
import { useCustomAircraft } from './useCustomAircraft';
import { useToast } from '@/hooks/use-toast';

export const useAircraftIntegration = () => {
  const { getAllAircraft } = useCustomAircraft();
  const { toast } = useToast();
  
  const customAircraft = getAllAircraft();
  
  // Convert custom aircraft to standardized format for use across components
  const getAircraftList = () => {
    return Object.entries(customAircraft).map(([id, aircraft]) => ({
      id,
      name: aircraft.name,
      tailNumber: aircraft.tailNumber || '',
      make: aircraft.make || '',
      model: aircraft.model || '',
      year: aircraft.year || '',
      emptyWeight: aircraft.emptyWeight,
      maxWeight: aircraft.maxWeight,
      cgLimits: aircraft.cgLimits,
      stations: aircraft.stations,
      fuelCapacity: aircraft.fuelCapacity || 0,
      usableFuel: aircraft.usableFuel || 0,
      performance: aircraft.performance,
      fullIdentifier: `${aircraft.tailNumber} - ${aircraft.make} ${aircraft.model}${aircraft.year ? ` (${aircraft.year})` : ''}`
    }));
  };

  // Get aircraft by ID with error handling
  const getAircraftById = (id: string) => {
    const aircraft = customAircraft[id];
    if (!aircraft) {
      toast({
        title: "Aircraft Not Found",
        description: "The selected aircraft profile could not be found. Please select another aircraft.",
        variant: "destructive",
      });
      return null;
    }
    return aircraft;
  };

  // Validate aircraft for specific operations
  const validateAircraftForWeightBalance = (aircraftId: string) => {
    const aircraft = getAircraftById(aircraftId);
    if (!aircraft) return false;

    const hasRequiredData = aircraft.emptyWeight && 
                           aircraft.maxWeight && 
                           aircraft.cgLimits && 
                           aircraft.stations;

    if (!hasRequiredData) {
      toast({
        title: "Incomplete Aircraft Data",
        description: "This aircraft profile is missing weight and balance data. Please update the aircraft profile.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const validateAircraftForPerformance = (aircraftId: string) => {
    const aircraft = getAircraftById(aircraftId);
    if (!aircraft) return false;

    if (!aircraft.performance) {
      toast({
        title: "Performance Data Missing",
        description: "This aircraft profile doesn't have performance data. Please update the aircraft profile.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Check if any aircraft are available
  const hasAircraftProfiles = () => {
    return Object.keys(customAircraft).length > 0;
  };

  // Show notification when no aircraft are available
  const notifyNoAircraft = () => {
    toast({
      title: "No Aircraft Profiles",
      description: "Please add aircraft profiles in the Aircraft Manager before using this feature.",
      variant: "destructive",
    });
  };

  return {
    aircraftList: getAircraftList(),
    getAircraftById,
    validateAircraftForWeightBalance,
    validateAircraftForPerformance,
    hasAircraftProfiles,
    notifyNoAircraft,
    customAircraft
  };
};
