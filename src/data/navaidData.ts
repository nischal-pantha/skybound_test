// VOR, NDB, and Fix navigation database for aviation charts

export interface VOR {
  id: string;
  name: string;
  type: 'VOR' | 'VOR-DME' | 'VORTAC' | 'TACAN';
  frequency: string;
  coordinates: [number, number]; // [lng, lat]
  morseCode: string;
  magneticVariation?: string;
  elevation?: number;
}

export interface NDB {
  id: string;
  name: string;
  type: 'NDB' | 'NDB-DME';
  frequency: string;
  coordinates: [number, number]; // [lng, lat]
  morseCode: string;
}

export interface Fix {
  id: string;
  name: string;
  type: 'RNAV' | 'VOR-RADIAL' | 'INTERSECTION' | 'GPS';
  coordinates: [number, number]; // [lng, lat]
  description?: string;
}

export type NavaidType = 'VOR' | 'VOR-DME' | 'VORTAC' | 'TACAN' | 'NDB' | 'NDB-DME' | 'FIX' | 'RNAV';

export interface Navaid {
  id: string;
  name: string;
  type: NavaidType;
  coordinates: [number, number];
  frequency?: string;
  morseCode?: string;
  description?: string;
}

// Major US VORs
export const VOR_DATA: VOR[] = [
  // California
  { id: 'SFO', name: 'San Francisco', type: 'VOR-DME', frequency: '115.80', coordinates: [-122.3748, 37.6193], morseCode: '... ..-. ---', magneticVariation: '14°E' },
  { id: 'OAK', name: 'Oakland', type: 'VOR-DME', frequency: '116.80', coordinates: [-122.2219, 37.7233], morseCode: '--- .- -.-', magneticVariation: '14°E' },
  { id: 'SJC', name: 'San Jose', type: 'VOR-DME', frequency: '114.10', coordinates: [-121.9195, 37.3582], morseCode: '... .--- -.-.', magneticVariation: '14°E' },
  { id: 'PYE', name: 'Point Reyes', type: 'VOR-DME', frequency: '113.70', coordinates: [-122.8678, 38.0794], morseCode: '.--. -.-- .', magneticVariation: '14°E' },
  { id: 'SAU', name: 'Sausalito', type: 'VORTAC', frequency: '116.20', coordinates: [-122.5203, 37.8267], morseCode: '... .- ..-', magneticVariation: '14°E' },
  { id: 'MOD', name: 'Modesto', type: 'VOR-DME', frequency: '114.60', coordinates: [-120.9542, 37.6261], morseCode: '-- --- -..', magneticVariation: '14°E' },
  { id: 'SAC', name: 'Sacramento', type: 'VORTAC', frequency: '115.20', coordinates: [-121.5508, 38.4386], morseCode: '... .- -.-.', magneticVariation: '15°E' },
  { id: 'LAX', name: 'Los Angeles', type: 'VOR-DME', frequency: '113.60', coordinates: [-118.4085, 33.9425], morseCode: '.-.. .- -..-', magneticVariation: '12°E' },
  { id: 'VNY', name: 'Van Nuys', type: 'VOR-DME', frequency: '113.10', coordinates: [-118.4896, 34.2094], morseCode: '...- -. -.--', magneticVariation: '12°E' },
  { id: 'SAN', name: 'San Diego', type: 'VORTAC', frequency: '116.20', coordinates: [-117.1581, 32.7338], morseCode: '... .- -.', magneticVariation: '12°E' },
  { id: 'EMT', name: 'El Monte', type: 'VOR-DME', frequency: '115.10', coordinates: [-118.0347, 34.0867], morseCode: '. -- -', magneticVariation: '12°E' },
  
  // Pacific Northwest
  { id: 'SEA', name: 'Seattle', type: 'VORTAC', frequency: '116.80', coordinates: [-122.3088, 47.4502], morseCode: '... . .-', magneticVariation: '16°E' },
  { id: 'PDX', name: 'Portland', type: 'VORTAC', frequency: '116.60', coordinates: [-122.5975, 45.5886], morseCode: '.--. -.. -..-', magneticVariation: '16°E' },
  { id: 'YKM', name: 'Yakima', type: 'VOR-DME', frequency: '116.00', coordinates: [-120.5440, 46.5681], morseCode: '-.-- -.- --', magneticVariation: '16°E' },
  
  // Mountain West
  { id: 'DEN', name: 'Denver', type: 'VORTAC', frequency: '117.90', coordinates: [-104.6737, 39.8561], morseCode: '-.. . -.', magneticVariation: '8°E' },
  { id: 'PHX', name: 'Phoenix', type: 'VORTAC', frequency: '115.60', coordinates: [-112.0116, 33.4342], morseCode: '.--. .... -..-', magneticVariation: '11°E' },
  { id: 'LAS', name: 'Las Vegas', type: 'VORTAC', frequency: '116.90', coordinates: [-115.1398, 36.0840], morseCode: '.-.. .- ...', magneticVariation: '12°E' },
  { id: 'SLC', name: 'Salt Lake City', type: 'VORTAC', frequency: '116.80', coordinates: [-111.9777, 40.7899], morseCode: '... .-.. -.-.', magneticVariation: '12°E' },
  
  // Texas
  { id: 'DFW', name: 'Dallas-Fort Worth', type: 'VORTAC', frequency: '117.00', coordinates: [-97.0372, 32.8968], morseCode: '-.. ..-. .--', magneticVariation: '4°E' },
  { id: 'IAH', name: 'Houston', type: 'VOR-DME', frequency: '116.60', coordinates: [-95.3414, 29.9844], morseCode: '.. .- ....', magneticVariation: '3°E' },
  { id: 'AUS', name: 'Austin', type: 'VORTAC', frequency: '117.10', coordinates: [-97.6700, 30.1945], morseCode: '.- ..- ...', magneticVariation: '4°E' },
  { id: 'SAT', name: 'San Antonio', type: 'VORTAC', frequency: '116.80', coordinates: [-98.4698, 29.5337], morseCode: '... .- -', magneticVariation: '4°E' },
  
  // Midwest
  { id: 'ORD', name: "O'Hare", type: 'VOR-DME', frequency: '113.90', coordinates: [-87.9048, 41.9742], morseCode: '--- .-. -..', magneticVariation: '3°W' },
  { id: 'MDW', name: 'Midway', type: 'VOR-DME', frequency: '109.00', coordinates: [-87.7524, 41.7868], morseCode: '-- -.. .--', magneticVariation: '3°W' },
  { id: 'MSP', name: 'Minneapolis', type: 'VORTAC', frequency: '115.30', coordinates: [-93.2218, 44.8848], morseCode: '-- ... .--', magneticVariation: '1°W' },
  { id: 'DTW', name: 'Detroit', type: 'VORTAC', frequency: '113.50', coordinates: [-83.3534, 42.2124], morseCode: '-.. - .--', magneticVariation: '6°W' },
  { id: 'STL', name: 'St Louis', type: 'VORTAC', frequency: '117.40', coordinates: [-90.1994, 38.7487], morseCode: '... - .-..', magneticVariation: '2°W' },
  
  // East Coast
  { id: 'JFK', name: 'Kennedy', type: 'VOR-DME', frequency: '115.90', coordinates: [-73.7789, 40.6413], morseCode: '.--- ..-. -.-', magneticVariation: '13°W' },
  { id: 'LGA', name: 'La Guardia', type: 'VOR-DME', frequency: '113.10', coordinates: [-73.8740, 40.7769], morseCode: '.-.. --. .-', magneticVariation: '13°W' },
  { id: 'EWR', name: 'Newark', type: 'VOR-DME', frequency: '108.95', coordinates: [-74.1745, 40.6925], morseCode: '. .-- .-.', magneticVariation: '13°W' },
  { id: 'BOS', name: 'Boston', type: 'VOR-DME', frequency: '112.70', coordinates: [-71.0096, 42.3656], morseCode: '-... --- ...', magneticVariation: '15°W' },
  { id: 'PHL', name: 'Philadelphia', type: 'VOR-DME', frequency: '108.80', coordinates: [-75.2411, 39.8719], morseCode: '.--. .... .-..', magneticVariation: '11°W' },
  { id: 'DCA', name: 'Reagan National', type: 'VOR-DME', frequency: '111.00', coordinates: [-77.0377, 38.8512], morseCode: '-.. -.-. .-', magneticVariation: '10°W' },
  { id: 'IAD', name: 'Dulles', type: 'VOR-DME', frequency: '116.50', coordinates: [-77.4556, 38.9531], morseCode: '.. .- -..', magneticVariation: '10°W' },
  
  // Florida
  { id: 'MIA', name: 'Miami', type: 'VORTAC', frequency: '115.90', coordinates: [-80.2906, 25.7959], morseCode: '-- .. .-', magneticVariation: '5°W' },
  { id: 'ORL', name: 'Orlando', type: 'VOR-DME', frequency: '112.20', coordinates: [-81.3329, 28.5383], morseCode: '--- .-. .-..', magneticVariation: '5°W' },
  { id: 'TPA', name: 'Tampa', type: 'VORTAC', frequency: '116.40', coordinates: [-82.5332, 27.9755], morseCode: '- .--. .-', magneticVariation: '5°W' },
  { id: 'JAX', name: 'Jacksonville', type: 'VORTAC', frequency: '114.50', coordinates: [-81.6879, 30.4941], morseCode: '.--- .- -..-', magneticVariation: '6°W' },
  
  // Southeast
  { id: 'ATL', name: 'Atlanta', type: 'VORTAC', frequency: '116.90', coordinates: [-84.4281, 33.6407], morseCode: '.- - .-..', magneticVariation: '5°W' },
  { id: 'CLT', name: 'Charlotte', type: 'VOR-DME', frequency: '115.00', coordinates: [-80.9431, 35.2144], morseCode: '-.-. .-.. -', magneticVariation: '8°W' },
];

