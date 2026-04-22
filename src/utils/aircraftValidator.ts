
import { AIRCRAFT_DATABASE, AircraftPerformanceData } from '@/data/aircraftDatabase';

interface WeightData {
  pilotWeight: number;
  passengerWeight: number;
  rearPassengerWeight?: number;
  baggageWeight: number;
  baggage2Weight?: number;
  fuelWeight: number;
}

export class AircraftValidator {
  static validateWeightAndBalance(
    aircraftId: string, 
    weights: WeightData
  ): {
    isValid: boolean;
    totalWeight: number;
    centerOfGravity: number;
    totalMoment: number;
    weightMargin: number;
    errors: string[];
    warnings: string[];
  } {
    const aircraft = AIRCRAFT_DATABASE[aircraftId];
    if (!aircraft) {
      return {
        isValid: false,
        totalWeight: 0,
        centerOfGravity: 0,
        totalMoment: 0,
        weightMargin: 0,
        errors: ['Aircraft not found in database'],
        warnings: []
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Calculate weight and moments for each station
    const emptyMoment = aircraft.emptyWeight * aircraft.emptyCG;
    const pilotMoment = weights.pilotWeight * aircraft.stations.pilot.arm;
    const frontPassengerMoment = weights.passengerWeight * aircraft.stations.frontPassenger.arm;
    const fuelMoment = weights.fuelWeight * aircraft.stations.fuel.arm;
    
    let totalWeight = aircraft.emptyWeight + weights.pilotWeight + weights.passengerWeight + weights.fuelWeight + weights.baggageWeight;
    let totalMoment = emptyMoment + pilotMoment + frontPassengerMoment + fuelMoment;
    
    // Add rear passenger if applicable
    if (aircraft.stations.rearPassenger && weights.rearPassengerWeight) {
      const rearPassengerMoment = weights.rearPassengerWeight * aircraft.stations.rearPassenger.arm;
      totalWeight += weights.rearPassengerWeight;
      totalMoment += rearPassengerMoment;
      
      if (weights.rearPassengerWeight > aircraft.stations.rearPassenger.maxWeight) {
        errors.push(`Rear passenger weight exceeds limit (${aircraft.stations.rearPassenger.maxWeight} lbs)`);
      }
    }
    
    // Add baggage moments
    if (aircraft.stations.baggage1) {
      const baggageMoment = weights.baggageWeight * aircraft.stations.baggage1.arm;
      totalMoment += baggageMoment;
      
      if (weights.baggageWeight > aircraft.stations.baggage1.maxWeight) {
        errors.push(`Baggage compartment 1 weight exceeds limit (${aircraft.stations.baggage1.maxWeight} lbs)`);
      }
    } else if (aircraft.stations.baggage) {
      const baggageMoment = weights.baggageWeight * aircraft.stations.baggage.arm;
      totalMoment += baggageMoment;
      
      if (weights.baggageWeight > aircraft.stations.baggage.maxWeight) {
        errors.push(`Baggage compartment weight exceeds limit (${aircraft.stations.baggage.maxWeight} lbs)`);
      }
    }
    
    // Add second baggage compartment if applicable
    if (aircraft.stations.baggage2 && weights.baggage2Weight) {
      const baggage2Moment = weights.baggage2Weight * aircraft.stations.baggage2.arm;
      totalWeight += weights.baggage2Weight;
      totalMoment += baggage2Moment;
      
      if (weights.baggage2Weight > aircraft.stations.baggage2.maxWeight) {
        errors.push(`Baggage compartment 2 weight exceeds limit (${aircraft.stations.baggage2.maxWeight} lbs)`);
      }
    }

    const centerOfGravity = totalWeight > 0 ? totalMoment / totalWeight : 0;
    const weightMargin = aircraft.maxGrossWeight - totalWeight;

    // Weight validation
    if (totalWeight > aircraft.maxGrossWeight) {
      errors.push(`Aircraft is ${Math.abs(weightMargin).toFixed(0)} lbs over maximum weight`);
    }

    // CG validation
    if (centerOfGravity < aircraft.cgLimits.forward) {
      errors.push(`Center of gravity too far forward (${centerOfGravity.toFixed(2)}" < ${aircraft.cgLimits.forward}")`);
    }
    
    if (centerOfGravity > aircraft.cgLimits.aft) {
      errors.push(`Center of gravity too far aft (${centerOfGravity.toFixed(2)}" > ${aircraft.cgLimits.aft}")`);
    }

    // Station weight validation
    if (weights.pilotWeight > aircraft.stations.pilot.maxWeight) {
      errors.push(`Pilot weight exceeds limit (${aircraft.stations.pilot.maxWeight} lbs)`);
    }
    
    if (weights.passengerWeight > aircraft.stations.frontPassenger.maxWeight) {
      errors.push(`Front passenger weight exceeds limit (${aircraft.stations.frontPassenger.maxWeight} lbs)`);
    }

    if (weights.fuelWeight > aircraft.stations.fuel.maxWeight) {
      errors.push(`Fuel weight exceeds maximum (${aircraft.stations.fuel.maxWeight} lbs)`);
    }

    // Fuel capacity validation
    const fuelGallons = weights.fuelWeight / 6;
    if (fuelGallons > aircraft.fuelCapacity) {
      errors.push(`Fuel quantity exceeds tank capacity (${aircraft.fuelCapacity} gallons)`);
    }

    // Warnings
    if (totalWeight > aircraft.maxGrossWeight * 0.95) {
      warnings.push('Aircraft is near maximum weight - performance will be degraded');
    }

    if (centerOfGravity < aircraft.cgLimits.forward + 1.0) {
      warnings.push('Center of gravity is near forward limit - elevator effectiveness may be reduced');
    }

    if (centerOfGravity > aircraft.cgLimits.aft - 1.0) {
      warnings.push('Center of gravity is near aft limit - aircraft may be unstable');
    }

    if (fuelGallons > aircraft.usableFuel) {
      warnings.push(`Only ${aircraft.usableFuel} gallons of fuel is usable`);
    }

    return {
      isValid: errors.length === 0,
      totalWeight,
      centerOfGravity,
      totalMoment,
      weightMargin,
      errors,
      warnings
    };
  }

  static calculatePerformanceData(
    aircraftId: string,
    weight: number,
    altitude: number,
    temperature: number,
    humidity: number = 50
  ): {
    isValid: boolean;
    densityAltitude: number;
    takeoffGroundRoll: number;
    takeoffOver50ft: number;
    landingGroundRoll: number;
    landingOver50ft: number;
    serviceAltitude: number;
    warnings: string[];
  } {
    const aircraft = AIRCRAFT_DATABASE[aircraftId];
    if (!aircraft) {
      return {
        isValid: false,
        densityAltitude: 0,
        takeoffGroundRoll: 0,
        takeoffOver50ft: 0,
        landingGroundRoll: 0,
        landingOver50ft: 0,
        serviceAltitude: 0,
        warnings: ['Aircraft not found in database']
      };
    }

    const warnings: string[] = [];
    
    // Calculate density altitude
    const pressureAltitude = altitude;
    const densityAltitude = pressureAltitude + ((temperature - 15) * 120);
    
    // Weight factor (performance degrades with weight)
    const weightFactor = weight / aircraft.maxGrossWeight;
    
    // Altitude factor (performance degrades with altitude)
    const altitudeFactor = 1 + (densityAltitude / 10000) * 0.15;
    
    // Temperature factor (performance degrades with high temperature)
    const tempFactor = 1 + ((temperature - 15) / 100) * 0.1;
    
    // Combined performance factor
    const performanceFactor = weightFactor * altitudeFactor * tempFactor;
    
    // Calculate adjusted performance
    const takeoffGroundRoll = Math.round(aircraft.performance.takeoffGroundRoll * performanceFactor);
    const takeoffOver50ft = Math.round(aircraft.performance.takeoffOver50ft * performanceFactor);
    const landingGroundRoll = Math.round(aircraft.performance.landingGroundRoll * weightFactor);
    const landingOver50ft = Math.round(aircraft.performance.landingOver50ft * weightFactor);
    const serviceAltitude = Math.round(aircraft.performance.serviceCeiling - (densityAltitude * 0.1));

    // Generate warnings
    if (densityAltitude > 5000) {
      warnings.push('High density altitude - significantly reduced performance expected');
    }
    
    if (densityAltitude > aircraft.performance.serviceCeiling * 0.8) {
      warnings.push('Approaching service ceiling - climb performance severely limited');
    }

    if (takeoffGroundRoll > 3000) {
      warnings.push('Long takeoff distance required - ensure adequate runway length');
    }

    if (weight > aircraft.maxGrossWeight * 0.9) {
      warnings.push('Heavy weight - reduced climb rate and increased takeoff/landing distances');
    }

    if (temperature > 30) {
      warnings.push('High temperature - reduced engine performance and increased density altitude');
    }

    if (altitude > 8000) {
      warnings.push('High altitude operations - consider oxygen requirements and performance limitations');
    }

    return {
      isValid: true,
      densityAltitude,
      takeoffGroundRoll,
      takeoffOver50ft,
      landingGroundRoll,
      landingOver50ft,
      serviceAltitude,
      warnings
    };
  }

  static calculateFuelRequirements(
    aircraftId: string,
    distance: number, // nautical miles
    cruisePower: 65 | 75 = 75,
    windComponent: number = 0, // headwind positive, tailwind negative
    reserves: number = 45 // minutes
  ): {
    isValid: boolean;
    fuelRequired: number; // gallons
    flightTime: number; // minutes
    fuelFlow: number; // GPH
    range: number; // nautical miles
    warnings: string[];
  } {
    const aircraft = AIRCRAFT_DATABASE[aircraftId];
    if (!aircraft) {
      return {
        isValid: false,
        fuelRequired: 0,
        flightTime: 0,
        fuelFlow: 0,
        range: 0,
        warnings: ['Aircraft not found in database']
      };
    }

    const warnings: string[] = [];
    
    // Get performance data based on power setting
    const cruiseSpeed = cruisePower === 75 ? 
      aircraft.performance.cruiseSpeed : 
      aircraft.performance.cruiseSpeedEcon;
    
    const fuelFlow = cruisePower === 75 ? 
      aircraft.performance.fuelFlow.cruise75 : 
      aircraft.performance.fuelFlow.cruise65;

    // Calculate ground speed
    const groundSpeed = cruiseSpeed - windComponent;
    
    if (groundSpeed <= 0) {
      warnings.push('Ground speed is zero or negative - check wind component');
      return {
        isValid: false,
        fuelRequired: 0,
        flightTime: 0,
        fuelFlow,
        range: 0,
        warnings
      };
    }

    // Calculate flight time
    const flightTime = (distance / groundSpeed) * 60; // minutes
    
    // Calculate fuel required
    const cruiseFuel = (flightTime / 60) * fuelFlow;
    const taxiFuel = 0.2; // 12 minutes taxi at taxi fuel flow
    const reserveFuel = (reserves / 60) * fuelFlow;
    const fuelRequired = cruiseFuel + taxiFuel + reserveFuel;

    // Calculate range with current fuel capacity
    const range = cruisePower === 75 ? 
      aircraft.performance.range75 : 
      aircraft.performance.range65;

    // Generate warnings
    if (fuelRequired > aircraft.usableFuel) {
      warnings.push(`Fuel required (${fuelRequired.toFixed(1)} gal) exceeds usable fuel capacity (${aircraft.usableFuel} gal)`);
    }

    if (fuelRequired > aircraft.usableFuel * 0.9) {
      warnings.push('High fuel consumption - consider reducing payload or making fuel stop');
    }

    if (distance > range * 0.8) {
      warnings.push('Long distance flight - verify fuel planning and consider alternate airports');
    }

    if (windComponent > 25) {
      warnings.push('Strong headwind component - fuel consumption will be significantly higher');
    }

    if (flightTime > 300) { // 5 hours
      warnings.push('Long flight duration - consider pilot fatigue and fuel planning');
    }

    return {
      isValid: true,
      fuelRequired,
      flightTime,
      fuelFlow,
      range,
      warnings
    };
  }
}
