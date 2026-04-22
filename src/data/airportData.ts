// Airport data with runway, frequency, and weather information

export interface Runway {
  designation: string;
  length: number; // feet
  width: number; // feet
  surface: string;
  lighting: string;
  ilsApproach?: boolean;
}

export interface Frequency {
  name: string;
  frequency: string;
  type: 'tower' | 'ground' | 'atis' | 'clearance' | 'approach' | 'unicom' | 'ctaf' | 'center';
}

export interface Airport {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  state: string;
  elevation: number; // feet MSL
  coordinates: [number, number]; // [lat, lng]
  type: 'large' | 'medium' | 'small' | 'heliport';
  runways: Runway[];
  frequencies: Frequency[];
  fuelTypes: string[];
  services: string[];
  timezone: string;
  magneticVariation: string;
}

// Sample airport data for major US airports
export const AIRPORT_DATA: Airport[] = [
  {
    icao: 'KSFO',
    iata: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    state: 'CA',
    elevation: 13,
    coordinates: [37.6213, -122.3790],
    type: 'large',
    runways: [
      { designation: '10L/28R', length: 11870, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 11381, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '01L/19R', length: 8648, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '01R/19L', length: 7500, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '118.850', type: 'atis' },
      { name: 'Ground North', frequency: '121.800', type: 'ground' },
      { name: 'Ground South', frequency: '121.650', type: 'ground' },
      { name: 'Tower', frequency: '120.500', type: 'tower' },
      { name: 'Clearance', frequency: '118.200', type: 'clearance' },
      { name: 'NorCal Approach', frequency: '135.650', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['Full Service FBO', 'Customs', 'Rental Cars', 'Hotels'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KLAX',
    iata: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    state: 'CA',
    elevation: 128,
    coordinates: [33.9425, -118.4081],
    type: 'large',
    runways: [
      { designation: '06L/24R', length: 8926, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '06R/24L', length: 10285, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '07L/25R', length: 12091, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '07R/25L', length: 11096, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS North', frequency: '133.800', type: 'atis' },
      { name: 'ATIS South', frequency: '128.250', type: 'atis' },
      { name: 'Ground', frequency: '121.650', type: 'ground' },
      { name: 'Tower', frequency: '133.900', type: 'tower' },
      { name: 'Clearance', frequency: '121.400', type: 'clearance' },
      { name: 'SoCal Approach', frequency: '124.500', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['Full Service FBO', 'Customs', 'Rental Cars', 'Hotels', 'Maintenance'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '12°E',
  },
  {
    icao: 'KSJC',
    iata: 'SJC',
    name: 'Norman Y. Mineta San Jose International',
    city: 'San Jose',
    state: 'CA',
    elevation: 62,
    coordinates: [37.3626, -121.9291],
    type: 'medium',
    runways: [
      { designation: '12L/30R', length: 11000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '12R/30L', length: 4600, width: 100, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '114.100', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '124.000', type: 'tower' },
      { name: 'Clearance', frequency: '121.100', type: 'clearance' },
      { name: 'NorCal Approach', frequency: '124.000', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['FBO', 'Rental Cars', 'Maintenance'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KOAK',
    iata: 'OAK',
    name: 'Oakland International Airport',
    city: 'Oakland',
    state: 'CA',
    elevation: 9,
    coordinates: [37.7213, -122.2208],
    type: 'medium',
    runways: [
      { designation: '10L/28R', length: 6213, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 5458, width: 150, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
      { designation: '12/30', length: 10520, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '128.500', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '118.300', type: 'tower' },
      { name: 'Clearance', frequency: '118.850', type: 'clearance' },
      { name: 'NorCal Approach', frequency: '125.350', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['FBO', 'Customs', 'Rental Cars'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KPAO',
    iata: 'PAO',
    name: 'Palo Alto Airport',
    city: 'Palo Alto',
    state: 'CA',
    elevation: 4,
    coordinates: [37.4611, -122.1150],
    type: 'small',
    runways: [
      { designation: '13/31', length: 2443, width: 70, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '118.600', type: 'tower' },
      { name: 'ATIS', frequency: '125.100', type: 'atis' },
      { name: 'NorCal Approach', frequency: '135.650', type: 'approach' },
    ],
    fuelTypes: ['100LL'],
    services: ['Self-Service Fuel', 'Tie-downs', 'Flight Training'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KSQL',
    iata: 'SQL',
    name: 'San Carlos Airport',
    city: 'San Carlos',
    state: 'CA',
    elevation: 5,
    coordinates: [37.5119, -122.2494],
    type: 'small',
    runways: [
      { designation: '12/30', length: 2600, width: 75, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '119.000', type: 'tower' },
      { name: 'NorCal Approach', frequency: '135.650', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['FBO', 'Flight Training', 'Maintenance'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KHWD',
    iata: 'HWD',
    name: 'Hayward Executive Airport',
    city: 'Hayward',
    state: 'CA',
    elevation: 52,
    coordinates: [37.6589, -122.1217],
    type: 'small',
    runways: [
      { designation: '10L/28R', length: 5694, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 3107, width: 75, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '120.200', type: 'tower' },
      { name: 'Ground', frequency: '121.400', type: 'ground' },
      { name: 'ATIS', frequency: '127.000', type: 'atis' },
      { name: 'NorCal Approach', frequency: '135.400', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['FBO', 'Flight Training', 'Maintenance', 'Aircraft Rental'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KLVK',
    iata: 'LVK',
    name: 'Livermore Municipal Airport',
    city: 'Livermore',
    state: 'CA',
    elevation: 400,
    coordinates: [37.6934, -121.8201],
    type: 'small',
    runways: [
      { designation: '07L/25R', length: 5253, width: 100, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
      { designation: '07R/25L', length: 2699, width: 75, surface: 'Asphalt', lighting: 'LIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '119.650', type: 'tower' },
      { name: 'Ground', frequency: '121.600', type: 'ground' },
      { name: 'ATIS', frequency: '126.250', type: 'atis' },
      { name: 'NorCal Approach', frequency: '135.400', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['FBO', 'Flight Training', 'Maintenance'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '14°E',
  },
  {
    icao: 'KSEA',
    iata: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    state: 'WA',
    elevation: 433,
    coordinates: [47.4502, -122.3088],
    type: 'large',
    runways: [
      { designation: '16L/34R', length: 11901, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '16C/34C', length: 9426, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '16R/34L', length: 8500, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '118.000', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '119.900', type: 'tower' },
      { name: 'Clearance', frequency: '128.000', type: 'clearance' },
      { name: 'Seattle Approach', frequency: '124.200', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['Full Service FBO', 'Customs', 'Rental Cars', 'Hotels'],
    timezone: 'America/Los_Angeles',
    magneticVariation: '16°E',
  },
  {
    icao: 'KDEN',
    iata: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    state: 'CO',
    elevation: 5431,
    coordinates: [39.8561, -104.6737],
    type: 'large',
    runways: [
      { designation: '16L/34R', length: 16000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '16R/34L', length: 12000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '07/25', length: 12000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '08/26', length: 12000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17L/35R', length: 12000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17R/35L', length: 12000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '132.350', type: 'atis' },
      { name: 'Ground East', frequency: '121.850', type: 'ground' },
      { name: 'Ground West', frequency: '121.750', type: 'ground' },
      { name: 'Tower', frequency: '132.350', type: 'tower' },
      { name: 'Clearance', frequency: '134.025', type: 'clearance' },
      { name: 'Denver Approach', frequency: '120.800', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'],
    services: ['Full Service FBO', 'Customs', 'Rental Cars', 'Hotels', 'Maintenance'],
    timezone: 'America/Denver',
    magneticVariation: '8°E',
  },
  // Additional major US airports
  {
    icao: 'KJFK', iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', state: 'NY',
    elevation: 13, coordinates: [40.6413, -73.7781], type: 'large',
    runways: [
      { designation: '04L/22R', length: 11351, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '04R/22L', length: 8400, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '13L/31R', length: 10000, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '13R/31L', length: 14572, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '128.725', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '119.100', type: 'tower' },
      { name: 'Clearance', frequency: '135.050', type: 'clearance' },
      { name: 'NY Approach', frequency: '132.400', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Rental Cars', 'Hotels'],
    timezone: 'America/New_York', magneticVariation: '13°W',
  },
  {
    icao: 'KEWR', iata: 'EWR', name: 'Newark Liberty International', city: 'Newark', state: 'NJ',
    elevation: 18, coordinates: [40.6925, -74.1687], type: 'large',
    runways: [
      { designation: '04L/22R', length: 11000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '04R/22L', length: 10000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '11/29', length: 6800, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '115.100', type: 'atis' },
      { name: 'Ground', frequency: '121.800', type: 'ground' },
      { name: 'Tower', frequency: '118.300', type: 'tower' },
      { name: 'NY Approach', frequency: '127.850', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Rental Cars'],
    timezone: 'America/New_York', magneticVariation: '13°W',
  },
  {
    icao: 'KORD', iata: 'ORD', name: "O'Hare International Airport", city: 'Chicago', state: 'IL',
    elevation: 672, coordinates: [41.9742, -87.9073], type: 'large',
    runways: [
      { designation: '10L/28R', length: 13000, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '10C/28C', length: 10801, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 7500, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '09L/27R', length: 7967, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '135.400', type: 'atis' },
      { name: 'Ground', frequency: '121.750', type: 'ground' },
      { name: 'Tower', frequency: '132.700', type: 'tower' },
      { name: 'Chicago Approach', frequency: '124.350', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Maintenance'],
    timezone: 'America/Chicago', magneticVariation: '3°W',
  },
  {
    icao: 'KATL', iata: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA',
    elevation: 1026, coordinates: [33.6407, -84.4277], type: 'large',
    runways: [
      { designation: '08L/26R', length: 9000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '08R/26L', length: 9000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '09L/27R', length: 9000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '09R/27L', length: 11890, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '10/28', length: 9000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '125.550', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '119.100', type: 'tower' },
      { name: 'Atlanta Approach', frequency: '125.325', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Hotels'],
    timezone: 'America/New_York', magneticVariation: '5°W',
  },
  {
    icao: 'KDFW', iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX',
    elevation: 607, coordinates: [32.8968, -97.0380], type: 'large',
    runways: [
      { designation: '13L/31R', length: 9000, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '13R/31L', length: 9301, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17C/35C', length: 13401, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17L/35R', length: 8500, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17R/35L', length: 13401, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '18L/36R', length: 13401, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '18R/36L', length: 13401, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '134.900', type: 'atis' },
      { name: 'Ground', frequency: '121.650', type: 'ground' },
      { name: 'Tower', frequency: '126.550', type: 'tower' },
      { name: 'DFW Approach', frequency: '124.150', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Maintenance'],
    timezone: 'America/Chicago', magneticVariation: '4°E',
  },
  {
    icao: 'KMIA', iata: 'MIA', name: 'Miami International Airport', city: 'Miami', state: 'FL',
    elevation: 8, coordinates: [25.7959, -80.2870], type: 'large',
    runways: [
      { designation: '08L/26R', length: 8600, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '08R/26L', length: 10506, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '09/27', length: 13016, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '12/30', length: 9354, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '132.450', type: 'atis' },
      { name: 'Ground', frequency: '121.800', type: 'ground' },
      { name: 'Tower', frequency: '118.300', type: 'tower' },
      { name: 'Miami Approach', frequency: '124.850', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Hotels'],
    timezone: 'America/New_York', magneticVariation: '5°W',
  },
  {
    icao: 'KBOS', iata: 'BOS', name: 'Boston Logan International', city: 'Boston', state: 'MA',
    elevation: 20, coordinates: [42.3656, -71.0096], type: 'large',
    runways: [
      { designation: '04L/22R', length: 7861, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '04R/22L', length: 10005, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '09/27', length: 7000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '15R/33L', length: 10083, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '128.800', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '128.800', type: 'tower' },
      { name: 'Boston Approach', frequency: '120.600', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Rental Cars'],
    timezone: 'America/New_York', magneticVariation: '15°W',
  },
  {
    icao: 'KPHX', iata: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ',
    elevation: 1135, coordinates: [33.4373, -112.0078], type: 'large',
    runways: [
      { designation: '07L/25R', length: 7800, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '07R/25L', length: 10300, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '08/26', length: 11489, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '120.075', type: 'atis' },
      { name: 'Ground', frequency: '119.750', type: 'ground' },
      { name: 'Tower', frequency: '118.700', type: 'tower' },
      { name: 'Phoenix Approach', frequency: '120.700', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Rental Cars', 'Hotels'],
    timezone: 'America/Phoenix', magneticVariation: '11°E',
  },
  {
    icao: 'KLAS', iata: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV',
    elevation: 2181, coordinates: [36.0840, -115.1537], type: 'large',
    runways: [
      { designation: '01L/19R', length: 9775, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '01R/19L', length: 14510, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '08L/26R', length: 10527, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '08R/26L', length: 10523, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '132.400', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '119.900', type: 'tower' },
      { name: 'Las Vegas Approach', frequency: '125.900', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Hotels'],
    timezone: 'America/Los_Angeles', magneticVariation: '12°E',
  },
  {
    icao: 'KMSP', iata: 'MSP', name: 'Minneapolis-St Paul International', city: 'Minneapolis', state: 'MN',
    elevation: 841, coordinates: [44.8848, -93.2223], type: 'large',
    runways: [
      { designation: '12L/30R', length: 10000, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '12R/30L', length: 8200, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '04/22', length: 11006, width: 200, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17/35', length: 8000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '135.350', type: 'atis' },
      { name: 'Ground', frequency: '121.800', type: 'ground' },
      { name: 'Tower', frequency: '126.700', type: 'tower' },
      { name: 'Minneapolis Approach', frequency: '124.700', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Maintenance'],
    timezone: 'America/Chicago', magneticVariation: '1°W',
  },
  // International airports
  {
    icao: 'CYYZ', iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', state: 'ON',
    elevation: 569, coordinates: [43.6777, -79.6248], type: 'large',
    runways: [
      { designation: '05/23', length: 11120, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '06L/24R', length: 9697, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '06R/24L', length: 9000, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '15L/33R', length: 11050, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '15R/33L', length: 9000, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '120.825', type: 'atis' },
      { name: 'Ground', frequency: '121.650', type: 'ground' },
      { name: 'Tower', frequency: '118.700', type: 'tower' },
      { name: 'Terminal', frequency: '119.350', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Hotels'],
    timezone: 'America/Toronto', magneticVariation: '10°W',
  },
  {
    icao: 'CYVR', iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', state: 'BC',
    elevation: 14, coordinates: [49.1967, -123.1815], type: 'large',
    runways: [
      { designation: '08L/26R', length: 11500, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '08R/26L', length: 9940, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '12/30', length: 7300, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '127.800', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '118.700', type: 'tower' },
      { name: 'Terminal', frequency: '119.550', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs'],
    timezone: 'America/Vancouver', magneticVariation: '17°E',
  },
  {
    icao: 'MMMX', iata: 'MEX', name: 'Mexico City International', city: 'Mexico City', state: 'CDMX',
    elevation: 7316, coordinates: [19.4363, -99.0721], type: 'large',
    runways: [
      { designation: '05L/23R', length: 12795, width: 148, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '05R/23L', length: 12966, width: 148, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '118.650', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '118.100', type: 'tower' },
      { name: 'Approach', frequency: '119.900', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs'],
    timezone: 'America/Mexico_City', magneticVariation: '5°E',
  },
  {
    icao: 'EGLL', iata: 'LHR', name: 'London Heathrow Airport', city: 'London', state: 'UK',
    elevation: 83, coordinates: [51.4700, -0.4543], type: 'large',
    runways: [
      { designation: '09L/27R', length: 12799, width: 164, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '09R/27L', length: 12008, width: 164, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '115.100', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '118.500', type: 'tower' },
      { name: 'Approach', frequency: '119.725', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs', 'Hotels'],
    timezone: 'Europe/London', magneticVariation: '1°W',
  },
  {
    icao: 'RJTT', iata: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', state: 'JP',
    elevation: 21, coordinates: [35.5533, 139.7811], type: 'large',
    runways: [
      { designation: '16L/34R', length: 9843, width: 197, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '16R/34L', length: 11024, width: 197, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '04/22', length: 8202, width: 197, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '05/23', length: 8202, width: 197, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '128.800', type: 'atis' },
      { name: 'Ground', frequency: '118.225', type: 'ground' },
      { name: 'Tower', frequency: '118.100', type: 'tower' },
      { name: 'Approach', frequency: '119.100', type: 'approach' },
    ],
    fuelTypes: ['Jet-A'], services: ['Full Service FBO', 'Customs'],
    timezone: 'Asia/Tokyo', magneticVariation: '7°W',
  },
  // Regional US airports
  {
    icao: 'KSMF', iata: 'SMF', name: 'Sacramento International', city: 'Sacramento', state: 'CA',
    elevation: 27, coordinates: [38.6954, -121.5908], type: 'medium',
    runways: [
      { designation: '16L/34R', length: 8601, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '16R/34L', length: 8601, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '125.250', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '119.100', type: 'tower' },
      { name: 'NorCal Approach', frequency: '125.250', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Rental Cars'],
    timezone: 'America/Los_Angeles', magneticVariation: '15°E',
  },
  {
    icao: 'KSAN', iata: 'SAN', name: 'San Diego International', city: 'San Diego', state: 'CA',
    elevation: 17, coordinates: [32.7336, -117.1897], type: 'large',
    runways: [
      { designation: '09/27', length: 9401, width: 200, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '134.800', type: 'atis' },
      { name: 'Ground', frequency: '123.900', type: 'ground' },
      { name: 'Tower', frequency: '118.300', type: 'tower' },
      { name: 'SoCal Approach', frequency: '119.600', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Rental Cars'],
    timezone: 'America/Los_Angeles', magneticVariation: '12°E',
  },
  {
    icao: 'KPDX', iata: 'PDX', name: 'Portland International', city: 'Portland', state: 'OR',
    elevation: 31, coordinates: [45.5898, -122.5951], type: 'large',
    runways: [
      { designation: '10L/28R', length: 11000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 7000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '03/21', length: 6000, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '128.350', type: 'atis' },
      { name: 'Ground', frequency: '121.900', type: 'ground' },
      { name: 'Tower', frequency: '118.700', type: 'tower' },
      { name: 'Portland Approach', frequency: '124.350', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Rental Cars'],
    timezone: 'America/Los_Angeles', magneticVariation: '16°E',
  },
  {
    icao: 'KSLC', iata: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', state: 'UT',
    elevation: 4227, coordinates: [40.7884, -111.9778], type: 'large',
    runways: [
      { designation: '16L/34R', length: 12003, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '16R/34L', length: 12002, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17/35', length: 9596, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '14/32', length: 4893, width: 150, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '124.750', type: 'atis' },
      { name: 'Ground', frequency: '121.700', type: 'ground' },
      { name: 'Tower', frequency: '118.300', type: 'tower' },
      { name: 'SLC Approach', frequency: '124.300', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['Full Service FBO', 'Customs', 'Maintenance'],
    timezone: 'America/Denver', magneticVariation: '12°E',
  },
  {
    icao: 'KAUS', iata: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', state: 'TX',
    elevation: 542, coordinates: [30.1945, -97.6699], type: 'medium',
    runways: [
      { designation: '17L/35R', length: 12248, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '17R/35L', length: 9000, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '118.900', type: 'atis' },
      { name: 'Ground', frequency: '121.000', type: 'ground' },
      { name: 'Tower', frequency: '121.000', type: 'tower' },
      { name: 'Approach', frequency: '119.375', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Rental Cars'],
    timezone: 'America/Chicago', magneticVariation: '4°E',
  },
  // Small GA airports
  {
    icao: 'KRHV', iata: 'RHV', name: 'Reid-Hillview Airport', city: 'San Jose', state: 'CA',
    elevation: 135, coordinates: [37.3326, -121.8191], type: 'small',
    runways: [
      { designation: '13L/31R', length: 3100, width: 75, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
      { designation: '13R/31L', length: 3101, width: 75, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '132.750', type: 'tower' },
      { name: 'Ground', frequency: '121.600', type: 'ground' },
      { name: 'ATIS', frequency: '125.200', type: 'atis' },
      { name: 'NorCal Approach', frequency: '124.000', type: 'approach' },
    ],
    fuelTypes: ['100LL'], services: ['Self-Service Fuel', 'Flight Training', 'Tie-downs'],
    timezone: 'America/Los_Angeles', magneticVariation: '14°E',
  },
  {
    icao: 'KWVI', iata: 'WVI', name: 'Watsonville Municipal', city: 'Watsonville', state: 'CA',
    elevation: 163, coordinates: [36.9357, -121.7897], type: 'small',
    runways: [
      { designation: '02/20', length: 4501, width: 100, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
      { designation: '08/26', length: 3999, width: 150, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF', frequency: '122.900', type: 'ctaf' },
      { name: 'NorCal Approach', frequency: '124.100', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Flight Training'],
    timezone: 'America/Los_Angeles', magneticVariation: '14°E',
  },
  {
    icao: 'KMRY', iata: 'MRY', name: 'Monterey Regional', city: 'Monterey', state: 'CA',
    elevation: 257, coordinates: [36.5870, -121.8429], type: 'medium',
    runways: [
      { designation: '10L/28R', length: 7616, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '10R/28L', length: 4500, width: 150, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'ATIS', frequency: '118.400', type: 'atis' },
      { name: 'Ground', frequency: '121.800', type: 'ground' },
      { name: 'Tower', frequency: '118.400', type: 'tower' },
      { name: 'Approach', frequency: '121.900', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Rental Cars'],
    timezone: 'America/Los_Angeles', magneticVariation: '14°E',
  },
  {
    icao: 'KCCR', iata: 'CCR', name: 'Buchanan Field', city: 'Concord', state: 'CA',
    elevation: 23, coordinates: [37.9896, -122.0569], type: 'small',
    runways: [
      { designation: '01L/19R', length: 5001, width: 150, surface: 'Asphalt', lighting: 'HIRL', ilsApproach: true },
      { designation: '01R/19L', length: 2770, width: 75, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '123.900', type: 'tower' },
      { name: 'Ground', frequency: '121.800', type: 'ground' },
      { name: 'ATIS', frequency: '128.000', type: 'atis' },
      { name: 'NorCal Approach', frequency: '125.350', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Flight Training', 'Maintenance'],
    timezone: 'America/Los_Angeles', magneticVariation: '14°E',
  },
  {
    icao: 'KSCK', iata: 'SCK', name: 'Stockton Metropolitan', city: 'Stockton', state: 'CA',
    elevation: 33, coordinates: [37.8942, -121.2386], type: 'medium',
    runways: [
      { designation: '11L/29R', length: 10650, width: 150, surface: 'Concrete', lighting: 'HIRL', ilsApproach: true },
      { designation: '11R/29L', length: 4448, width: 150, surface: 'Asphalt', lighting: 'MIRL', ilsApproach: false },
    ],
    frequencies: [
      { name: 'CTAF/Tower', frequency: '120.300', type: 'tower' },
      { name: 'Ground', frequency: '121.300', type: 'ground' },
      { name: 'ATIS', frequency: '123.050', type: 'atis' },
      { name: 'NorCal Approach', frequency: '135.400', type: 'approach' },
    ],
    fuelTypes: ['100LL', 'Jet-A'], services: ['FBO', 'Maintenance'],
    timezone: 'America/Los_Angeles', magneticVariation: '14°E',
  },
];

// Get airport icon based on type
export const getAirportIcon = (type: Airport['type']): string => {
  switch (type) {
    case 'large': return '✈️';
    case 'medium': return '🛫';
    case 'small': return '🛩️';
    case 'heliport': return '🚁';
    default: return '📍';
  }
};

// Find airport by ICAO code
export const findAirportByICAO = (icao: string): Airport | undefined => {
  return AIRPORT_DATA.find(a => a.icao === icao.toUpperCase());
};

// Find airports near a coordinate
export const findNearbyAirports = (lat: number, lng: number, radiusNM: number = 50): Airport[] => {
  const radiusDeg = radiusNM / 60; // Approximate conversion
  return AIRPORT_DATA.filter(airport => {
    const dLat = Math.abs(airport.coordinates[0] - lat);
    const dLng = Math.abs(airport.coordinates[1] - lng);
    return dLat <= radiusDeg && dLng <= radiusDeg;
  });
};
