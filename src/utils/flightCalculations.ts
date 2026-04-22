
interface FlightCalculation {
  distance: number;
  heading: number;
  timeEnroute: number;
  fuelUsed: number;
  groundSpeed: number;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export class FlightCalculator {
  // Calculate distance between two coordinates using Haversine formula
  static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Calculate true heading between two coordinates
  static calculateHeading(coord1: Coordinates, coord2: Coordinates): number {
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    const lat1 = this.toRadians(coord1.lat);
    const lat2 = this.toRadians(coord2.lat);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const heading = this.toDegrees(Math.atan2(y, x));
    return (heading + 360) % 360;
  }

  // Calculate ground speed considering wind
  static calculateGroundSpeed(
    trueAirspeed: number,
    trueHeading: number,
    windDirection: number,
    windSpeed: number
  ): number {
    const headingRad = this.toRadians(trueHeading);
    const windDirRad = this.toRadians(windDirection);

    const windX = windSpeed * Math.sin(windDirRad);
    const windY = windSpeed * Math.cos(windDirRad);

    const aircraftX = trueAirspeed * Math.sin(headingRad) + windX;
    const aircraftY = trueAirspeed * Math.cos(headingRad) + windY;

    return Math.sqrt(aircraftX * aircraftX + aircraftY * aircraftY);
  }

  // Calculate time enroute in minutes
  static calculateTimeEnroute(distance: number, groundSpeed: number): number {
    return (distance / groundSpeed) * 60; // Convert to minutes
  }

  // Calculate fuel consumption
  static calculateFuelUsed(timeEnroute: number, fuelFlow: number): number {
    return (timeEnroute / 60) * fuelFlow; // timeEnroute in minutes, convert to hours
  }

  // Complete flight leg calculation
  static calculateFlightLeg(
    from: Coordinates,
    to: Coordinates,
    trueAirspeed: number,
    windDirection: number = 0,
    windSpeed: number = 0,
    fuelFlow: number = 10
  ): FlightCalculation {
    const distance = this.calculateDistance(from, to);
    const heading = this.calculateHeading(from, to);
    const groundSpeed = this.calculateGroundSpeed(trueAirspeed, heading, windDirection, windSpeed);
    const timeEnroute = this.calculateTimeEnroute(distance, groundSpeed);
    const fuelUsed = this.calculateFuelUsed(timeEnroute, fuelFlow);

    return {
      distance: Math.round(distance * 10) / 10,
      heading: Math.round(heading),
      timeEnroute: Math.round(timeEnroute),
      fuelUsed: Math.round(fuelUsed * 10) / 10,
      groundSpeed: Math.round(groundSpeed)
    };
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static toDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
}
