
export interface AircraftPerformanceData {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: 'single-engine' | 'multi-engine' | 'turboprop' | 'jet';
  
  // Weight & Balance
  emptyWeight: number;
  emptyCG: number;
  maxGrossWeight: number;
  usefulLoad: number;
  
  // CG Limits
  cgLimits: {
    forward: number;
    aft: number;
  };
  
  // Station Arms & Limits
  stations: {
    pilot: { arm: number; maxWeight: number };
    frontPassenger: { arm: number; maxWeight: number };
    rearPassenger?: { arm: number; maxWeight: number };
    baggage1?: { arm: number; maxWeight: number };
    baggage2?: { arm: number; maxWeight: number };
    baggage?: { arm: number; maxWeight: number };
    fuel: { arm: number; maxWeight: number };
  };
  
  // Fuel System
  fuelCapacity: number; // gallons
  unusableFuel: number; // gallons
  usableFuel: number; // gallons
  
  // Performance Data
  performance: {
    // Speeds (KIAS)
    vr: number; // Rotation speed
    vx: number; // Best angle of climb
    vy: number; // Best rate of climb
    vso: number; // Stall speed landing config
    vs1: number; // Stall speed clean
    va: number; // Maneuvering speed
    vno: number; // Normal operating speed
    vne: number; // Never exceed speed
    
    // Cruise Performance
    cruiseSpeed: number; // KTAS at 75% power
    cruiseSpeedEcon: number; // KTAS at 65% power
    serviceCeiling: number; // feet
    
    // Takeoff Performance (sea level, standard day)
    takeoffGroundRoll: number; // feet
    takeoffOver50ft: number; // feet
    
    // Landing Performance (sea level, standard day)
    landingGroundRoll: number; // feet
    landingOver50ft: number; // feet
    
    // Fuel Consumption
    fuelFlow: {
      cruise75: number; // GPH at 75% power
      cruise65: number; // GPH at 65% power
      taxi: number; // GPH
    };
    
    // Range
    range75: number; // nautical miles at 75% power
    range65: number; // nautical miles at 65% power
  };
  
  // Engine
  engine: {
    type: string;
    horsepower: number;
    fuelType: '100LL' | 'Jet A' | 'Mogas';
  };
  
  // Dimensions
  dimensions: {
    wingspan: number; // feet
    length: number; // feet
    height: number; // feet
  };
}

