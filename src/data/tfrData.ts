// TFR (Temporary Flight Restriction) data
// Sample TFRs for demonstration - in production, these would be fetched from FAA NOTAM service

export interface TFR {
  id: string;
  type: 'sport' | 'vip' | 'hazard' | 'fire' | 'security' | 'other';
  name: string;
  description: string;
  center: [number, number]; // [lat, lng]
  radius: number; // nautical miles
  floor: number; // feet MSL or AGL
  ceiling: number; // feet MSL
  effectiveStart: string; // ISO date string
  effectiveEnd: string; // ISO date string
  notamNumber: string;
  isActive: boolean;
}

// Sample TFR data - typically sourced from FAA TFR API
export const TFR_DATA: TFR[] = [
  {
    id: 'tfr-1',
    type: 'vip',
    name: 'Presidential TFR',
    description: 'VIP Movement - Washington DC Area',
    center: [38.8977, -77.0365],
    radius: 30,
    floor: 0,
    ceiling: 18000,
    effectiveStart: '2024-01-01T00:00:00Z',
    effectiveEnd: '2024-12-31T23:59:59Z',
    notamNumber: 'FDC 4/0001',
    isActive: true,
  },
  {
    id: 'tfr-2',
    type: 'sport',
    name: 'NFL Game TFR',
    description: 'Sporting Event - SoFi Stadium',
    center: [33.9534, -118.3390],
    radius: 3,
    floor: 0,
    ceiling: 3000,
    effectiveStart: '2024-01-14T17:00:00Z',
    effectiveEnd: '2024-01-14T23:00:00Z',
    notamNumber: 'FDC 4/0234',
    isActive: true,
  },
  {
    id: 'tfr-3',
    type: 'fire',
    name: 'Wildfire TFR',
    description: 'Firefighting Operations - California',
    center: [34.4208, -119.6982],
    radius: 5,
    floor: 0,
    ceiling: 8000,
    effectiveStart: '2024-01-10T00:00:00Z',
    effectiveEnd: '2024-01-20T23:59:59Z',
    notamNumber: 'FDC 4/0567',
    isActive: true,
  },
  {
    id: 'tfr-4',
    type: 'hazard',
    name: 'Space Launch TFR',
    description: 'SpaceX Launch Operations - Cape Canaveral',
    center: [28.5623, -80.5774],
    radius: 30,
    floor: 0,
    ceiling: 99999,
    effectiveStart: '2024-01-15T10:00:00Z',
    effectiveEnd: '2024-01-15T16:00:00Z',
    notamNumber: 'FDC 4/0789',
    isActive: true,
  },
  {
    id: 'tfr-5',
    type: 'security',
    name: 'Security TFR',
    description: 'National Security Area - Camp David',
    center: [39.6480, -77.4650],
    radius: 3,
    floor: 0,
    ceiling: 5000,
    effectiveStart: '2024-01-01T00:00:00Z',
    effectiveEnd: '2024-12-31T23:59:59Z',
    notamNumber: 'FDC 4/0890',
    isActive: true,
  },
  {
    id: 'tfr-6',
    type: 'sport',
    name: 'MLB All-Star Game',
    description: 'Sporting Event - Dodger Stadium',
    center: [34.0739, -118.2400],
    radius: 3,
    floor: 0,
    ceiling: 3000,
    effectiveStart: '2024-07-16T18:00:00Z',
    effectiveEnd: '2024-07-17T02:00:00Z',
    notamNumber: 'FDC 4/1234',
    isActive: true,
  },
];

// TFR type colors and styling
export const TFR_COLORS: Record<TFR['type'], {
  fill: string;
  stroke: string;
  icon: string;
}> = {
  vip: {
    fill: 'rgba(255, 0, 0, 0.25)',
    stroke: '#FF0000',
    icon: '🛡️',
  },
  sport: {
    fill: 'rgba(255, 165, 0, 0.25)',
    stroke: '#FFA500',
    icon: '🏟️',
  },
  fire: {
    fill: 'rgba(255, 69, 0, 0.25)',
    stroke: '#FF4500',
    icon: '🔥',
  },
  hazard: {
    fill: 'rgba(255, 215, 0, 0.25)',
    stroke: '#FFD700',
    icon: '⚠️',
  },
  security: {
    fill: 'rgba(139, 0, 0, 0.25)',
    stroke: '#8B0000',
    icon: '🔒',
  },
  other: {
    fill: 'rgba(128, 128, 128, 0.25)',
    stroke: '#808080',
    icon: '📍',
  },
};

// Helper to get TFR label
export const getTFRLabel = (tfr: TFR): string => {
  return `${tfr.name}\n${tfr.description}\nNOTAM: ${tfr.notamNumber}`;
};
