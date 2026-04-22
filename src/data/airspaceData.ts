// Airspace boundary data for major US airports
// Class B, C, D airspace definitions

export interface AirspaceZone {
  id: string;
  name: string;
  type: 'B' | 'C' | 'D';
  center: [number, number]; // [lat, lng]
  rings: AirspaceRing[];
  floor: number; // feet MSL
  ceiling: number; // feet MSL
}

export interface AirspaceRing {
  radius: number; // nautical miles
  floor: number;
  ceiling: number;
}

// Sample airspace data for major airports
export const AIRSPACE_DATA: AirspaceZone[] = [
  // San Francisco Class B
  {
    id: 'KSFO-B',
    name: 'San Francisco Class B',
    type: 'B',
    center: [37.6213, -122.3790],
    rings: [
      { radius: 7, floor: 0, ceiling: 10000 },
      { radius: 10, floor: 1500, ceiling: 10000 },
      { radius: 15, floor: 3000, ceiling: 10000 },
      { radius: 20, floor: 4000, ceiling: 10000 },
      { radius: 30, floor: 6000, ceiling: 10000 },
    ],
    floor: 0,
    ceiling: 10000,
  },
  // Los Angeles Class B
  {
    id: 'KLAX-B',
    name: 'Los Angeles Class B',
    type: 'B',
    center: [33.9425, -118.4081],
    rings: [
      { radius: 5, floor: 0, ceiling: 12500 },
      { radius: 10, floor: 2500, ceiling: 12500 },
      { radius: 15, floor: 4000, ceiling: 12500 },
      { radius: 20, floor: 5000, ceiling: 12500 },
      { radius: 30, floor: 7000, ceiling: 12500 },
    ],
    floor: 0,
    ceiling: 12500,
  },
  // Seattle Class B
  {
    id: 'KSEA-B',
    name: 'Seattle Class B',
    type: 'B',
    center: [47.4502, -122.3088],
    rings: [
      { radius: 5, floor: 0, ceiling: 10000 },
      { radius: 10, floor: 2000, ceiling: 10000 },
      { radius: 15, floor: 3000, ceiling: 10000 },
      { radius: 20, floor: 4000, ceiling: 10000 },
    ],
    floor: 0,
    ceiling: 10000,
  },
  // Denver Class B
  {
    id: 'KDEN-B',
    name: 'Denver Class B',
    type: 'B',
    center: [39.8561, -104.6737],
    rings: [
      { radius: 7, floor: 0, ceiling: 12000 },
      { radius: 12, floor: 7000, ceiling: 12000 },
      { radius: 18, floor: 8000, ceiling: 12000 },
      { radius: 25, floor: 9000, ceiling: 12000 },
    ],
    floor: 0,
    ceiling: 12000,
  },
  // Chicago O'Hare Class B
  {
    id: 'KORD-B',
    name: 'Chicago O\'Hare Class B',
    type: 'B',
    center: [41.9742, -87.9073],
    rings: [
      { radius: 5, floor: 0, ceiling: 10000 },
      { radius: 10, floor: 1900, ceiling: 10000 },
      { radius: 15, floor: 3000, ceiling: 10000 },
      { radius: 20, floor: 4000, ceiling: 10000 },
      { radius: 30, floor: 6000, ceiling: 10000 },
    ],
    floor: 0,
    ceiling: 10000,
  },
  // New York JFK Class B
  {
    id: 'KJFK-B',
    name: 'New York Class B',
    type: 'B',
    center: [40.6413, -73.7781],
    rings: [
      { radius: 7, floor: 0, ceiling: 7000 },
      { radius: 12, floor: 1500, ceiling: 7000 },
      { radius: 20, floor: 3000, ceiling: 7000 },
      { radius: 30, floor: 4500, ceiling: 7000 },
    ],
    floor: 0,
    ceiling: 7000,
  },
  // Atlanta Class B
  {
    id: 'KATL-B',
    name: 'Atlanta Class B',
    type: 'B',
    center: [33.6407, -84.4277],
    rings: [
      { radius: 5, floor: 0, ceiling: 12500 },
      { radius: 10, floor: 3000, ceiling: 12500 },
      { radius: 15, floor: 4000, ceiling: 12500 },
      { radius: 20, floor: 6000, ceiling: 12500 },
    ],
    floor: 0,
    ceiling: 12500,
  },
  // Dallas/Fort Worth Class B
  {
    id: 'KDFW-B',
    name: 'Dallas/Fort Worth Class B',
    type: 'B',
    center: [32.8998, -97.0403],
    rings: [
      { radius: 5, floor: 0, ceiling: 11000 },
      { radius: 10, floor: 2500, ceiling: 11000 },
      { radius: 15, floor: 3500, ceiling: 11000 },
      { radius: 25, floor: 5000, ceiling: 11000 },
    ],
    floor: 0,
    ceiling: 11000,
  },
  // Miami Class B
  {
    id: 'KMIA-B',
    name: 'Miami Class B',
    type: 'B',
    center: [25.7959, -80.2870],
    rings: [
      { radius: 5, floor: 0, ceiling: 7000 },
      { radius: 10, floor: 2000, ceiling: 7000 },
      { radius: 15, floor: 3000, ceiling: 7000 },
      { radius: 20, floor: 4000, ceiling: 7000 },
    ],
    floor: 0,
    ceiling: 7000,
  },
  // Phoenix Class B
  {
    id: 'KPHX-B',
    name: 'Phoenix Class B',
    type: 'B',
    center: [33.4373, -112.0078],
    rings: [
      { radius: 5, floor: 0, ceiling: 9000 },
      { radius: 10, floor: 3000, ceiling: 9000 },
      { radius: 15, floor: 5000, ceiling: 9000 },
      { radius: 20, floor: 6000, ceiling: 9000 },
    ],
    floor: 0,
    ceiling: 9000,
  },

  // Class C Airports
  {
    id: 'KSJC-C',
    name: 'San Jose Class C',
    type: 'C',
    center: [37.3626, -121.9291],
    rings: [
      { radius: 5, floor: 0, ceiling: 4100 },
      { radius: 10, floor: 1500, ceiling: 4100 },
    ],
    floor: 0,
    ceiling: 4100,
  },
  {
    id: 'KOAK-C',
    name: 'Oakland Class C',
    type: 'C',
    center: [37.7213, -122.2208],
    rings: [
      { radius: 5, floor: 0, ceiling: 4000 },
      { radius: 10, floor: 1500, ceiling: 4000 },
    ],
    floor: 0,
    ceiling: 4000,
  },
  {
    id: 'KBUR-C',
    name: 'Burbank Class C',
    type: 'C',
    center: [34.2007, -118.3585],
    rings: [
      { radius: 5, floor: 0, ceiling: 5000 },
      { radius: 10, floor: 2000, ceiling: 5000 },
    ],
    floor: 0,
    ceiling: 5000,
  },
  {
    id: 'KONT-C',
    name: 'Ontario Class C',
    type: 'C',
    center: [34.0560, -117.6012],
    rings: [
      { radius: 5, floor: 0, ceiling: 5000 },
      { radius: 10, floor: 2000, ceiling: 5000 },
    ],
    floor: 0,
    ceiling: 5000,
  },
  {
    id: 'KSAN-C',
    name: 'San Diego Class C',
    type: 'C',
    center: [32.7336, -117.1896],
    rings: [
      { radius: 5, floor: 0, ceiling: 4000 },
      { radius: 10, floor: 1300, ceiling: 4000 },
    ],
    floor: 0,
    ceiling: 4000,
  },
  {
    id: 'KPDX-C',
    name: 'Portland Class C',
    type: 'C',
    center: [45.5898, -122.5951],
    rings: [
      { radius: 5, floor: 0, ceiling: 4000 },
      { radius: 10, floor: 1500, ceiling: 4000 },
    ],
    floor: 0,
    ceiling: 4000,
  },
  {
    id: 'KAUS-C',
    name: 'Austin Class C',
    type: 'C',
    center: [30.1975, -97.6664],
    rings: [
      { radius: 5, floor: 0, ceiling: 4900 },
      { radius: 10, floor: 2100, ceiling: 4900 },
    ],
    floor: 0,
    ceiling: 4900,
  },
  {
    id: 'KSAT-C',
    name: 'San Antonio Class C',
    type: 'C',
    center: [29.5337, -98.4698],
    rings: [
      { radius: 5, floor: 0, ceiling: 4500 },
      { radius: 10, floor: 1900, ceiling: 4500 },
    ],
    floor: 0,
    ceiling: 4500,
  },

  // Class D Airports (Sample selection)
  {
    id: 'KPAO-D',
    name: 'Palo Alto Class D',
    type: 'D',
    center: [37.4611, -122.1150],
    rings: [
      { radius: 4, floor: 0, ceiling: 2500 },
    ],
    floor: 0,
    ceiling: 2500,
  },
  {
    id: 'KSQL-D',
    name: 'San Carlos Class D',
    type: 'D',
    center: [37.5119, -122.2494],
    rings: [
      { radius: 4, floor: 0, ceiling: 2500 },
    ],
    floor: 0,
    ceiling: 2500,
  },
  {
    id: 'KHWD-D',
    name: 'Hayward Class D',
    type: 'D',
    center: [37.6589, -122.1217],
    rings: [
      { radius: 4, floor: 0, ceiling: 2500 },
    ],
    floor: 0,
    ceiling: 2500,
  },
  {
    id: 'KLVK-D',
    name: 'Livermore Class D',
    type: 'D',
    center: [37.6934, -121.8201],
    rings: [
      { radius: 4, floor: 0, ceiling: 3000 },
    ],
    floor: 0,
    ceiling: 3000,
  },
  {
    id: 'KCCR-D',
    name: 'Concord Class D',
    type: 'D',
    center: [37.9897, -122.0569],
    rings: [
      { radius: 4, floor: 0, ceiling: 2600 },
    ],
    floor: 0,
    ceiling: 2600,
  },
  {
    id: 'KSNA-D',
    name: 'John Wayne Class D',
    type: 'D',
    center: [33.6757, -117.8682],
    rings: [
      { radius: 4, floor: 0, ceiling: 3000 },
    ],
    floor: 0,
    ceiling: 3000,
  },
  {
    id: 'KTOA-D',
    name: 'Torrance Class D',
    type: 'D',
    center: [33.8034, -118.3396],
    rings: [
      { radius: 4, floor: 0, ceiling: 2500 },
    ],
    floor: 0,
    ceiling: 2500,
  },
  {
    id: 'KSMO-D',
    name: 'Santa Monica Class D',
    type: 'D',
    center: [34.0158, -118.4513],
    rings: [
      { radius: 4, floor: 0, ceiling: 2500 },
    ],
    floor: 0,
    ceiling: 2500,
  },
];

// Airspace color configuration
export const AIRSPACE_COLORS: Record<'B' | 'C' | 'D', {
  fill: string;
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
}> = {
  B: {
    fill: 'rgba(0, 100, 255, 0.15)',
    stroke: 'rgba(0, 100, 255, 0.8)',
    strokeWidth: 2,
  },
  C: {
    fill: 'rgba(138, 43, 226, 0.12)',
    stroke: 'rgba(138, 43, 226, 0.7)',
    strokeWidth: 1.5,
  },
  D: {
    fill: 'rgba(0, 150, 255, 0.1)',
    stroke: 'rgba(0, 150, 255, 0.6)',
    strokeWidth: 1,
    dashArray: '5, 5',
  },
};

// Convert nautical miles to meters for Leaflet circles
export const nmToMeters = (nm: number): number => nm * 1852;

// Get airspace label
export const getAirspaceLabel = (zone: AirspaceZone): string => {
  return `${zone.name}\nClass ${zone.type} Airspace\nFloor: ${zone.floor === 0 ? 'SFC' : zone.floor + ' MSL'}\nCeiling: ${zone.ceiling} MSL`;
};