// NDB Stations
export const NDB_DATA: NDB[] = [
  { id: 'FRC', name: 'Frisco', type: 'NDB', frequency: '335', coordinates: [-122.1150, 37.4611], morseCode: '..-. .-. -.-.' },
  { id: 'OSI', name: 'Woodside', type: 'NDB', frequency: '332', coordinates: [-122.2511, 37.3906], morseCode: '--- ... ..' },
  { id: 'RZS', name: 'Santa Rosa', type: 'NDB', frequency: '362', coordinates: [-122.8108, 38.5089], morseCode: '.-. --.. ...' },
  { id: 'LOM', name: 'Loma', type: 'NDB', frequency: '260', coordinates: [-122.3600, 37.6500], morseCode: '.-.. --- --' },
  { id: 'SBY', name: 'Salinas', type: 'NDB', frequency: '242', coordinates: [-121.5950, 36.6628], morseCode: '... -... -.--' },
  { id: 'MRY', name: 'Monterey', type: 'NDB', frequency: '404', coordinates: [-121.8430, 36.5870], morseCode: '-- .-. -.--' },
  { id: 'PRB', name: 'Paso Robles', type: 'NDB', frequency: '391', coordinates: [-120.6277, 35.6719], morseCode: '.--. .-. -...' },
  { id: 'SBP', name: 'San Luis Obispo', type: 'NDB', frequency: '400', coordinates: [-120.6428, 35.2368], morseCode: '... -... .--.' },
];