export const AIRCRAFT_DATABASE: Record<string, AircraftPerformanceData> = {
  'c152': {
    id: 'c152',
    name: 'Cessna 152',
    manufacturer: 'Cessna',
    model: '152',
    category: 'single-engine',
    
    emptyWeight: 1129,
    emptyCG: 32.6,
    maxGrossWeight: 1670,
    usefulLoad: 541,
    
    cgLimits: {
      forward: 31.0,
      aft: 36.5
    },
    
    stations: {
      pilot: { arm: 32.0, maxWeight: 200 },
      frontPassenger: { arm: 32.0, maxWeight: 200 },
      baggage: { arm: 64.0, maxWeight: 120 },
      fuel: { arm: 40.0, maxWeight: 156 } // 26 gallons × 6 lbs/gal
    },
    
    fuelCapacity: 26,
    unusableFuel: 1.5,
    usableFuel: 24.5,
    
    performance: {
      vr: 50,
      vx: 55,
      vy: 67,
      vso: 43,
      vs1: 48,
      va: 104,
      vno: 111,
      vne: 149,
      
      cruiseSpeed: 107,
      cruiseSpeedEcon: 98,
      serviceCeiling: 14700,
      
      takeoffGroundRoll: 725,
      takeoffOver50ft: 1340,
      
      landingGroundRoll: 425,
      landingOver50ft: 1200,
      
      fuelFlow: {
        cruise75: 6.1,
        cruise65: 5.3,
        taxi: 2.5
      },
      
      range75: 350,
      range65: 415
    },
    
    engine: {
      type: 'Lycoming O-235-L2C',
      horsepower: 108,
      fuelType: '100LL'
    },
    
    dimensions: {
      wingspan: 33.2,
      length: 24.1,
      height: 8.5
    }
  },
  
  'c172': {
    id: 'c172',
    name: 'Cessna 172',
    manufacturer: 'Cessna',
    model: '172',
    category: 'single-engine',
    
    emptyWeight: 1663,
    emptyCG: 36.2,
    maxGrossWeight: 2300,
    usefulLoad: 637,
    
    cgLimits: {
      forward: 35.0,
      aft: 40.9
    },
    
    stations: {
      pilot: { arm: 37.0, maxWeight: 200 },
      frontPassenger: { arm: 37.0, maxWeight: 200 },
      rearPassenger: { arm: 73.0, maxWeight: 340 },
      baggage1: { arm: 95.0, maxWeight: 120 },
      fuel: { arm: 48.0, maxWeight: 336 } // 56 gallons × 6 lbs/gal
    },
    
    fuelCapacity: 56,
    unusableFuel: 3.0,
    usableFuel: 53,
    
    performance: {
      vr: 55,
      vx: 62,
      vy: 79,
      vso: 47,
      vs1: 51,
      va: 105,
      vno: 129,
      vne: 163,
      
      cruiseSpeed: 122,
      cruiseSpeedEcon: 112,
      serviceCeiling: 13500,
      
      takeoffGroundRoll: 960,
      takeoffOver50ft: 1630,
      
      landingGroundRoll: 575,
      landingOver50ft: 1335,
      
      fuelFlow: {
        cruise75: 8.5,
        cruise65: 7.3,
        taxi: 3.0
      },
      
      range75: 518,
      range65: 614
    },
    
    engine: {
      type: 'Lycoming IO-360-L2A',
      horsepower: 180,
      fuelType: '100LL'
    },
    
    dimensions: {
      wingspan: 36.0,
      length: 27.2,
      height: 8.9
    }
  },
  
  'c182': {
    id: 'c182',
    name: 'Cessna 182',
    manufacturer: 'Cessna',
    model: '182',
    category: 'single-engine',
    
    emptyWeight: 1883,
    emptyCG: 35.8,
    maxGrossWeight: 3100,
    usefulLoad: 1217,
    
    cgLimits: {
      forward: 32.5,
      aft: 40.5
    },
    
    stations: {
      pilot: { arm: 37.0, maxWeight: 200 },
      frontPassenger: { arm: 37.0, maxWeight: 200 },
      rearPassenger: { arm: 73.0, maxWeight: 340 },
      baggage1: { arm: 95.0, maxWeight: 120 },
      baggage2: { arm: 123.0, maxWeight: 80 },
      fuel: { arm: 48.0, maxWeight: 564 } // 94 gallons × 6 lbs/gal
    },
    
    fuelCapacity: 94,
    unusableFuel: 3.0,
    usableFuel: 91,
    
    performance: {
      vr: 55,
      vx: 63,
      vy: 80,
      vso: 50,
      vs1: 56,
      va: 140,
      vno: 175,
      vne: 205,
      
      cruiseSpeed: 145,
      cruiseSpeedEcon: 133,
      serviceCeiling: 18900,
      
      takeoffGroundRoll: 795,
      takeoffOver50ft: 1514,
      
      landingGroundRoll: 590,
      landingOver50ft: 1350,
      
      fuelFlow: {
        cruise75: 13.7,
        cruise65: 11.5,
        taxi: 4.0
      },
      
      range75: 820,
      range65: 925
    },
    
    engine: {
      type: 'Lycoming IO-540-AB1A5',
      horsepower: 230,
      fuelType: '100LL'
    },
    
    dimensions: {
      wingspan: 36.0,
      length: 28.7,
      height: 9.3
    }
  },
  
  'pa28': {
    id: 'pa28',
    name: 'Piper Cherokee',
    manufacturer: 'Piper',
    model: 'PA-28-180',
    category: 'single-engine',
    
    emptyWeight: 1216,
    emptyCG: 88.4,
    maxGrossWeight: 2400,
    usefulLoad: 1184,
    
    cgLimits: {
      forward: 86.0,
      aft: 94.2
    },
    
    stations: {
      pilot: { arm: 85.5, maxWeight: 200 },
      frontPassenger: { arm: 85.5, maxWeight: 200 },
      rearPassenger: { arm: 121.0, maxWeight: 340 },
      baggage1: { arm: 142.8, maxWeight: 200 },
      fuel: { arm: 95.0, maxWeight: 300 } // 50 gallons × 6 lbs/gal
    },
    
    fuelCapacity: 50,
    unusableFuel: 2.0,
    usableFuel: 48,
    
    performance: {
      vr: 60,
      vx: 68,
      vy: 82,
      vso: 54,
      vs1: 61,
      va: 125,
      vno: 154,
      vne: 193,
      
      cruiseSpeed: 133,
      cruiseSpeedEcon: 122,
      serviceCeiling: 15300,
      
      takeoffGroundRoll: 800,
      takeoffOver50ft: 1620,
      
      landingGroundRoll: 600,
      landingOver50ft: 1390,
      
      fuelFlow: {
        cruise75: 10.5,
        cruise65: 8.8,
        taxi: 3.5
      },
      
      range75: 540,
      range65: 610
    },
    
    engine: {
      type: 'Lycoming O-360-A4A',
      horsepower: 180,
      fuelType: '100LL'
    },
    
    dimensions: {
      wingspan: 30.0,
      length: 23.4,
      height: 7.3
    }
  }
};

export const getAircraftById = (id: string): AircraftPerformanceData | undefined => {
  return AIRCRAFT_DATABASE[id];
};

export const getAllAircraft = (): AircraftPerformanceData[] => {
  return Object.values(AIRCRAFT_DATABASE);
};

export const getAircraftByCategory = (category: string): AircraftPerformanceData[] => {
  return Object.values(AIRCRAFT_DATABASE).filter(aircraft => aircraft.category === category);
};