// Published GPS Fixes and Intersections
export const FIX_DATA: Fix[] = [
  // San Francisco Bay Area
  { id: 'VPFRC', name: 'VPFRC', type: 'RNAV', coordinates: [-122.2000, 37.5000], description: 'SF Bay RNAV fix' },
  { id: 'BRIXX', name: 'BRIXX', type: 'RNAV', coordinates: [-122.0856, 37.5417], description: 'Oakland Arrival' },
  { id: 'CEDES', name: 'CEDES', type: 'RNAV', coordinates: [-122.1944, 37.6083], description: 'OAK RNAV approach' },
  { id: 'FAITH', name: 'FAITH', type: 'RNAV', coordinates: [-122.2750, 37.6583], description: 'SFO approach' },
  { id: 'HADLY', name: 'HADLY', type: 'RNAV', coordinates: [-122.4678, 37.4806], description: 'SFO departure' },
  { id: 'KSFO', name: 'SFO Airport', type: 'GPS', coordinates: [-122.3790, 37.6213], description: 'San Francisco Intl' },
  { id: 'KLAX', name: 'LAX Airport', type: 'GPS', coordinates: [-118.4081, 33.9425], description: 'Los Angeles Intl' },
  { id: 'PIRAT', name: 'PIRAT', type: 'RNAV', coordinates: [-122.3486, 37.9236], description: 'Oakland departure' },
  { id: 'REBAS', name: 'REBAS', type: 'RNAV', coordinates: [-122.1247, 37.7203], description: 'SFO arrival' },
  { id: 'SERFR', name: 'SERFR', type: 'RNAV', coordinates: [-122.0606, 36.9706], description: 'Big Sur transition' },
  { id: 'SSTIK', name: 'SSTIK', type: 'RNAV', coordinates: [-122.3139, 37.7044], description: 'SFO RNAV' },
  { id: 'TYCOB', name: 'TYCOB', type: 'RNAV', coordinates: [-122.5147, 37.7500], description: 'SFO approach' },
  { id: 'WAMMY', name: 'WAMMY', type: 'RNAV', coordinates: [-122.1222, 37.6694], description: 'OAK departure' },
  
  // Los Angeles Area
  { id: 'CIVET', name: 'CIVET', type: 'RNAV', coordinates: [-118.1528, 33.8750], description: 'LAX arrival' },
  { id: 'DAFFY', name: 'DAFFY', type: 'RNAV', coordinates: [-118.6222, 33.9833], description: 'LAX approach' },
  { id: 'GAVIN', name: 'GAVIN', type: 'RNAV', coordinates: [-117.6556, 34.0833], description: 'SoCal transition' },
  { id: 'GRAAS', name: 'GRAAS', type: 'RNAV', coordinates: [-118.4017, 33.7550], description: 'LAX departure' },
  { id: 'JEFFY', name: 'JEFFY', type: 'RNAV', coordinates: [-117.8444, 33.5667], description: 'LAX arrival' },
  { id: 'LIMMA', name: 'LIMMA', type: 'RNAV', coordinates: [-118.3500, 33.6667], description: 'LAX approach' },
  { id: 'SEAVU', name: 'SEAVU', type: 'RNAV', coordinates: [-118.8833, 33.8333], description: 'LAX departure' },
  { id: 'SYMON', name: 'SYMON', type: 'RNAV', coordinates: [-118.7000, 34.4500], description: 'VNY transition' },
  
  // Pacific Northwest
  { id: 'BRAND', name: 'BRAND', type: 'RNAV', coordinates: [-122.5500, 47.2333], description: 'SEA approach' },
  { id: 'GLASR', name: 'GLASR', type: 'RNAV', coordinates: [-122.4667, 47.5500], description: 'SEA departure' },
  { id: 'HAWKZ', name: 'HAWKZ', type: 'RNAV', coordinates: [-122.3167, 47.3667], description: 'SEA arrival' },
  { id: 'KRATR', name: 'KRATR', type: 'RNAV', coordinates: [-122.1833, 45.7000], description: 'PDX approach' },
  
  // Denver Area
  { id: 'DANDY', name: 'DANDY', type: 'RNAV', coordinates: [-104.8333, 39.9500], description: 'DEN arrival' },
  { id: 'ELBERT', name: 'ELBERT', type: 'INTERSECTION', coordinates: [-105.0667, 39.6000], description: 'DEN transition' },
  { id: 'TOMSN', name: 'TOMSN', type: 'RNAV', coordinates: [-104.5500, 39.7833], description: 'DEN departure' },
  
  // East Coast
  { id: 'BIGGY', name: 'BIGGY', type: 'RNAV', coordinates: [-73.9000, 40.9000], description: 'JFK approach' },
  { id: 'CAMRN', name: 'CAMRN', type: 'RNAV', coordinates: [-73.7333, 40.8333], description: 'LGA approach' },
  { id: 'COATE', name: 'COATE', type: 'RNAV', coordinates: [-73.8333, 41.0833], description: 'NY Metro fix' },
  { id: 'MERIT', name: 'MERIT', type: 'RNAV', coordinates: [-73.4167, 40.9833], description: 'NY departure' },
  { id: 'PARKE', name: 'PARKE', type: 'RNAV', coordinates: [-74.4167, 40.3000], description: 'EWR approach' },
  { id: 'WAVEY', name: 'WAVEY', type: 'RNAV', coordinates: [-73.0000, 40.5000], description: 'NY oceanic' },
  
  // Florida
  { id: 'BRTOW', name: 'BRTOW', type: 'RNAV', coordinates: [-80.4500, 26.0833], description: 'MIA arrival' },
  { id: 'RNGRR', name: 'RNGRR', type: 'RNAV', coordinates: [-81.2000, 28.7667], description: 'ORL departure' },
  { id: 'WINCO', name: 'WINCO', type: 'RNAV', coordinates: [-82.3333, 28.1667], description: 'TPA approach' },
  
  // Atlanta Area
  { id: 'BANNG', name: 'BANNG', type: 'RNAV', coordinates: [-84.3333, 33.8500], description: 'ATL arrival' },
  { id: 'FLCON', name: 'FLCON', type: 'RNAV', coordinates: [-84.5500, 33.5833], description: 'ATL departure' },
  { id: 'MAGIO', name: 'MAGIO', type: 'RNAV', coordinates: [-84.2167, 33.5000], description: 'ATL approach' },
];

// Utility functions
export const getAllNavaids = (): Navaid[] => {
  const vors: Navaid[] = VOR_DATA.map(v => ({
    id: v.id,
    name: v.name,
    type: v.type as NavaidType,
    coordinates: v.coordinates,
    frequency: v.frequency,
    morseCode: v.morseCode,
  }));
  
  const ndbs: Navaid[] = NDB_DATA.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type as NavaidType,
    coordinates: n.coordinates,
    frequency: n.frequency,
    morseCode: n.morseCode,
  }));
  
  const fixes: Navaid[] = FIX_DATA.map(f => ({
    id: f.id,
    name: f.name,
    type: 'FIX' as NavaidType,
    coordinates: f.coordinates,
    description: f.description,
  }));
  
  return [...vors, ...ndbs, ...fixes];
};

export const findNavaidById = (id: string): Navaid | undefined => {
  const allNavaids = getAllNavaids();
  return allNavaids.find(n => n.id.toUpperCase() === id.toUpperCase());
};

export const findNavaidsNear = (lat: number, lng: number, radiusNM: number = 50): Navaid[] => {
  const radiusDeg = radiusNM / 60;
  return getAllNavaids().filter(navaid => {
    const dLat = Math.abs(navaid.coordinates[1] - lat);
    const dLng = Math.abs(navaid.coordinates[0] - lng);
    return dLat <= radiusDeg && dLng <= radiusDeg;
  });
};

export const getNavaidIcon = (type: NavaidType): string => {
  switch (type) {
    case 'VOR':
    case 'VOR-DME':
    case 'VORTAC':
    case 'TACAN':
      return '◈';
    case 'NDB':
    case 'NDB-DME':
      return '◉';
    case 'FIX':
    case 'RNAV':
      return '△';
    default:
      return '•';
  }
};

export const getNavaidColor = (type: NavaidType): string => {
  switch (type) {
    case 'VOR':
    case 'VOR-DME':
    case 'VORTAC':
    case 'TACAN':
      return 'hsl(142, 76%, 36%)'; // Success green
    case 'NDB':
    case 'NDB-DME':
      return 'hsl(280, 70%, 50%)'; // Purple
    case 'FIX':
    case 'RNAV':
      return 'hsl(214, 100%, 50%)'; // Primary blue
    default:
      return 'hsl(215, 15%, 45%)'; // Muted
  }
};
